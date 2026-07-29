/**
 * Lane's conversation engine, one door for both modes.
 *
 * With an API key: live Claude conversation under the golden-rule system
 * prompt with the strict JSON contract (§8.2/8.3). Without a key, or the
 * moment anything fails (network, bad key, malformed JSON), the same
 * request is answered from the scripted playbook instead, so a visit can
 * NEVER crash or show raw model text to the person (PRD §13, §16.4).
 */

import { FREE_TEXT_ACKS, type Theme } from '../../data/themes'
import type { Message, Profile, Visit, VisitSummary } from '../../types'
import { addLearnedFacts, loadSettings } from '../../lib/storage'
import { callMessages, type ChatTurn } from './apiClient'
import { parseLaneReply, parseSummary } from './parser'
import {
  buildLaneSystemPrompt,
  buildSummarySystemPrompt,
  renderTranscriptForSummary,
} from './prompt'

export interface LaneTurnRequest {
  profile: Profile
  theme: Theme
  /** How many Lane messages have already been shown in the talk step. */
  turnIndex: number
  /** The talk-step transcript so far. */
  history: Message[]
  /** The person's most recent answer (chip label or typed text). */
  lastAnswer?: string
  /** The one gentle fact chosen for this visit (spaced retrieval). */
  fact?: string
}

export interface LaneTurn {
  message: string
  suggestions: string[]
  /** True when this is Lane's warm wrap-up for the talk step. */
  done: boolean
  /** True when this turn restated the gentle fact. */
  factShared?: boolean
  /** Where the turn came from, lets the visit record its mode honestly. */
  source: 'ai' | 'scripted'
}

/** Scripted turns end after the opener, two follow-ups, and a wrap-up. */
export const SCRIPTED_FINAL_TURN = 3

/**
 * How Lane responds to what was actually said (validation therapy: mirror
 * their words back). A tapped chip has a hand-written acknowledgment; a
 * typed answer gets a warm generic one.
 */
function acknowledgeAnswer(request: LaneTurnRequest): string {
  const { theme, turnIndex, lastAnswer } = request
  if (!lastAnswer || turnIndex === 0) return ''
  const previousTurn = theme.turns[turnIndex - 1]
  const chip = previousTurn?.chips.find((c) => c.label === lastAnswer)
  if (chip) return chip.ack
  return FREE_TEXT_ACKS[turnIndex % FREE_TEXT_ACKS.length]
}

export function scriptedTurn(request: LaneTurnRequest): LaneTurn {
  const { profile, theme, turnIndex, fact } = request
  const ack = acknowledgeAnswer(request)

  if (turnIndex < theme.turns.length) {
    const turn = theme.turns[turnIndex]
    return {
      message: ack ? `${ack} ${turn.share}` : turn.share,
      suggestions: turn.chips.map((c) => c.label),
      done: false,
      source: 'scripted',
    }
  }

  // Wrap-up: restate the gentle fact as a warm statement, never a quiz.
  if (fact) {
    return {
      message: `${ack ? ack + ' ' : ''}One more lovely thing, ${profile.preferredName}: ${fact}`,
      suggestions: ["That's right", "That's nice to hear"],
      done: true,
      factShared: true,
      source: 'scripted',
    }
  }
  return {
    message: ack ? `${ack} ${theme.closing}` : theme.closing,
    suggestions: ['That was lovely', 'Thank you'],
    done: true,
    source: 'scripted',
  }
}

/* ------------------------- scripted visit summary ------------------------ */

const MOOD_WORDS = ['not so good', 'a little low', 'okay', 'good', 'wonderful']

/**
 * The no-key recap (§8.6): a simple, honest template. It reports
 * engagement and mood only, memory performance is never scored (FR-29).
 */
export function scriptedSummary(visit: Visit, profile: Profile): VisitSummary {
  const patientReplies = visit.transcript.filter((m) => m.role === 'patient')
  const substantial = patientReplies.filter(
    (m) => !/^(i'?m not sure|tell me more)$/i.test(m.text.trim())
  )

  let engagement = 3
  if (visit.mood !== undefined && visit.mood >= 4) engagement += 1
  if (substantial.length >= 4) engagement += 1
  if (patientReplies.length <= 1) engagement -= 1
  engagement = Math.max(1, Math.min(5, engagement))

  const moodWord =
    visit.mood !== undefined ? MOOD_WORDS[visit.mood - 1] : 'not recorded'

  const highlights = substantial
    .slice(0, 2)
    .map((m) => `Answered warmly: “${m.text}”`)
  if (visit.factReinforced) {
    highlights.push(`Heard their gentle fact: “${visit.factReinforced}”`)
  }

  const flags: string[] = []
  if (visit.mood !== undefined && visit.mood <= 2) {
    flags.push('Mood was on the low side at check-in, worth a gentle eye today.')
  }

  return {
    summary:
      `${profile.preferredName} completed a visit on the theme “${visit.theme},” ` +
      `answering ${patientReplies.length} time${patientReplies.length === 1 ? '' : 's'}. ` +
      `Mood at check-in: ${moodWord}. ` +
      `(This recap is template-based, add an API key in Settings for richer AI summaries.)`,
    engagement,
    highlights,
    flags,
    encouragement:
      'Showing up is the whole gift, these small visits matter more than they look.',
    generatedBy: 'scripted',
  }
}

/* ------------------------------ the AI path ------------------------------ */

/**
 * The talk-step transcript becomes Claude chat turns. Lane's earlier
 * replies are re-encoded as the JSON they arrived in, which quietly
 * reinforces the reply contract on every call.
 */
function toChatTurns(request: LaneTurnRequest): ChatTurn[] {
  const turns: ChatTurn[] = []
  for (const message of request.history) {
    if (message.role === 'lane') {
      if (!message.suggestions) continue // greeting/mood lines aren't chat turns
      turns.push({
        role: 'assistant',
        content: JSON.stringify({
          message: message.text,
          suggestions: message.suggestions,
        }),
      })
    } else {
      turns.push({ role: 'user', content: message.text })
    }
  }

  // Control notes travel as bracketed user text (§8.2). They open the
  // conversation and cue the warm wrap-up on the final exchange.
  if (turns.length === 0 || turns[turns.length - 1].role === 'assistant') {
    turns.push({ role: 'user', content: '[The visit is beginning. Open the conversation now.]' })
  } else if (request.turnIndex >= SCRIPTED_FINAL_TURN) {
    turns[turns.length - 1] = {
      role: 'user',
      content:
        turns[turns.length - 1].content +
        '\n\n[This is the last exchange of today\'s chat. Warmly wrap up in 1-2 sentences' +
        (request.fact ? ' and weave in the gentle fact as a warm statement' : '') +
        '. Keep the suggestions to simple acknowledgments.]',
    }
  }
  return turns
}

async function aiTurn(request: LaneTurnRequest): Promise<LaneTurn | null> {
  const settings = loadSettings()
  if (!settings.apiKey) return null

  const result = await callMessages({
    apiKey: settings.apiKey,
    model: settings.model,
    system: buildLaneSystemPrompt(request.profile, request.theme, request.fact),
    messages: toChatTurns(request),
    maxTokens: 300,
  })
  if (!result.ok) return null

  const parsed = parseLaneReply(result.text)
  if (!parsed) return null // malformed JSON → caller falls back (§16.4)

  const done = request.turnIndex >= SCRIPTED_FINAL_TURN
  return {
    message: parsed.message,
    suggestions: parsed.suggestions,
    done,
    factShared: done && Boolean(request.fact),
    source: 'ai',
  }
}

/* ----------------------- entry points used by the UI ---------------------- */

export async function nextLaneTurn(request: LaneTurnRequest): Promise<LaneTurn> {
  try {
    const turn = await aiTurn(request)
    if (turn) return turn
  } catch {
    /* any surprise still lands on the scripted path */
  }
  return scriptedTurn(request)
}

export async function buildVisitSummary(
  visit: Visit,
  profile: Profile
): Promise<VisitSummary> {
  try {
    const settings = loadSettings()
    if (settings.apiKey) {
      const result = await callMessages({
        apiKey: settings.apiKey,
        model: settings.model,
        system: buildSummarySystemPrompt(profile),
        messages: [{ role: 'user', content: renderTranscriptForSummary(visit, profile) }],
        maxTokens: 500,
      })
      if (result.ok) {
        const parsed = parseSummary(result.text)
        if (parsed) {
          // Queue "Lane noticed" candidates for the caretaker's review
          // inbox (PDR v1.2 §2). Preview visits never learn.
          const { learned, ...summary } = parsed
          if (!visit.preview && learned.length) {
            try {
              addLearnedFacts(visit.profileId, learned, visit.id, visit.date)
            } catch {
              /* the summary must never fail because learning did */
            }
          }
          return { ...summary, generatedBy: 'ai' }
        }
      }
    }
  } catch {
    /* fall through to the honest template */
  }
  return scriptedSummary(visit, profile)
}

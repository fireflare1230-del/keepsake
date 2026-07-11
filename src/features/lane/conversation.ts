/**
 * Lane's conversation engine.
 *
 * M4: the scripted playbook (no key needed — PRD §8.6).
 * M5 adds the AI path; the check-in UI only ever calls nextLaneTurn(),
 * so both modes flow through one door and AI failures fall back to the
 * scripted lines mid-visit without breaking anything (PRD §13).
 */

import type { Theme } from '../../data/themes'
import type { Message, Profile, Visit, VisitSummary } from '../../types'

export interface LaneTurnRequest {
  profile: Profile
  theme: Theme
  /** How many Lane messages have already been shown in the talk step. */
  turnIndex: number
  /** The talk-step transcript so far. */
  history: Message[]
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
}

/** Scripted turns end after the opener, two follow-ups, and a wrap-up. */
export const SCRIPTED_FINAL_TURN = 3

export function scriptedTurn(request: LaneTurnRequest): LaneTurn {
  const { profile, theme, turnIndex, fact } = request

  if (turnIndex < theme.turns.length) {
    const turn = theme.turns[turnIndex]
    return { message: turn.message, suggestions: turn.suggestions, done: false }
  }

  // Wrap-up: restate the gentle fact as a warm statement — never a quiz.
  if (fact) {
    return {
      message: `One more lovely thing, ${profile.preferredName}: ${fact}`,
      suggestions: ["That's right", "That's nice to hear"],
      done: true,
      factShared: true,
    }
  }
  return {
    message: theme.closing,
    suggestions: ['That was lovely', 'Thank you'],
    done: true,
  }
}

/* ------------------------- scripted visit summary ------------------------ */

const MOOD_WORDS = ['not so good', 'a little low', 'okay', 'good', 'wonderful']

/**
 * The no-key recap (§8.6): a simple, honest template. It reports
 * engagement and mood only — memory performance is never scored (FR-29).
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
    flags.push('Mood was on the low side at check-in — worth a gentle eye today.')
  }

  return {
    summary:
      `${profile.preferredName} completed a visit on the theme “${visit.theme},” ` +
      `answering ${patientReplies.length} time${patientReplies.length === 1 ? '' : 's'}. ` +
      `Mood at check-in: ${moodWord}. ` +
      `(This recap is template-based — add an API key in Settings for richer AI summaries.)`,
    engagement,
    highlights,
    flags,
    encouragement:
      'Showing up is the whole gift — these small visits matter more than they look.',
    generatedBy: 'scripted',
  }
}

/* ----------------------- entry points used by the UI ---------------------- */
/* M5 replaces the bodies of these two with AI-first, scripted-fallback.    */

export async function nextLaneTurn(request: LaneTurnRequest): Promise<LaneTurn> {
  return scriptedTurn(request)
}

export async function buildVisitSummary(
  visit: Visit,
  profile: Profile
): Promise<VisitSummary> {
  return scriptedSummary(visit, profile)
}

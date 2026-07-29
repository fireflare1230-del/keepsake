/**
 * Bulletproof JSON extraction (PRD §8.3 / §16.4).
 *
 * Models occasionally wrap JSON in prose or code fences. Strategy:
 * strip fences → find the first balanced {...} → JSON.parse → validate
 * the shape → gently normalize. On any failure the caller falls back to
 * a safe scripted line, raw model text is never shown to the person.
 */

import type { LearnedCategory } from '../../types'

export interface ParsedLaneReply {
  message: string
  suggestions: string[]
}

export interface ParsedLearnedFact {
  category: LearnedCategory
  value: string
  quote?: string
}

export interface ParsedSummary {
  summary: string
  engagement: number
  highlights: string[]
  flags: string[]
  encouragement: string
  /** Candidate "Lane noticed" facts, already whitelisted and trimmed. */
  learned: ParsedLearnedFact[]
}

const LEARNED_CATEGORIES: LearnedCategory[] = [
  'hometown',
  'happyMemory',
  'food',
  'drink',
  'sport',
  'show',
  'hobby',
  'lifeStory',
  'delight',
  'avoid',
]

/** Find the first balanced JSON object in a string. */
export function extractFirstJsonObject(text: string): string | null {
  const cleaned = text.replace(/```(?:json)?/gi, '')
  const start = cleaned.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = inString
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return cleaned.slice(start, i + 1)
    }
  }
  return null
}

function parseJson(text: string): unknown | null {
  const candidate = extractFirstJsonObject(text)
  if (!candidate) return null
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

/** Keep Lane's replies short and calm: at most three sentences. */
function trimToThreeSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g)
  if (!sentences || sentences.length <= 3) return text.trim()
  return sentences.slice(0, 3).join('').trim()
}

const EXIT_CHIP = /not sure|tell me more|don'?t know|just listen/i

/**
 * Chips that would put a claim in the person's mouth ("We watched every
 * game", "I always grew roses", "I drank tea this morning"). The system
 * prompt forbids these; this is defense in depth for the rare slip.
 */
const CLAIM_CHIP = /^(we|i)\s+(always|never|used to|would|had|did|went|watched|drank|ate|grew|made|played)\b|^every\s/i

/** Validate + normalize a conversational reply. Null means "fall back". */
export function parseLaneReply(raw: string): ParsedLaneReply | null {
  const data = parseJson(raw) as { message?: unknown; suggestions?: unknown } | null
  if (!data || typeof data.message !== 'string' || !data.message.trim()) return null

  // House style: no em dashes ever reach the screen.
  const message = trimToThreeSentences(data.message)
    .replace(/\s*—\s*/g, ', ')
    .replace(/–/g, '-')

  let suggestions = Array.isArray(data.suggestions)
    ? data.suggestions
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 48))
    : []
  // Dedupe, drop claim-shaped chips, cap at 3 (calm beats cluttered),
  // guarantee the gentle exit (§8.3).
  suggestions = Array.from(new Set(suggestions))
    .filter((s) => !CLAIM_CHIP.test(s))
    .slice(0, 3)
  if (suggestions.length === 0) suggestions = ['That sounds nice', 'Tell me more']
  if (!suggestions.some((s) => EXIT_CHIP.test(s))) {
    suggestions = [...suggestions.slice(0, 2), "I'm not sure"]
  }

  return { message, suggestions }
}

/** Validate + normalize the post-visit caretaker summary (§8.4). */
export function parseSummary(raw: string): ParsedSummary | null {
  const data = parseJson(raw) as Record<string, unknown> | null
  if (!data || typeof data.summary !== 'string' || !data.summary.trim()) return null

  const toStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : []

  const engagementRaw = Number(data.engagement)
  const engagement = Number.isFinite(engagementRaw)
    ? Math.max(1, Math.min(5, Math.round(engagementRaw)))
    : 3

  // "learned" candidates: whitelist the category, require a value, cap
  // at 3 (PDR v1.2 §2.2). Anything malformed is dropped, never fails
  // the whole summary.
  const learned: ParsedLearnedFact[] = Array.isArray(data.learned)
    ? (data.learned as unknown[])
        .map((item): ParsedLearnedFact | null => {
          if (typeof item !== 'object' || item === null) return null
          const { category, value, quote } = item as Record<string, unknown>
          if (typeof value !== 'string' || !value.trim()) return null
          if (
            typeof category !== 'string' ||
            !LEARNED_CATEGORIES.includes(category as LearnedCategory)
          ) {
            return null
          }
          return {
            category: category as LearnedCategory,
            value: value.trim().slice(0, 120),
            quote:
              typeof quote === 'string' && quote.trim()
                ? quote.trim().slice(0, 200)
                : undefined,
          }
        })
        .filter((f): f is ParsedLearnedFact => f !== null)
        .slice(0, 3)
    : []

  return {
    summary: data.summary.trim(),
    engagement,
    highlights: toStringArray(data.highlights).slice(0, 5),
    flags: toStringArray(data.flags).slice(0, 4),
    learned,
    encouragement:
      typeof data.encouragement === 'string' && data.encouragement.trim()
        ? data.encouragement.trim()
        : 'These visits are a real gift, keep going at whatever pace feels right.',
  }
}

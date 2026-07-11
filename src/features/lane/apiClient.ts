/**
 * apiClient.ts — the ONLY module in Keepsake that talks to the network
 * (PRD §11.4). It calls the Anthropic Messages API directly from the
 * browser with the user's own key.
 *
 * BILLING SAFETY (PRD §6): there is no key in this code and no server.
 * The key comes from the user's localStorage and is sent ONLY to
 * api.anthropic.com, using Anthropic's supported browser-direct pattern
 * (the anthropic-dangerous-direct-browser-access header).
 */

const API_URL = 'https://api.anthropic.com/v1/messages'
const API_VERSION = '2023-06-01'

export type LaneErrorKind =
  | 'no-key'
  | 'auth' // invalid or expired key
  | 'rate-limit'
  | 'network'
  | 'bad-response'
  | 'unknown'

export interface LaneError {
  kind: LaneErrorKind
  /** Calm, human message — safe to show a caretaker. */
  message: string
}

export type LaneResult =
  | { ok: true; text: string }
  | { ok: false; error: LaneError }

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** One central place turns every failure into a calm, useful message. */
function describeStatus(status: number): LaneError {
  if (status === 401 || status === 403) {
    return {
      kind: 'auth',
      message:
        "That API key didn't work — let's check it. Open Settings → Test connection after pasting it again.",
    }
  }
  if (status === 429) {
    return {
      kind: 'rate-limit',
      message: "Let's pause a moment — the AI service asked us to slow down. Try again shortly.",
    }
  }
  if (status >= 500) {
    return {
      kind: 'network',
      message: 'The AI service had a hiccup. It usually passes in a minute.',
    }
  }
  return {
    kind: 'unknown',
    message: 'Something unexpected came back from the AI service.',
  }
}

export async function callMessages(options: {
  apiKey: string | undefined
  model: string
  system: string
  messages: ChatTurn[]
  maxTokens?: number
}): Promise<LaneResult> {
  const { apiKey, model, system, messages, maxTokens = 400 } = options

  if (!apiKey) {
    return {
      ok: false,
      error: {
        kind: 'no-key',
        message: 'No API key is set — Keepsake will use its built-in prompts instead.',
      },
    }
  }

  let response: Response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
        // Anthropic's supported bring-your-own-key browser pattern.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages,
      }),
    })
  } catch {
    return {
      ok: false,
      error: {
        kind: 'network',
        message: "We couldn't reach the internet just now. The visit can continue with built-in prompts.",
      },
    }
  }

  if (!response.ok) {
    return { ok: false, error: describeStatus(response.status) }
  }

  try {
    const data = await response.json()
    const text = (data?.content ?? [])
      .filter((block: { type?: string }) => block?.type === 'text')
      .map((block: { text?: string }) => block?.text ?? '')
      .join('')
      .trim()
    if (!text) {
      return {
        ok: false,
        error: { kind: 'bad-response', message: 'The AI reply came back empty.' },
      }
    }
    return { ok: true, text }
  } catch {
    return {
      ok: false,
      error: { kind: 'bad-response', message: "The AI reply couldn't be read." },
    }
  }
}

/** Settings → "Test connection" (FR-27). Tiny and cheap on purpose. */
export async function testConnection(
  apiKey: string | undefined,
  model: string
): Promise<{ ok: boolean; message: string }> {
  if (!apiKey) {
    return { ok: false, message: 'Paste an API key first, then test it.' }
  }
  const result = await callMessages({
    apiKey,
    model,
    system: 'You are a connection test. Reply with exactly: ok',
    messages: [{ role: 'user', content: 'ping' }],
    maxTokens: 8,
  })
  if (result.ok) {
    return { ok: true, message: 'Connected — Lane is ready for AI conversations.' }
  }
  return { ok: false, message: result.error.message }
}

/**
 * Voice helpers (NFR-5, FR-15) with honest feature detection (§16.7):
 * speech synthesis (read aloud) is widely supported; speech recognition
 * (voice input) mostly exists in Chrome/Edge and needs HTTPS/localhost.
 * Where a feature is missing we hide the button, nothing looks broken.
 */

/* ------------------------------ read aloud ------------------------------ */

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Not all voices are equal: the classic robotic system voices sit right
 * next to modern neural ones in the same list. Score each English voice
 * so the warmest, most human option wins by default. On Windows
 * Edge/Chrome this typically selects a Microsoft "(Natural)" voice such
 * as Aria or Jenny.
 */
export function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase()
  let score = 0
  if (!voice.lang.toLowerCase().startsWith('en')) return -1
  if (name.includes('natural')) score += 100 // Microsoft neural voices
  if (name.includes('neural')) score += 100
  if (name.includes('online')) score += 20
  if (/aria|jenny|sonia|libby|michelle|emma|ana\b/.test(name)) score += 15
  if (name.includes('google')) score += 40 // Chrome's better built-ins
  if (/samantha|karen|moira|tessa/.test(name)) score += 30 // decent Apple voices
  if (/zira|david|mark\b|microsoft (?!.*natural)/.test(name) && !name.includes('natural'))
    score += 5 // legacy Microsoft voices: last resort
  if (voice.localService) score += 2 // tiny tie-break: works offline
  return score
}

/** All usable English voices, best first. May be empty until voices load. */
export function listVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return []
  return window.speechSynthesis
    .getVoices()
    .filter((v) => scoreVoice(v) >= 0)
    .sort((a, b) => scoreVoice(b) - scoreVoice(a))
}

/**
 * Voices load asynchronously in most browsers; this resolves once they
 * exist (or with an empty list if the browser truly has none).
 */
export function whenVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!canSpeak()) return resolve([])
    const existing = listVoices()
    if (existing.length) return resolve(existing)
    const timeout = setTimeout(() => resolve(listVoices()), 2000)
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout)
      resolve(listVoices())
    }
  })
}

function resolveVoice(voiceURI?: string): SpeechSynthesisVoice | undefined {
  const voices = listVoices()
  if (voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === voiceURI)
    if (chosen) return chosen
  }
  return voices[0] // best-scored voice
}

export function speak(text: string, voiceURI?: string): void {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const voice = resolveVoice(voiceURI)
  if (voice) utterance.voice = voice
  utterance.rate = 0.95 // a touch slower, unhurried, easy to follow
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel()
}

/* ------------------------------ voice input ------------------------------ */

// Minimal typings for the (still-prefixed) Web Speech recognition API.
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}
interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: RecognitionResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function canListen(): boolean {
  return Boolean(recognitionCtor()) && window.location.protocol !== 'file:'
}

export interface Listener {
  start: () => void
  stop: () => void
}

/**
 * One-shot voice capture: start(), the person speaks, onResult fires with
 * the transcript, onDone fires when listening stops (result or not).
 */
export function createListener(
  onResult: (transcript: string) => void,
  onDone: () => void
): Listener | null {
  const Ctor = recognitionCtor()
  if (!Ctor) return null
  const recognition = new Ctor()
  recognition.lang = navigator.language || 'en-US'
  recognition.interimResults = false
  recognition.maxAlternatives = 1
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript ?? ''
    if (transcript) onResult(transcript)
  }
  recognition.onend = onDone
  recognition.onerror = onDone
  return {
    start: () => {
      try {
        recognition.start()
      } catch {
        onDone()
      }
    },
    stop: () => {
      try {
        recognition.stop()
      } catch {
        /* already stopped */
      }
    },
  }
}

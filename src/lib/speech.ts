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
 * so the warmest, most human option wins by default.
 *
 * Lane's default voice is a WOMAN'S voice, warm and unhurried, the
 * voice of a caretaker. The Web Speech API doesn't expose gender, so
 * this ranks by the known female voice names on each platform
 * (Windows: Aria/Jenny/Michelle; Apple: Samantha/Ava/Karen; Chrome:
 * Google US English). Anyone can still pick a different voice in
 * Settings, the ranking only decides the default.
 */
const FEMALE_VOICES =
  /aria|jenny|jane|sonia|libby|michelle|emma|ana\b|ava\b|allison|susan|serena|samantha|karen|moira|tessa|catherine|hazel|heather|joanna|salli|kimberly|ivy\b|kendra|nicole|amy\b|olivia|zira|female|woman/
const MALE_VOICES =
  /david|mark\b|guy\b|george|daniel|alex\b|fred|james|ryan|eric|thomas|brian|christopher|william|matthew|male\b|\bman\b/

export function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase()
  let score = 0
  if (!voice.lang.toLowerCase().startsWith('en')) return -1
  if (name.includes('natural')) score += 100 // Microsoft neural voices
  if (name.includes('neural')) score += 100
  if (name.includes('online')) score += 20
  if (name.includes('google')) score += 40 // Chrome's better built-ins
  if (FEMALE_VOICES.test(name)) score += 60 // Lane sounds like a caretaker
  if (MALE_VOICES.test(name)) score -= 40
  if (/zira|microsoft (?!.*natural)/.test(name) && !name.includes('natural'))
    score += 5 // legacy Microsoft voices: last resort among the rest
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

/**
 * Voice helpers (NFR-5, FR-15) with honest feature detection (§16.7):
 * speech synthesis (read aloud) is widely supported; speech recognition
 * (voice input) mostly exists in Chrome/Edge and needs HTTPS/localhost.
 * Where a feature is missing we hide the button — nothing looks broken.
 */

/* ------------------------------ read aloud ------------------------------ */

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string): void {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.92 // a touch slower — unhurried, easy to follow
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

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
 * (Windows: Aria/Jenny/Michelle; Apple: Samantha/Ava/Karen; Android:
 * the Google "en-us-x-..-local" families). Anyone can still pick a
 * different voice in Settings, the ranking only decides the default.
 */
const FEMALE_VOICES =
  /aria|jenny|jane|sonia|libby|michelle|emma|ana\b|ava\b|allison|susan|serena|samantha|karen|moira|tessa|catherine|hazel|heather|joanna|salli|kimberly|ivy\b|kendra|nicole|amy\b|olivia|zira|fiona|veena|rishi|female|woman|\bf\b/
const MALE_VOICES =
  /david|mark\b|guy\b|george|daniel|alex\b|fred|james|ryan|eric|thomas|brian|christopher|william|matthew|arthur|oliver|male\b|\bman\b/

/**
 * Android/Chrome expose opaque ids like "en-us-x-tpf-local" instead of
 * names. In Google's scheme the third letter of the variant tag marks
 * the speaker set, and the "f"-suffixed families (tpf, sfg, iof, iob)
 * are the female ones. Best-effort, and harmless when it misses.
 */
const ANDROID_FEMALE = /en-\w+-x-[a-z]{2}f\b/
const ANDROID_MALE = /en-\w+-x-[a-z]{2}[dm]\b/

export function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const id = `${voice.name} ${voice.voiceURI}`.toLowerCase()
  if (MALE_VOICES.test(id) || ANDROID_MALE.test(id)) return false
  return FEMALE_VOICES.test(id) || ANDROID_FEMALE.test(id)
}

export function scoreVoice(voice: SpeechSynthesisVoice): number {
  const id = `${voice.name} ${voice.voiceURI}`.toLowerCase()
  const name = voice.name.toLowerCase()
  let score = 0
  if (!voice.lang.toLowerCase().startsWith('en')) return -1
  if (name.includes('natural')) score += 100 // Microsoft neural voices
  if (name.includes('neural')) score += 100
  if (name.includes('online')) score += 20
  if (name.includes('google')) score += 40 // Chrome's better built-ins
  // Lane sounds like a caretaker: a woman's voice wins decisively, and
  // outranks even a "natural" male voice.
  if (isFemaleVoice(voice)) score += 140
  if (MALE_VOICES.test(id) || ANDROID_MALE.test(id)) score -= 120
  if (/zira|microsoft (?!.*natural)/.test(name) && !name.includes('natural'))
    score += 5 // legacy Microsoft voices: last resort among the rest
  if (voice.localService) score += 2 // tiny tie-break: works offline
  return score
}

/**
 * All usable English voices, warmest first. May be empty until the
 * browser finishes loading its list.
 *
 * Filtering is by language only, never by score: a man's voice still
 * belongs in the picker if the caretaker wants it, and on a device
 * whose only English voice is male, an imperfect voice beats silence
 * (and beats a four-second wait for a list that will never improve).
 */
export function listVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return []
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('en'))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a))
}

/**
 * Voices load asynchronously in most browsers; this resolves once they
 * exist (or with an empty list if the browser truly has none).
 */
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null

export function whenVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  if (voicesPromise) return voicesPromise
  voicesPromise = new Promise((resolve) => {
    if (!canSpeak()) return resolve([])
    const existing = listVoices()
    if (existing.length) return resolve(existing)
    // Some engines only populate the list after the event; others never
    // fire it. Poll gently as well so neither case can strand us.
    const poll = setInterval(() => {
      const voices = listVoices()
      if (voices.length) {
        clearInterval(poll)
        clearTimeout(timeout)
        resolve(voices)
      }
    }, 120)
    const timeout = setTimeout(() => {
      clearInterval(poll)
      resolve(listVoices())
    }, 4000)
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      const voices = listVoices()
      if (!voices.length) return
      clearInterval(poll)
      clearTimeout(timeout)
      resolve(voices)
    })
  })
  return voicesPromise
}

function resolveVoice(voiceURI?: string): SpeechSynthesisVoice | undefined {
  const voices = listVoices()
  if (voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === voiceURI)
    if (chosen) return chosen
  }
  return voices[0] // best-scored voice
}

/**
 * Warm the voice list up as early as possible. Browsers populate it
 * lazily, and until they do, getVoices() returns [] and any utterance
 * plays in the system default voice, which is male on most Windows and
 * Android devices. Called once at boot.
 */
export function primeVoices(): void {
  if (!canSpeak()) return
  void whenVoicesReady()
}

/**
 * Say something in Lane's voice.
 *
 * The important detail: if the browser has not finished loading its
 * voice list yet (very common for the FIRST thing Lane says, the
 * greeting at the start of a visit), we wait for the list instead of
 * speaking immediately. Speaking immediately is what made the intro
 * come out in a man's voice: with no voice assigned, the browser uses
 * its own default. Waiting costs a few hundred milliseconds once.
 */
export function speak(text: string, voiceURI?: string): void {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()

  const say = (voice?: SpeechSynthesisVoice) => {
    const utterance = new SpeechSynthesisUtterance(text)
    if (voice) utterance.voice = voice
    utterance.rate = 0.95 // a touch slower, unhurried, easy to follow
    utterance.pitch = 1.02 // a hair brighter, reads as warmer
    window.speechSynthesis.speak(utterance)
  }

  const ready = resolveVoice(voiceURI)
  if (ready) {
    say(ready)
    return
  }
  // Voices are not in yet. Wait for them, then speak in the right voice.
  whenVoicesReady().then(() => say(resolveVoice(voiceURI)))
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

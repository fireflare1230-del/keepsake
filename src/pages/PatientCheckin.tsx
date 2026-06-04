import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MoodPicker from '../components/MoodPicker'
import {
  getProfile, saveProfile, saveVisit, updateStreak,
  generateId, getSettings,
} from '../lib/storage'
import {
  buildGreeting, getLaneOpening, getLaneReply,
  generateVisitSummary, getFallbackResponse,
  speakText, stopSpeaking, getYouTubeVideoId,
} from '../lib/ai'
import { getThemeForDate } from '../lib/themes'
import type { PatientProfile, Visit, DisplayMessage, YouTubeLink } from '../types'
import type { LaneResponse } from '../lib/ai'

// ─── Steps ───────────────────────────────────────────────────────────────────
type Step = 'greeting' | 'mood' | 'conversation' | 'music' | 'family' | 'celebration'
const MAX_CONV_TURNS = 4

// ─── Thinking indicator ───────────────────────────────────────────────────────
function Thinking() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-brand thinking-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

function LaneBubble({ message, onSpeak }: { message: string; onSpeak: () => void }) {
  return (
    <div className="flex gap-3 items-start fade-up max-w-[85%]">
      <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-lg shrink-0 mt-1">
        L
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-black/5 px-5 py-4">
        <p className="text-lg leading-relaxed text-navy">{message}</p>
        <button
          onClick={onSpeak}
          className="mt-2 text-sm text-brand/70 hover:text-brand transition-colors flex items-center gap-1"
          aria-label="Read aloud"
        >
          🔊 Read aloud
        </button>
      </div>
    </div>
  )
}

function PatientBubble({ message, name }: { message: string; name: string }) {
  return (
    <div className="flex gap-3 items-start justify-end fade-up">
      <div className="bg-primary/10 rounded-2xl rounded-tr-sm px-5 py-4 max-w-[80%]">
        <p className="text-sm font-semibold text-primary mb-1">{name}</p>
        <p className="text-lg leading-relaxed text-navy">{message}</p>
      </div>
    </div>
  )
}

// ─── Outer wrapper: handles null profile guard before any hooks ───────────────
export default function PatientCheckin() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate      = useNavigate()
  const profile       = getProfile(profileId ?? '')

  // Redirect if profile not found. Must be in an effect (not render body)
  // so it doesn't violate hooks rules in PatientCheckinContent below.
  useEffect(() => {
    if (!profile) navigate('/', { replace: true })
  }, [profile, navigate])

  if (!profile) return null
  return <PatientCheckinContent profile={profile} />
}

// ─── Inner component: all hooks here, profile is guaranteed non-null ──────────
function PatientCheckinContent({ profile }: { profile: PatientProfile }) {
  const navigate  = useNavigate()
  const settings  = getSettings()
  const theme     = getThemeForDate()

  const visitId   = useRef(generateId())
  const chatRef   = useRef<HTMLDivElement>(null)

  const [step,           setStep]          = useState<Step>('greeting')
  const [mood,           setMood]          = useState<number | null>(null)
  const [messages,       setMessages]      = useState<DisplayMessage[]>([])
  const [convTurn,       setConvTurn]      = useState(0)
  const [laneResp,       setLaneResp]      = useState<LaneResponse | null>(null)
  const [inputText,      setInputText]     = useState('')
  const [isThinking,     setIsThinking]    = useState(false)
  const [isListening,    setIsListening]   = useState(false)
  const [selectedMusic,  setSelectedMusic] = useState<YouTubeLink | null>(null)
  const [updatedProfile, setUpdatedProfile] = useState<PatientProfile | null>(null)

  const hasSpeech = useRef(
    !!(
      window.SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    ),
  )

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isThinking])

  // ── Greeting fires once on mount ──────────────────────────────────────────
  useEffect(() => {
    const greeting = buildGreeting(profile)
    setLaneResp(greeting)
    const msg: DisplayMessage = {
      role: 'lane', content: greeting.message, timestamp: new Date().toISOString(),
    }
    setMessages([msg])
    if (settings.readAloud !== false) speakText(greeting.message)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function addMsg(role: DisplayMessage['role'], content: string): DisplayMessage {
    const msg: DisplayMessage = { role, content, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, msg])
    return msg
  }

  function speak(text: string) {
    if (settings.readAloud !== false) speakText(text)
  }

  // ── Start AI conversation after mood is selected ──────────────────────────
  async function startConversation() {
    setStep('conversation')
    setIsThinking(true)
    try {
      let resp: LaneResponse
      if (settings.apiKey) {
        resp = await getLaneOpening(profile, theme.name, settings.apiKey, settings.model)
      } else {
        resp = getFallbackResponse(theme.id, 0)
      }
      addMsg('lane', resp.message)
      setLaneResp(resp)
      setConvTurn(1)
      speak(resp.message)
    } catch {
      const fb = getFallbackResponse(theme.id, 0)
      addMsg('lane', fb.message)
      setLaneResp(fb)
      setConvTurn(1)
    } finally {
      setIsThinking(false)
    }
  }

  // ── Patient sends a message ────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, currentMessages: DisplayMessage[], currentStep: Step, currentTurn: number) => {
      if (!content.trim()) return
      stopSpeaking()
      setInputText('')
      setLaneResp(null)

      const newMsg: DisplayMessage = {
        role: 'patient', content: content.trim(), timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, newMsg])
      const updatedTranscript = [...currentMessages, newMsg]

      if (currentStep === 'greeting') {
        setStep('mood')
        return
      }

      if (currentStep === 'family') {
        doSaveAndCelebrate(updatedTranscript)
        return
      }

      if (currentStep !== 'conversation') return

      const nextTurn = currentTurn + 1
      setIsThinking(true)

      try {
        let resp: LaneResponse
        if (settings.apiKey) {
          resp = await getLaneReply(updatedTranscript, profile, theme.name, settings.apiKey, settings.model)
        } else {
          resp = getFallbackResponse(theme.id, nextTurn)
        }

        const laneMsg: DisplayMessage = {
          role: 'lane', content: resp.message, timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, laneMsg])
        speak(resp.message)
        setConvTurn(nextTurn)

        if (nextTurn >= MAX_CONV_TURNS) {
          setLaneResp(null)
          setTimeout(doPickMusicAndAdvance, 800)
        } else {
          setLaneResp(resp)
        }
      } catch {
        const fb = getFallbackResponse(theme.id, nextTurn)
        const fbMsg: DisplayMessage = { role: 'lane', content: fb.message, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, fbMsg])
        setLaneResp(fb)
        setConvTurn(nextTurn)
      } finally {
        setIsThinking(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, profile, theme],
  )

  function doPickMusicAndAdvance() {
    const pick = profile.favoriteMusic.length > 0
      ? profile.favoriteMusic[Math.floor(Math.random() * profile.favoriteMusic.length)]
      : null
    setSelectedMusic(pick)
    setStep('music')
  }

  async function startFamilyMoment() {
    setStep('family')
    setIsThinking(true)
    const family = profile.familyPeople
    let resp: LaneResponse

    if (family.length > 0) {
      const person = family[Math.floor(Math.random() * family.length)]
      const extra  = person.memory ? ` I love the memory you have of them — ${person.memory}.` : ''
      resp = {
        message: `${profile.preferredName || profile.name}, I want to take a moment to think about the people who love you. ${person.name}, your ${person.relationship}, is so special.${extra} What do you love most about ${person.name}?`,
        suggestions: ['Their kindness', 'Their wonderful smile', 'How they make me feel', 'So much about them'],
      }
    } else {
      resp = {
        message: `${profile.preferredName || profile.name}, you are surrounded by people who love you deeply. Family and friends carry you in their hearts every day. Does thinking about the people who love you make you feel warm inside?`,
        suggestions: ['It really does', 'Yes, very much', 'It means everything to me', 'Thank you, Lane'],
      }
    }

    addMsg('lane', resp.message)
    setLaneResp(resp)
    speak(resp.message)
    setIsThinking(false)
  }

  async function doSaveAndCelebrate(transcript: DisplayMessage[]) {
    setStep('celebration')
    stopSpeaking()

    const updProf = updateStreak(profile)
    saveProfile(updProf)
    setUpdatedProfile(updProf)

    const visit: Visit = {
      id:        visitId.current,
      patientId: profile.id,
      date:      new Date().toISOString(),
      mood:      mood ?? 3,
      theme:     theme.id,
      transcript,
    }
    saveVisit(visit)

    speak(`Wonderful, ${profile.preferredName || profile.name}! What a beautiful visit today. Come back tomorrow — I'll be here waiting for you.`)

    // Background: generate caretaker summary (non-blocking)
    if (settings.apiKey) {
      generateVisitSummary(transcript, profile, settings.apiKey, settings.model)
        .then(summary => saveVisit({ ...visit, summary, engagement: summary.engagement }))
        .catch(() => { /* summary is optional */ })
    }
  }

  // ── Mic input ──────────────────────────────────────────────────────────────
  function startListening() {
    const API =
      window.SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!API) return
    const recognition = new API()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    setIsListening(true)
    recognition.onresult = (ev: SpeechRecognitionEvent) => {
      setInputText(ev.results[0][0].transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend   = () => setIsListening(false)
    recognition.start()
  }

  // ── Progress % ──────────────────────────────────────────────────────────────
  const STEP_PCT: Record<Step, number> = {
    greeting: 10, mood: 28, conversation: 28, music: 72, family: 88, celebration: 100,
  }
  const pct = step === 'conversation'
    ? 28 + Math.round((convTurn / MAX_CONV_TURNS) * 40)
    : STEP_PCT[step]

  const name = profile.preferredName || profile.name

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur-sm border-b border-navy/10 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-brand text-lg">Keepsake</span>
              <span className="text-navy/40 text-sm">·</span>
              <span className="text-navy/60 text-sm">{theme.icon} {theme.name}</span>
            </div>
            <button
              onClick={() => { stopSpeaking(); navigate('/') }}
              className="text-navy/40 hover:text-navy transition-colors text-sm"
            >
              End visit
            </button>
          </div>
          <div className="w-full bg-navy/10 rounded-full h-1.5">
            <div
              className="bg-brand h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto space-y-5"
      >
        {messages.map((msg, i) =>
          msg.role === 'lane'
            ? <LaneBubble key={i} message={msg.content} onSpeak={() => speakText(msg.content)} />
            : <PatientBubble key={i} message={msg.content} name={name} />
        )}

        {isThinking && (
          <div className="flex gap-3 items-center fade-up">
            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-lg shrink-0">L</div>
            <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-black/5 px-3 py-2">
              <Thinking />
            </div>
          </div>
        )}

        {/* Mood picker — shown after greeting step */}
        {step === 'mood' && (
          <div className="card text-center fade-up">
            <p className="text-xl font-semibold mb-6">How are you feeling right now, {name}?</p>
            <MoodPicker
              value={mood}
              onChange={m => {
                setMood(m)
                const labels = ['Not great','A little low','Okay','Pretty good','Wonderful!']
                const emojis = ['😔','😕','😊','😄','😁']
                addMsg('patient', `${emojis[m-1]} — ${labels[m-1]}`)
                setTimeout(startConversation, 500)
              }}
            />
          </div>
        )}

        {/* Music moment */}
        {step === 'music' && (
          <div className="card text-center fade-up">
            <p className="text-2xl mb-2">🎵</p>
            <h3 className="text-xl font-bold mb-2">Music moment</h3>
            {selectedMusic ? (
              <>
                <p className="text-navy/70 mb-3">Here's one of your favourite songs, {name}:</p>
                <p className="font-semibold text-lg mb-4">{selectedMusic.title}</p>
                <div className="relative pb-[56.25%] rounded-xl overflow-hidden bg-navy/5">
                  {(() => {
                    const vid = getYouTubeVideoId(selectedMusic.url)
                    return vid ? (
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${vid}?rel=0`}
                        title={selectedMusic.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-navy/40 text-sm px-4">
                        Could not load video — check the YouTube URL in the Profile editor.
                      </div>
                    )
                  })()}
                </div>
              </>
            ) : (
              <div className="py-6">
                <p className="text-navy/60 mb-2">No favourite songs saved yet.</p>
                <p className="text-sm text-navy/40">A caretaker can add YouTube links in the Profile editor.</p>
              </div>
            )}
            <button onClick={startFamilyMoment} className="btn-primary mt-6 w-full">
              Continue →
            </button>
          </div>
        )}

        {/* Celebration */}
        {step === 'celebration' && (
          <div className="card text-center fade-up py-10">
            <div className="text-7xl mb-4 bounce-in">🌟</div>
            <h2 className="text-3xl font-bold mb-3">What a wonderful visit!</h2>
            <p className="text-lg text-navy/70 mb-8">
              Thank you for spending this time with me, {name}. You make every visit special.
            </p>

            {(updatedProfile?.streak ?? 0) > 0 && (
              <div className="bg-primary/10 rounded-2xl px-6 py-4 mb-8 inline-block">
                <p className="text-3xl font-extrabold text-primary">
                  🔥 {updatedProfile!.streak}-day streak!
                </p>
                <p className="text-navy/60 mt-1">
                  {updatedProfile!.streak === 1
                    ? 'Your first visit — welcome!'
                    : `You've shown up ${updatedProfile!.streak} days in a row. That's beautiful.`}
                </p>
              </div>
            )}

            <p className="text-navy/60 mb-8 text-lg">
              Come back tomorrow — Lane will be here, ready for another lovely conversation.
            </p>
            <button
              onClick={() => { stopSpeaking(); navigate('/') }}
              className="btn-primary text-xl px-10 py-4"
            >
              Finish visit
            </button>
          </div>
        )}
      </div>

      {/* Input area */}
      {laneResp && (step === 'greeting' || step === 'conversation' || step === 'family') && (
        <div className="sticky bottom-0 bg-cream/95 backdrop-blur-sm border-t border-navy/10 px-4 pt-4 pb-6 max-w-2xl w-full mx-auto">

          {/* Tap-able suggestion buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {laneResp.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s, messages, step, convTurn)}
                className="bg-white border-2 border-brand/20 hover:border-brand hover:bg-brand/5
                           rounded-xl px-4 py-2 text-base font-medium text-navy
                           transition-all min-h-[48px] cursor-pointer active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Text + mic + send */}
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Or type your own response…"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && inputText.trim())
                  sendMessage(inputText, messages, step, convTurn)
              }}
            />
            {hasSpeech.current && (
              <button
                onClick={isListening ? () => setIsListening(false) : startListening}
                aria-label={isListening ? 'Stop listening' : 'Speak your answer'}
                className={[
                  'min-h-[48px] min-w-[48px] rounded-xl border-2 flex items-center justify-center text-xl transition-all',
                  isListening
                    ? 'bg-danger/10 border-danger text-danger animate-pulse'
                    : 'bg-white border-navy/20 hover:border-brand',
                ].join(' ')}
              >
                🎤
              </button>
            )}
            <button
              onClick={() => inputText.trim() && sendMessage(inputText, messages, step, convTurn)}
              disabled={!inputText.trim()}
              aria-label="Send"
              className="btn-primary min-w-[48px] px-4"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

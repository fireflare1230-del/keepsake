import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MoodPicker from '../components/MoodPicker'
import BottomNav from '../components/BottomNav'
import {
  getProfile, saveProfile, saveVisit, updateStreak,
  generateId, getSettings, getDueSRTTarget, updateSRTTarget,
} from '../lib/storage'
import {
  buildGreeting, getLaneOpening, getLaneReply,
  generateVisitSummary, getFallbackResponse,
  speakText, stopSpeaking, getYouTubeVideoId,
} from '../lib/ai'
import { getThemeForDate } from '../lib/themes'
import type { PatientProfile, Visit, DisplayMessage, YouTubeLink, SRTTarget } from '../types'
import type { LaneResponse } from '../lib/ai'

// ─── Steps ───────────────────────────────────────────────────────────────────
type Step = 'greeting' | 'mood' | 'conversation' | 'music' | 'family' | 'celebration'
const MAX_CONV_TURNS = 4

// ─── Web Speech API — minimal local types (not fully present in all TS DOM versions) ──
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend:   (() => void) | null;
  start:   () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as Record<string, unknown>;
  const ctor = w['SpeechRecognition'] ?? w['webkitSpeechRecognition'];
  return ctor as SpeechRecognitionCtor | undefined;
}

// ─── Thinking indicator — shown inside a Lane bubble shape ───────────────────
function Thinking() {
  return (
    <div className="flex gap-3 items-end bubble-pop max-w-[85%]">
      <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-lg shrink-0">
        L
      </div>
      <div className="bg-[#EAF2F6] rounded-[20px] rounded-bl-[6px] px-5 py-4
                      shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-brand/60 thinking-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function LaneBubble({ message, onSpeak }: { message: string; onSpeak: () => void }) {
  return (
    <div className="flex gap-3 items-end bubble-pop max-w-[85%]">
      <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-lg shrink-0">
        L
      </div>
      <div className="bg-[#EAF2F6] rounded-[20px] rounded-bl-[6px]
                      shadow-[0_4px_16px_rgba(0,0,0,0.06)] px-5 py-4 font-chat">
        <p className="text-[18px] leading-relaxed text-navy">{message}</p>
        <button
          onClick={onSpeak}
          className="mt-2 text-sm text-brand/60 hover:text-brand transition-colors flex items-center gap-1"
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
    <div className="flex gap-3 items-end justify-end bubble-pop">
      <div className="bg-[#FDF1E2] rounded-[20px] rounded-br-[6px] px-5 py-4 max-w-[80%]
                      shadow-[0_4px_16px_rgba(0,0,0,0.06)] font-chat">
        <p className="text-sm font-semibold text-primary mb-1">{name}</p>
        <p className="text-[18px] leading-relaxed text-navy">{message}</p>
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
  // SRT target due for this visit — resolved once, before conversation starts
  const srtTarget = useRef<SRTTarget | null>(getDueSRTTarget(profile))

  const hasSpeech = useRef(!!(getSpeechCtor()))

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
        resp = await getLaneOpening(profile, theme.name, settings.apiKey, settings.model, srtTarget.current)
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
          resp = await getLaneReply(updatedTranscript, profile, theme.name, settings.apiKey, settings.model, srtTarget.current)
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

    // Background: generate caretaker summary and update SRT interval (non-blocking)
    if (settings.apiKey) {
      generateVisitSummary(transcript, profile, settings.apiKey, settings.model, srtTarget.current)
        .then(summary => {
          saveVisit({ ...visit, summary, engagement: summary.engagement })
          // Advance or regress the SRT target interval based on recall result
          if (srtTarget.current && summary.srtResult && summary.srtResult !== 'not-tested') {
            updateSRTTarget(profile, srtTarget.current.id, summary.srtResult)
          }
        })
        .catch(() => { /* summary is optional */ })
    }
  }

  // ── Mic input ──────────────────────────────────────────────────────────────
  function startListening() {
    const Ctor = getSpeechCtor()
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    setIsListening(true)
    recognition.onresult = (ev) => {
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

  // ── Time-of-day greeting ─────────────────────────────────────────────────
  const hour         = new Date().getHours()
  const timeOfDay    = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const timeGreeting = `Good ${timeOfDay}`

  // ── Render ─────────────────────────────────────────────────────────────────

  // ── Home screen (greeting step) ───────────────────────────────────────────
  if (step === 'greeting') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col pb-16">
        {/* Header */}
        <header className="bg-white px-5 py-4 flex items-center justify-between shadow-sm">
          <span className="font-bold text-navy text-xl tracking-tight">Keepsake</span>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-navy/50 font-medium hover:text-navy transition-colors"
          >
            Help
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 max-w-sm mx-auto w-full space-y-4">

          {/* Greeting card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-300
                            mx-auto mb-5 flex items-center justify-center text-5xl shadow-sm">
              🌿
            </div>
            <h1 className="text-3xl font-extrabold text-navy leading-tight">
              {timeGreeting},<br />{name}
            </h1>
            <p className="text-navy/55 text-lg mt-2">How are you feeling today?</p>
          </div>

          {/* 2×2 Mood grid */}
          <MoodPicker value={mood} onChange={setMood} />

          {/* Start CTA */}
          <button
            disabled={mood === null}
            onClick={() => {
              if (mood === null) return
              const moodLabels: Record<number,string> = { 1:'Worried 😟', 2:'Tired 😴', 4:'Calm 😌', 5:'Happy 😊' }
              addMsg('patient', moodLabels[mood] ?? `Mood ${mood}`)
              startConversation()
            }}
            className="btn-primary w-full text-xl py-4 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Daily Check-In
          </button>

          {/* Today's Tip */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-primary/80 uppercase tracking-widest mb-2">Today's Tip</p>
            <p className="text-navy/70 leading-relaxed text-base">
              {theme.description
                ? theme.description
                : 'Drinking a glass of water can help you feel more alert and focused throughout the morning.'}
            </p>
          </div>
        </div>

        <BottomNav profileId={profile.id} />
      </div>
    )
  }

  // ── Celebration screen ─────────────────────────────────────────────────────
  if (step === 'celebration') {
    const streak    = updatedProfile?.streak ?? 0
    const dotCount  = Math.min(7, Math.max(streak, 5))

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50
                      flex flex-col items-center justify-center px-6 py-12">
        <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-10 text-center max-w-sm w-full shadow-lg">

          <div className="text-6xl mb-3 bounce-in">🌟</div>
          <h1 className="text-4xl font-extrabold text-navy mb-3">Great job!</h1>
          <p className="text-lg text-navy/60 leading-relaxed mb-8">
            You've successfully completed your {timeOfDay} check-in.
            It's a wonderful start to your day, {name}.
          </p>

          {streak > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-5xl">🔥</span>
                <span className="text-6xl font-black text-primary leading-none">{streak}</span>
              </div>
              <p className="text-xs font-bold text-navy/45 uppercase tracking-widest mb-4">
                Days in a row
              </p>
              <div className="flex gap-2 justify-center">
                {[...Array(dotCount)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i < streak ? 'bg-primary' : 'bg-navy/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { stopSpeaking(); navigate('/') }}
            className="btn-primary w-full text-xl py-4 mb-4 rounded-2xl"
          >
            See you tomorrow
          </button>
          <button
            onClick={() => { stopSpeaking(); navigate('/caretaker') }}
            className="text-brand font-semibold text-base hover:underline"
          >
            Review today's highlights
          </button>
        </div>
      </div>
    )
  }

  // ── Conversation / Music / Family — chat interface ─────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">

      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-navy text-lg">Keepsake</span>
              <span className="text-navy/30 text-sm">·</span>
              <span className="text-navy/55 text-sm">{theme.icon} {theme.name}</span>
            </div>
            <button
              onClick={() => { stopSpeaking(); navigate('/') }}
              className="text-navy/40 hover:text-navy transition-colors text-sm font-medium"
            >
              End visit
            </button>
          </div>
          <div className="w-full bg-navy/10 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-700"
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

        {/* Music moment */}
        {step === 'music' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm text-center fade-up">
            <p className="text-3xl mb-2">🎵</p>
            <h3 className="text-xl font-bold mb-2">Music moment</h3>
            {selectedMusic ? (
              <>
                <p className="text-navy/70 mb-3">Here's one of your favourite songs, {name}:</p>
                <p className="font-semibold text-lg mb-4">{selectedMusic.title}</p>
                <div className="relative pb-[56.25%] rounded-2xl overflow-hidden bg-navy/5">
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
            <button onClick={startFamilyMoment} className="btn-primary mt-6 w-full rounded-2xl">
              Continue →
            </button>
          </div>
        )}
      </div>

      {/* Input area */}
      {laneResp && (step === 'conversation' || step === 'family') && (
        <div className="sticky bottom-0 bg-white border-t border-black/8 px-4 pt-4 pb-5 max-w-2xl w-full mx-auto">

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {laneResp.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s, messages, step, convTurn)}
                className="bg-[#EAF2F6] border-2 border-brand/20 hover:border-brand hover:bg-[#d6eaf4]
                           rounded-full px-5 py-2.5 text-base font-chat font-semibold text-navy
                           transition-all duration-150 min-h-[48px] cursor-pointer
                           active:scale-[0.96] active:bg-[#c8e0ee] shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Text + mic + send */}
          <div className="flex gap-2">
            <input
              className="input flex-1 rounded-2xl"
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
                  'min-h-[48px] min-w-[48px] rounded-2xl border-2 flex items-center justify-center text-xl transition-all',
                  isListening
                    ? 'bg-danger/10 border-danger text-danger animate-pulse'
                    : 'bg-cream border-navy/20 hover:border-brand',
                ].join(' ')}
              >
                🎤
              </button>
            )}
            <button
              onClick={() => inputText.trim() && sendMessage(inputText, messages, step, convTurn)}
              disabled={!inputText.trim()}
              aria-label="Send"
              className="btn-primary min-w-[48px] px-4 rounded-2xl"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

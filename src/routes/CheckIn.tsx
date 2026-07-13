import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Chip from '../components/Chip'
import { LogoMark } from '../components/Logo'
import MoodPicker from '../components/MoodPicker'
import MusicEmbed from '../components/MusicEmbed'
import ProgressBar from '../components/ProgressBar'
import { THEMES } from '../data/themes'
import {
  SCRIPTED_FINAL_TURN,
  buildVisitSummary,
  nextLaneTurn,
} from '../features/lane/conversation'
import { pickMoment } from '../features/checkin/moments'
import { timeGreeting } from '../lib/dates'
import { canListen, canSpeak, createListener, speak, stopSpeaking } from '../lib/speech'
import {
  clearDraft,
  getActiveProfile,
  loadDraft,
  loadSettings,
  loadVisits,
  peekNextThemeIndex,
  recordCompletedVisit,
  saveDraft,
  saveLastThemeIndex,
  saveVisit,
  uid,
} from '../lib/storage'
import type { Message, Profile, ProfileProgress, Visit } from '../types'

/**
 * The patient daily check-in (FR-13..20), one calm step at a time:
 *
 *   hello → mood → talk (3-5 turns with Lane) → music → family → done
 *
 * No login, no time pressure, nothing to get wrong. The caretaker opens
 * this screen and hands the device over. `?preview=1` runs the identical
 * flow for the caretaker without saving anything (§16.11).
 */

type StepName = 'hello' | 'mood' | 'talk' | 'moment' | 'family' | 'done'

export default function CheckIn() {
  const [params] = useSearchParams()
  const preview = params.get('preview') === '1'
  const profile = getActiveProfile()
  if (!profile) return <Navigate to="/welcome" replace />
  // Key by profile so switching profiles never leaks visit state.
  return <VisitFlow key={profile.id + (preview ? ':p' : '')} profile={profile} preview={preview} />
}

/* ========================================================================== */

function VisitFlow({ profile, preview }: { profile: Profile; preview: boolean }) {
  const navigate = useNavigate()
  const settings = useMemo(() => loadSettings(), [])

  // Rotation seeds: completed visits pick today's song, person, and fact.
  const completedCount = useMemo(
    () => loadVisits(profile.id).filter((v) => v.completed && !v.preview).length,
    [profile.id]
  )

  const [resumable] = useState(() => {
    if (preview) return undefined
    const draft = loadDraft(profile.id)
    if (!draft || draft.visit.completed) return undefined
    const ageHours =
      (Date.now() - new Date(draft.savedAt).getTime()) / (1000 * 60 * 60)
    return ageHours < 12 ? draft : undefined
  })
  const [resumeChoice, setResumeChoice] = useState<'pending' | 'fresh' | 'resume'>(
    () => (resumable ? 'pending' : 'fresh')
  )

  // ----- the visit record ------------------------------------------------
  const [visit, setVisit] = useState<Visit>(() => {
    if (resumable) return resumable.visit
    // Peek only; the rotation pointer is saved when the visit completes.
    const themeIndex = peekNextThemeIndex(profile.id, THEMES.length)
    return {
      id: uid(),
      profileId: profile.id,
      date: new Date().toISOString(),
      theme: THEMES[themeIndex].name,
      transcript: [],
      completed: false,
      preview: preview || undefined,
      mode: 'scripted',
    }
  })

  const theme = useMemo(
    () => THEMES.find((t) => t.name === visit.theme) ?? THEMES[0],
    [visit.theme]
  )
  const fact = profile.factsToReinforce.length
    ? profile.factsToReinforce[completedCount % profile.factsToReinforce.length]
    : undefined
  // Today's special moment rotates: a favorite song one visit, their team
  // or a favorite food/show the next (v1.1).
  const moment = useMemo(
    () => pickMoment(profile, completedCount),
    [profile, completedCount]
  )
  const person = profile.family.length
    ? profile.family[completedCount % profile.family.length]
    : undefined

  const steps = useMemo<StepName[]>(() => {
    const list: StepName[] = ['hello', 'mood', 'talk']
    if (moment) list.push('moment')
    if (person) list.push('family')
    list.push('done')
    return list
  }, [moment, person])

  const [stepIndex, setStepIndex] = useState(() => (resumable ? resumable.stepIndex : 0))
  const step = steps[Math.min(stepIndex, steps.length - 1)]

  // ----- conversation state ----------------------------------------------
  // On a resumed visit, restore the chips from the last Lane message so
  // the person can continue exactly where they left off.
  const [suggestions, setSuggestions] = useState<string[]>(() => {
    if (!resumable) return []
    const lastLane = [...resumable.visit.transcript]
      .reverse()
      .find((m) => m.role === 'lane' && m.suggestions)
    return lastLane?.suggestions ?? []
  })
  const [talkDone, setTalkDone] = useState(() => {
    if (!resumable) return false
    const laneTurns = resumable.visit.transcript.filter(
      (m) => m.role === 'lane' && m.suggestions
    ).length
    return laneTurns > SCRIPTED_FINAL_TURN
  })
  const [thinking, setThinking] = useState(false)
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [moodAck, setMoodAck] = useState('')
  const [momentAck, setMomentAck] = useState('')
  const [familyReplied, setFamilyReplied] = useState(false)
  const [streakResult, setStreakResult] = useState<ProfileProgress | null>(null)
  const startRef = useRef(Date.now())
  const completedRef = useRef(false)
  const scrollAnchor = useRef<HTMLDivElement>(null)

  const showSpeaker = settings.readAloudEnabled && canSpeak()

  // Persist a draft after every change so an interrupted visit resumes
  // (FR-20). Only once there is real progress: stopping at the hello
  // screen should not trigger the "welcome back" choice next time.
  useEffect(() => {
    if (preview || visit.completed || resumeChoice === 'pending') return
    if (stepIndex === 0) return
    saveDraft({ visit, stepIndex, savedAt: new Date().toISOString() })
  }, [visit, stepIndex, preview, resumeChoice])

  // Gentle scroll to the newest message.
  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [visit.transcript.length, thinking])

  function pushMessage(message: Message) {
    setVisit((v) => ({ ...v, transcript: [...v.transcript, message] }))
  }

  function laneSays(text: string, chips?: string[]) {
    pushMessage({ role: 'lane', text, suggestions: chips, ts: new Date().toISOString() })
  }

  function patientSays(text: string) {
    pushMessage({ role: 'patient', text, ts: new Date().toISOString() })
  }

  function next() {
    stopSpeaking()
    setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  // ----- talk step engine --------------------------------------------------
  const laneTurnCount = visit.transcript.filter((m) => m.role === 'lane' && m.suggestions).length

  async function requestLaneTurn(
    turnIndex: number,
    history: Message[],
    lastAnswer?: string
  ) {
    setThinking(true)
    // A short, unhurried beat, Lane never pops in abruptly.
    const [turn] = await Promise.all([
      nextLaneTurn({ profile, theme, turnIndex, history, lastAnswer, fact }),
      new Promise((resolve) => setTimeout(resolve, 900)),
    ])
    setThinking(false)
    pushMessage({
      role: 'lane',
      text: turn.message,
      suggestions: turn.suggestions,
      ts: new Date().toISOString(),
    })
    setSuggestions(turn.suggestions)
    if (turn.factShared && fact) {
      setVisit((v) => ({ ...v, factReinforced: fact }))
    }
    if (turn.source === 'ai') {
      setVisit((v) => (v.mode === 'ai' ? v : { ...v, mode: 'ai' }))
    }
    if (turn.done) setTalkDone(true)
  }

  // Kick off the first Lane turn when the talk step begins.
  useEffect(() => {
    if (step === 'talk' && laneTurnCount === 0 && !thinking) {
      requestLaneTurn(0, visit.transcript)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function answer(text: string) {
    const trimmed = text.trim()
    if (!trimmed || thinking) return
    stopSpeaking()
    patientSays(trimmed)
    setSuggestions([])
    setInput('')
    if (!talkDone) {
      requestLaneTurn(
        laneTurnCount,
        [
          ...visit.transcript,
          { role: 'patient', text: trimmed, ts: new Date().toISOString() },
        ],
        trimmed
      )
    }
  }

  function startListening() {
    const listener = createListener(
      (transcript) => setInput(transcript),
      () => setListening(false)
    )
    if (!listener) return
    setListening(true)
    listener.start()
  }

  // ----- completion ---------------------------------------------------------
  useEffect(() => {
    if (step !== 'done' || completedRef.current) return
    completedRef.current = true
    const finished: Visit = {
      ...visit,
      completed: true,
      durationSec: Math.round((Date.now() - startRef.current) / 1000),
    }
    setVisit(finished)
    if (!preview) {
      saveVisit(finished)
      setStreakResult(recordCompletedVisit(profile.id))
      const themeIndex = THEMES.findIndex((t) => t.name === finished.theme)
      if (themeIndex >= 0) saveLastThemeIndex(profile.id, themeIndex)
      clearDraft(profile.id)
      // The caretaker summary is generated in the background (§8.4),
      // the celebration never waits on it.
      buildVisitSummary(finished, profile).then((summary) => {
        saveVisit({ ...finished, summary })
        // If the caretaker has an account, quietly refresh the cloud copy.
        // Dynamic import keeps the patient bundle light.
        import('../lib/cloud').then((m) => m.backupToCloudQuietly())
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  /* ------------------------------ resume choice --------------------------- */

  if (resumeChoice === 'pending' && resumable) {
    return (
      <Shell preview={preview} progress={null} onExit={() => exitQuietly()}>
        <div className="step-enter mt-16 text-center">
          <LogoMark size={72} />
          <h1 className="mt-8 text-4xl">Welcome back, {profile.preferredName}.</h1>
          <p className="mx-auto mt-4 max-w-md text-xl text-ink-muted">
            We were in the middle of a lovely visit. Shall we pick up where we
            left off?
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <Button size="xl" onClick={() => setResumeChoice('resume')}>
              Yes, let&rsquo;s continue
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                clearDraft(profile.id)
                window.location.reload()
              }}
            >
              Start fresh instead
            </Button>
          </div>
        </div>
      </Shell>
    )
  }

  /* -------------------------------- exiting -------------------------------- */

  function exitQuietly() {
    stopSpeaking()
    navigate(preview ? '/care' : '/')
  }

  /* --------------------------------- render -------------------------------- */

  return (
    <Shell
      preview={preview}
      progress={{ current: stepIndex, total: steps.length }}
      onExit={exitQuietly}
    >
      {/* ------------------------------- hello ------------------------------- */}
      {step === 'hello' && (
        <div className="step-enter mt-14 text-center">
          <LogoMark size={84} />
          <h1 className="mt-8 text-4xl md:text-5xl">
            {timeGreeting()}, {profile.preferredName}.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-2xl text-ink-muted">
            It&rsquo;s so good to sit with you today.
          </p>
          {showSpeaker && (
            <div className="mt-5">
              <SpeakButton
                text={`${timeGreeting()}, ${profile.preferredName}. It's so good to sit with you today.`}
              />
            </div>
          )}
          <div className="mt-12">
            <Button
              size="xl"
              onClick={() => {
                laneSays(`${timeGreeting()}, ${profile.preferredName}. It's so good to sit with you today.`)
                patientSays('Hello!')
                next()
              }}
            >
              Hello 👋
            </Button>
          </div>
        </div>
      )}

      {/* -------------------------------- mood -------------------------------- */}
      {step === 'mood' && (
        <div className="step-enter mt-10">
          <h1 className="text-center text-4xl">How are you feeling today?</h1>
          <p className="mt-3 text-center text-xl text-ink-muted">
            Any answer is just right.
          </p>
          {!moodAck ? (
            <div className="mt-10">
              <MoodPicker
                onPick={(mood) => {
                  const ack =
                    mood <= 2
                      ? `Thank you for telling me, ${profile.preferredName}. Some days are heavy, I'm right here with you.`
                      : mood === 3
                        ? `Thank you for telling me. We'll take today nice and easy, together.`
                        : `That's wonderful to hear. Days like this are a gift.`
                  setVisit((v) => ({ ...v, mood }))
                  laneSays(ack)
                  setMoodAck(ack)
                }}
              />
            </div>
          ) : (
            <div className="mt-10 text-center">
              <LaneBubble text={moodAck} showSpeaker={showSpeaker} large />
              <div className="mt-10">
                <Button size="xl" onClick={next}>
                  Let&rsquo;s talk →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------- talk -------------------------------- */}
      {step === 'talk' && (
        <div className="step-enter mt-6 pb-40">
          {/* Topic card (FR-16) */}
          <div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-full bg-sage-wash px-6 py-3">
            <span aria-hidden="true" className="text-2xl">{theme.emoji}</span>
            <span className="text-lg font-semibold text-sage-deep">
              Today&rsquo;s memory: {theme.name}, {theme.cardLine}
            </span>
          </div>

          {/* Conversation */}
          <div className="mt-8 space-y-5" aria-live="polite">
            {visit.transcript
              .filter((m) => m.role === 'patient' || m.suggestions)
              .map((message, index) =>
                message.role === 'lane' ? (
                  <LaneBubble key={index} text={message.text} showSpeaker={showSpeaker} />
                ) : (
                  <div key={index} className="flex justify-end">
                    <div className="max-w-[80%] rounded-xl rounded-br-sm bg-amber-wash px-5 py-3.5 text-xl">
                      {message.text}
                    </div>
                  </div>
                )
              )}
            {thinking && (
              <div className="flex items-center gap-3 pl-14" aria-label="Lane is thinking">
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span className="thinking-dot" />
              </div>
            )}
            <div ref={scrollAnchor} />
          </div>

          {/* Answer area, chips first, blanks never required (§8.3) */}
          <div className="fixed inset-x-0 bottom-0 border-t border-cream-deep bg-cream/95 py-4 backdrop-blur">
            <div className="mx-auto max-w-visit px-6">
              {suggestions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {suggestions.map((chip) => (
                    <Chip key={chip} onClick={() => answer(chip)} disabled={thinking}>
                      {chip}
                    </Chip>
                  ))}
                </div>
              )}
              {talkDone && !thinking && (
                <div className="mt-4 flex justify-center">
                  <Button size="xl" onClick={next}>
                    {moment?.kind === 'music'
                      ? 'A song for you →'
                      : moment
                        ? 'One more nice thing →'
                        : person
                          ? 'One more thing →'
                          : 'Finish the visit →'}
                  </Button>
                </div>
              )}
              {!talkDone && (
                <form
                  className="mx-auto mt-4 flex max-w-xl gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    answer(input)
                  }}
                >
                  <label htmlFor="own-words" className="sr-only">
                    Or say it in your own words
                  </label>
                  <input
                    id="own-words"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Or your own words…"
                    className="min-h-[56px] w-full rounded-full border border-cream-deep bg-[#FFFDF9] px-6 text-lg"
                    disabled={thinking}
                  />
                  {canListen() && (
                    <button
                      type="button"
                      onClick={startListening}
                      aria-label={listening ? 'Listening…' : 'Speak your answer'}
                      aria-pressed={listening}
                      className={
                        'min-h-[56px] min-w-[56px] rounded-full border text-2xl shadow-card ' +
                        (listening
                          ? 'animate-pulse border-rust bg-rust-wash'
                          : 'border-cream-deep bg-[#FFFDF9] hover:bg-brand-wash')
                      }
                    >
                      🎤
                    </button>
                  )}
                  <Button type="submit" disabled={!input.trim() || thinking}>
                    Send
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------- special moment ---------------------------- */}
      {step === 'moment' && moment?.kind === 'music' && (
        <div className="step-enter mt-10">
          <h1 className="text-center text-4xl">A song for you 🎵</h1>
          <p className="mt-3 text-center text-xl text-ink-muted">
            Take all the time you like, {profile.preferredName}.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <MusicEmbed videoId={moment.song.videoId} title={moment.song.title} />
          </div>
          <div className="mt-10 text-center">
            <Button size="xl" onClick={next}>
              That was lovely →
            </Button>
          </div>
        </div>
      )}

      {step === 'moment' && moment?.kind === 'favorite' && (
        <div className="step-enter mt-10">
          <h1 className="text-center text-4xl">One of your favorites 💛</h1>
          <div className="mx-auto mt-8 max-w-xl">
            <LaneBubble large showSpeaker={showSpeaker} text={moment.share} />
            {momentAck && (
              <div className="mt-5">
                <LaneBubble large showSpeaker={false} text={momentAck} />
              </div>
            )}
          </div>
          {!momentAck && (
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {moment.chips.map((chip) => (
                <Chip
                  key={chip.label}
                  onClick={() => {
                    patientSays(chip.label)
                    laneSays(chip.ack)
                    setMomentAck(chip.ack)
                  }}
                >
                  {chip.label}
                </Chip>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Button size="xl" onClick={next}>
              {person ? 'One more thing →' : 'Finish the visit →'}
            </Button>
          </div>
        </div>
      )}

      {/* -------------------------------- family -------------------------------- */}
      {step === 'family' && person && (
        <div className="step-enter mt-10">
          <h1 className="text-center text-4xl">Someone who loves you 💛</h1>
          <div className="mx-auto mt-8 max-w-xl">
            <LaneBubble
              large
              showSpeaker={showSpeaker}
              text={
                `I was thinking about your ${person.relationship.toLowerCase()}, ${person.name}.` +
                (person.notes ? ` ${person.notes.replace(/\.?$/, '.')}` : '') +
                ` You are so loved, ${profile.preferredName}.`
              }
            />
            {familyReplied && (
              <div className="mt-5">
                <LaneBubble large showSpeaker={false} text="They love you right back, I can tell." />
              </div>
            )}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {!familyReplied &&
              ['I love them', "That's nice", 'They make me smile'].map((chip) => (
                <Chip
                  key={chip}
                  onClick={() => {
                    patientSays(chip)
                    laneSays('They love you right back, I can tell.')
                    setFamilyReplied(true)
                  }}
                >
                  {chip}
                </Chip>
              ))}
          </div>
          <div className="mt-8 text-center">
            <Button size="xl" onClick={next}>
              Finish the visit →
            </Button>
          </div>
        </div>
      )}

      {/* --------------------------------- done --------------------------------- */}
      {step === 'done' && (
        <div className="step-enter mt-14 text-center">
          <span aria-hidden="true" className="text-7xl">🌻</span>
          <h1 className="mt-6 text-4xl md:text-5xl">
            That was a lovely visit, {profile.preferredName}.
          </h1>
          {!preview && streakResult && (
            <div className="mx-auto mt-8 max-w-sm rounded-xl bg-amber-wash px-8 py-6 shadow-card">
              <p className="text-2xl font-bold text-amber-deep">
                ☀️ {streakResult.currentStreak} day
                {streakResult.currentStreak === 1 ? '' : 's'} in a row
              </p>
              <p className="mt-2 text-lg text-ink-muted">
                of showing up, and showing up is everything.
              </p>
            </div>
          )}
          {preview && (
            <p className="mx-auto mt-6 max-w-md text-lg text-ink-muted">
              (Preview, nothing was saved, and the streak wasn&rsquo;t touched.)
            </p>
          )}
          <p className="mt-8 text-xl text-ink-muted">See you tomorrow. 💛</p>
          <div className="mt-10">
            <Button size="xl" onClick={exitQuietly}>
              {preview ? 'Back to the caretaker area' : 'All done'}
            </Button>
          </div>
        </div>
      )}
    </Shell>
  )
}

/* ============================== little pieces ============================== */

function Shell({
  children,
  preview,
  progress,
  onExit,
}: {
  children: React.ReactNode
  preview: boolean
  progress: { current: number; total: number } | null
  onExit: () => void
}) {
  return (
    <div className="min-h-screen">
      {preview && (
        <div className="bg-brand-wash py-2 text-center font-semibold text-brand-deeper">
          Caretaker preview, nothing will be saved
        </div>
      )}
      <header className="mx-auto flex max-w-visit items-center gap-5 px-6 py-5">
        <LogoMark size={30} />
        {progress && (
          <div className="flex-1">
            <ProgressBar current={progress.current} total={progress.total} />
          </div>
        )}
        <button
          onClick={onExit}
          className="whitespace-nowrap text-base font-semibold text-ink-faint underline-offset-4 hover:underline"
        >
          {preview ? 'Exit preview' : 'Save & rest'}
        </button>
      </header>
      <main className="mx-auto max-w-visit px-6 pb-16">{children}</main>
    </div>
  )
}

function LaneBubble({
  text,
  showSpeaker,
  large,
}: {
  text: string
  showSpeaker: boolean
  large?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <LogoMark size={40} />
      <div className="min-w-0">
        <div
          className={
            'rounded-xl rounded-tl-sm bg-brand-wash px-5 py-3.5 text-ink ' +
            (large ? 'text-2xl leading-relaxed' : 'text-xl')
          }
        >
          {text}
        </div>
        {showSpeaker && (
          <div className="mt-2">
            <SpeakButton text={text} />
          </div>
        )}
      </div>
    </div>
  )
}

function SpeakButton({ text }: { text: string }) {
  if (!canSpeak()) return null
  return (
    <button
      onClick={() => speak(text, loadSettings().voiceURI)}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-1.5 text-base font-semibold text-brand-deep hover:bg-brand-wash"
      aria-label="Read this message aloud"
    >
      🔊 Hear it
    </button>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateId, saveProfile, saveSettings, getSettings } from '../lib/storage'
import type { PatientProfile } from '../types'

type Step = 'welcome' | 'basics' | 'memory' | 'apikey' | 'done'

const STEPS: Step[] = ['welcome', 'basics', 'memory', 'apikey', 'done']

function Progress({ current }: { current: Step }) {
  const idx   = STEPS.indexOf(current)
  const total = STEPS.length - 1  // don't count 'done' as a progress step
  const pct   = Math.min(100, Math.round((idx / total) * 100))
  return (
    <div className="w-full bg-navy/10 rounded-full h-2 mb-8">
      <div
        className="bg-brand h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function Onboarding() {
  const navigate  = useNavigate()
  const [step, setStep] = useState<Step>('welcome')

  // Form state
  const [name,             setName]             = useState('')
  const [preferredName,    setPreferredName]     = useState('')
  const [birthYear,        setBirthYear]         = useState('')
  const [hometown,         setHometown]          = useState('')
  const [firstHappyMemory, setFirstHappyMemory]  = useState('')
  const [apiKey,           setApiKey]            = useState('')
  const [showKey,          setShowKey]           = useState(false)
  const [error,            setError]             = useState('')

  function next() { setError(''); setStep(s => STEPS[STEPS.indexOf(s) + 1] as Step) }
  function back() { setStep(s => STEPS[STEPS.indexOf(s) - 1] as Step) }

  function validateBasics(): boolean {
    if (!name.trim()) { setError('Please enter your loved one\'s name.'); return false }
    return true
  }

  function finish() {
    const profile: PatientProfile = {
      id:                   generateId(),
      name:                 name.trim(),
      preferredName:        preferredName.trim() || name.trim(),
      birthYear:            birthYear ? parseInt(birthYear) : undefined,
      hometown:             hometown.trim() || undefined,
      firstHappyMemory:     firstHappyMemory.trim() || undefined,
      familyPeople:         [],
      favoriteMusic:        [],
      lifeStory:            '',
      topicsToAvoid:        [],
      gentleFactsToReinforce: [],
      createdAt:            new Date().toISOString(),
      streak:               0,
    }
    saveProfile(profile)

    if (apiKey.trim()) {
      const settings = getSettings()
      saveSettings({ ...settings, apiKey: apiKey.trim() })
    }

    navigate('/caretaker')
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center py-6">
        <span className="text-2xl font-bold text-brand">Keepsake</span>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-lg">
          <Progress current={step} />

          {/* ── Step: Welcome ────────────────────────────────────────────── */}
          {step === 'welcome' && (
            <div className="text-center">
              <div className="text-6xl mb-6">👋</div>
              <h1 className="text-3xl font-bold mb-4">Welcome to Keepsake</h1>
              <p className="text-lg text-navy/70 mb-8 leading-relaxed">
                Let's take a few minutes to set up a profile for your loved one.
                Everything you share here stays on <strong>your device only</strong> —
                no account, no cloud.
              </p>
              <p className="text-base text-navy/60 mb-10">
                This takes about <strong>5 minutes</strong>. You can always add more details later.
              </p>
              <button onClick={next} className="btn-primary w-full text-xl">
                Let's begin →
              </button>
            </div>
          )}

          {/* ── Step: Basics ─────────────────────────────────────────────── */}
          {step === 'basics' && (
            <div>
              <h2 className="text-2xl font-bold mb-2">About your loved one</h2>
              <p className="text-navy/60 mb-8">
                Lane will use these details to greet them warmly each day.
              </p>

              {error && (
                <div className="bg-danger/10 text-danger rounded-xl px-4 py-3 mb-6 text-base">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block font-semibold mb-2">
                    Full name <span className="text-danger">*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Robert Walker"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">
                    What do they like to be called?
                    <span className="text-navy/50 font-normal ml-2">(optional)</span>
                  </label>
                  <input
                    className="input"
                    placeholder={`e.g. Bob, Grandpa, Pop — leave blank to use ${name || 'their name'}`}
                    value={preferredName}
                    onChange={e => setPreferredName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">
                      Birth year <span className="text-navy/50 font-normal">(optional)</span>
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. 1942"
                      value={birthYear}
                      onChange={e => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      type="text"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">
                      Hometown <span className="text-navy/50 font-normal">(optional)</span>
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Albany, NY"
                      value={hometown}
                      onChange={e => setHometown(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={back} className="btn-ghost flex-1">← Back</button>
                <button
                  onClick={() => { if (validateBasics()) next() }}
                  className="btn-primary flex-[2]"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Memory seed ────────────────────────────────────────── */}
          {step === 'memory' && (
            <div>
              <h2 className="text-2xl font-bold mb-2">A happy memory</h2>
              <p className="text-navy/60 mb-8 leading-relaxed">
                Share one happy memory from {preferredName || name}'s life.
                Lane will weave this into early conversations to spark warmth and connection.
                This is completely optional.
              </p>

              <textarea
                className="textarea min-h-[140px]"
                placeholder={`e.g. "${preferredName || name} loved fishing at the lake with his brother every summer as a boy. He always caught the biggest fish."`}
                value={firstHappyMemory}
                onChange={e => setFirstHappyMemory(e.target.value)}
                autoFocus
              />

              <p className="text-sm text-navy/50 mt-3">
                You can add many more memories, family members, and life story details in the Caretaker Area after setup.
              </p>

              <div className="flex gap-3 mt-8">
                <button onClick={back} className="btn-ghost flex-1">← Back</button>
                <button onClick={next} className="btn-primary flex-[2]">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step: API key ─────────────────────────────────────────────── */}
          {step === 'apikey' && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Add an AI key (optional)</h2>
              <p className="text-navy/60 mb-6 leading-relaxed">
                Keepsake works great for <strong>free</strong> with warm scripted conversations.
                If you'd like Lane to have fully personalised, AI-powered responses, you can add
                your own Anthropic API key below.
              </p>

              <div className="bg-brand/5 rounded-2xl p-5 mb-6 border border-brand/10">
                <h4 className="font-semibold mb-2">🔑 How the key works:</h4>
                <ul className="space-y-2 text-base text-navy/70">
                  <li>• The key is stored <strong>only in your browser</strong> — never sent anywhere else.</li>
                  <li>• When you use the app, calls go directly from your browser to Anthropic.</li>
                  <li>• <strong>Only you are billed</strong> — sharing this app with others doesn't cost you anything.</li>
                  <li>• We recommend setting a <strong>$5/month spend limit</strong> in the Anthropic console.</li>
                </ul>
              </div>

              <label className="block font-semibold mb-2">
                Anthropic API key <span className="text-navy/50 font-normal">(optional — skip to use free mode)</span>
              </label>
              <div className="relative">
                <input
                  className="input pr-20"
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand font-medium"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>

              <p className="text-sm text-navy/50 mt-3">
                You can add or remove the key at any time in Caretaker → Settings.
              </p>

              <div className="flex gap-3 mt-8">
                <button onClick={back} className="btn-ghost flex-1">← Back</button>
                <button onClick={next} className="btn-primary flex-[2]">
                  {apiKey.trim() ? 'Save key & continue →' : 'Skip — use free mode →'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Done ───────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center">
              <div className="text-6xl mb-6 bounce-in">🎉</div>
              <h2 className="text-3xl font-bold mb-4">
                {preferredName || name}'s profile is ready!
              </h2>
              <p className="text-lg text-navy/70 mb-8 leading-relaxed">
                You'll land in the Caretaker Area where you can add family members,
                favourite music, and more. Then hand the device to {preferredName || name}
                to begin your first visit.
              </p>
              <button onClick={finish} className="btn-primary w-full text-xl py-5">
                Open Caretaker Area →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

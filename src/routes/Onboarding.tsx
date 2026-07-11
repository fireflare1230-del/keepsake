import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { Field, TextArea } from '../components/Field'
import { LogoLockup } from '../components/Logo'
import StepDots from '../components/StepDots'
import { hashPin, setUnlocked } from '../lib/pin'
import {
  ensureSchema,
  loadProfiles,
  loadSettings,
  saveProfile,
  saveSettings,
  setActiveProfile,
  uid,
} from '../lib/storage'
import type { Profile } from '../types'

/**
 * First-run onboarding (FR-6..9). Four gentle steps, skippable down to
 * the bare minimum (just names) so setup takes under two minutes:
 *
 *   1. Who is this for?   — name + preferred name (required)
 *   2. A few warm details — birth year, hometown, a happy memory (optional)
 *   3. AI conversation    — paste an Anthropic key (optional, "later" is fine)
 *   4. Caretaker PIN      — set a PIN (recommended, skippable)
 */

const TOTAL_STEPS = 4

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  // Step 1 — required
  const [name, setName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [nameError, setNameError] = useState('')

  // Step 2 — optional details
  const [birthYear, setBirthYear] = useState('')
  const [hometown, setHometown] = useState('')
  const [happyMemory, setHappyMemory] = useState('')

  // Step 3 — optional API key
  const [apiKey, setApiKey] = useState('')

  // Step 4 — PIN
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')

  // Onboarding is for first run — if a profile already exists, the
  // caretaker area is the right place to add more.
  useEffect(() => {
    ensureSchema()
    if (loadProfiles().length > 0) navigate('/care', { replace: true })
  }, [navigate])

  function next() {
    if (step === 0) {
      if (!name.trim()) {
        setNameError('Please enter their name — everything else is optional.')
        return
      }
      setNameError('')
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function finish(withPin: boolean) {
    if (withPin) {
      if (!/^\d{4,6}$/.test(pin)) {
        setPinError('The PIN should be 4 to 6 digits.')
        return
      }
      if (pin !== pinConfirm) {
        setPinError("Those PINs don't match — one more try.")
        return
      }
    }

    const now = new Date().toISOString()
    const profile: Profile = {
      id: uid(),
      name: name.trim(),
      preferredName: preferredName.trim() || name.trim().split(' ')[0],
      birthYear: birthYear ? Number(birthYear) : undefined,
      hometown: hometown.trim() || undefined,
      happyMemory: happyMemory.trim() || undefined,
      family: [],
      favoriteMusic: [],
      topicsToAvoid: [],
      factsToReinforce: [],
      createdAt: now,
      updatedAt: now,
    }
    saveProfile(profile)
    setActiveProfile(profile.id)

    const settings = loadSettings()
    if (apiKey.trim()) settings.apiKey = apiKey.trim()
    if (withPin) settings.pinHash = await hashPin(pin)
    saveSettings(settings)

    // The person who just finished setup shouldn't be asked for the PIN
    // they typed ten seconds ago.
    setUnlocked(true)
    navigate('/care', { replace: true })
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex justify-center">
          <LogoLockup size={34} />
        </div>

        <StepDots total={TOTAL_STEPS} current={step} />

        <div className="card mt-8 p-8 step-enter" key={step}>
          {step === 0 && (
            <>
              <h1 className="text-3xl">Who is Keepsake for?</h1>
              <p className="mt-2 text-ink-muted">
                Lane, the companion, will use these names to greet them warmly.
              </p>
              <div className="mt-6 space-y-5">
                <Field
                  label="Their name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Robert Miller"
                  autoFocus
                  autoComplete="off"
                />
                <Field
                  label="What they like to be called"
                  optional
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="Bob"
                  hint="If left blank, Lane will use their first name."
                  autoComplete="off"
                />
                {nameError && (
                  <p role="alert" className="rounded-lg bg-rust-wash px-4 py-3 text-rust-deep">
                    {nameError}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-3xl">A few warm details</h1>
              <p className="mt-2 text-ink-muted">
                These help Lane share memories instead of asking for them. All
                optional — you can add much more later.
              </p>
              <div className="mt-6 space-y-5">
                <Field
                  label="Year they were born"
                  optional
                  inputMode="numeric"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1942"
                />
                <Field
                  label="Hometown"
                  optional
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                  placeholder="Mobile, Alabama"
                />
                <TextArea
                  label="One happy memory"
                  optional
                  value={happyMemory}
                  onChange={(e) => setHappyMemory(e.target.value)}
                  placeholder="Summer evenings on the porch with sweet tea…"
                  hint="Lane will bring this up gently — never as a quiz."
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl">AI conversation (optional)</h1>
              <p className="mt-2 text-ink-muted">
                With an Anthropic API key, Lane holds a natural conversation.
                Without one, Keepsake still works fully using friendly built-in
                prompts — <strong>you can do this later</strong> in Settings.
              </p>
              <div className="mt-6 space-y-5">
                <Field
                  label="Anthropic API key"
                  optional
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-…"
                  hint="Stored only in this browser and sent only to Anthropic. A daily visit typically costs about a cent."
                  autoComplete="off"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-3xl">Set a caretaker PIN</h1>
              <p className="mt-2 text-ink-muted">
                The PIN keeps the caretaker area (profiles, settings, visit
                notes) tucked away on a shared tablet.
              </p>
              <div className="mt-6 space-y-5">
                <Field
                  label="PIN (4–6 digits)"
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  autoComplete="off"
                />
                <Field
                  label="Type it once more"
                  type="password"
                  inputMode="numeric"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  autoComplete="off"
                />
                {pinError && (
                  <p role="alert" className="rounded-lg bg-rust-wash px-4 py-3 text-rust-deep">
                    {pinError}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            {step > 0 ? (
              <Button variant="ghost" onClick={back}>
                ← Back
              </Button>
            ) : (
              <span />
            )}

            <div className="flex flex-wrap items-center gap-3">
              {step === 1 || step === 2 ? (
                <Button variant="ghost" onClick={next}>
                  Skip for now
                </Button>
              ) : null}
              {step === 3 && (
                <Button variant="ghost" onClick={() => finish(false)}>
                  Skip — no PIN
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={next}>Continue →</Button>
              ) : (
                <Button onClick={() => finish(true)}>Finish setup</Button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-base text-ink-faint">
          Keepsake is a wellness companion, not a medical device.
        </p>
      </div>
    </main>
  )
}

import { useEffect, useMemo, useState } from 'react'
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import Button from '../../components/Button'
import { LogoLockup } from '../../components/Logo'
import { isUnlocked, setUnlocked, verifyPin } from '../../lib/pin'
import {
  ensureSchema,
  loadProfiles,
  loadSettings,
  saveSettings,
  setActiveProfile,
  getActiveProfile,
} from '../../lib/storage'
import Dashboard from './Dashboard'
import ProfileEditor from './ProfileEditor'
import Profiles from './Profiles'
import Settings from './Settings'
import VisitLog from './VisitLog'
import Report from './Report'

/**
 * The PIN-protected caretaker area (FR-21). A local PIN keeps curious
 * fingers on a shared tablet out of profiles, notes, and settings — it
 * is honest, casual protection, not encryption (PRD §16.6).
 */

export default function CaretakerArea() {
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)
  const [unlocked, setUnlockedState] = useState(false)
  const [hasProfiles, setHasProfiles] = useState(true)

  useEffect(() => {
    ensureSchema()
    const profiles = loadProfiles()
    setHasProfiles(profiles.length > 0)
    const { pinHash } = loadSettings()
    setUnlockedState(!pinHash || isUnlocked())
    setChecked(true)
  }, [])

  if (!checked) return null
  if (!hasProfiles) return <Navigate to="/welcome" replace />

  if (!unlocked) {
    return (
      <PinScreen
        onUnlocked={() => {
          setUnlocked(true)
          setUnlockedState(true)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen pb-16">
      <CaretakerHeader
        onLock={() => {
          setUnlocked(false)
          navigate('/')
        }}
      />
      <main className="mx-auto max-w-5xl px-6">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<ProfileEditor />} />
          <Route path="profiles" element={<Profiles />} />
          <Route path="visits" element={<VisitLog />} />
          <Route path="report" element={<Report />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </main>
    </div>
  )
}

/* ------------------------------- header --------------------------------- */

function CaretakerHeader({ onLock }: { onLock: () => void }) {
  const navigate = useNavigate()
  const profiles = useMemo(() => loadProfiles(), [])
  const active = getActiveProfile()
  const { pinHash } = loadSettings()

  const tabs = [
    { to: '.', label: 'Home', end: true },
    { to: 'profile', label: 'Profile' },
    { to: 'visits', label: 'Visits' },
    { to: 'settings', label: 'Settings' },
  ]

  return (
    <header className="no-print border-b border-cream-deep bg-cream-soft/60">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg"
          aria-label="Back to the Keepsake home page"
        >
          <LogoLockup size={30} />
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {profiles.length > 1 && (
            <label className="flex items-center gap-2 text-base font-semibold text-ink-muted">
              <span className="sr-only">Active profile</span>
              <select
                className="min-h-[48px] rounded-lg border border-cream-deep bg-[#FFFDF9] px-3 py-2 text-base font-semibold text-ink"
                value={active?.id}
                onChange={(e) => {
                  setActiveProfile(e.target.value)
                  // Simplest reliable way to refresh every page's data:
                  window.location.reload()
                }}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.preferredName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {pinHash && (
            <Button variant="ghost" onClick={onLock} aria-label="Lock the caretaker area">
              Lock 🔒
            </Button>
          )}
          <Button onClick={() => navigate('/visit')}>Hand over the tablet →</Button>
        </div>
      </div>

      <nav className="mx-auto max-w-5xl px-6" aria-label="Caretaker pages">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                'min-h-[48px] whitespace-nowrap rounded-t-lg px-5 py-3 font-semibold ' +
                (isActive
                  ? 'bg-cream text-brand-deeper shadow-[inset_0_-3px_0_#5E93AC]'
                  : 'text-ink-muted hover:bg-cream hover:text-ink')
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}

/* ------------------------------ PIN screen ------------------------------- */

function PinScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const navigate = useNavigate()
  const [entry, setEntry] = useState('')
  const [error, setError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  async function submit(candidate: string) {
    const { pinHash } = loadSettings()
    if (!pinHash) {
      onUnlocked()
      return
    }
    if (await verifyPin(candidate, pinHash)) {
      onUnlocked()
    } else {
      setError("That PIN didn't match — try again.")
      setEntry('')
    }
  }

  function press(digit: string) {
    setError('')
    // Functional update so even the fastest tapping never drops a digit.
    setEntry((current) => (current + digit).slice(0, 6))
  }

  function resetPin() {
    // Friendly reset (FR-21 / §16.6): removes the PIN, keeps every profile
    // and visit. Casual protection deserves a no-drama recovery path.
    const settings = loadSettings()
    delete settings.pinHash
    saveSettings(settings)
    onUnlocked()
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <LogoLockup size={34} />
      <h1 className="mt-8 text-3xl">Caretaker area</h1>
      <p className="mt-2 text-ink-muted">Enter your PIN to continue.</p>

      {/* PIN dots */}
      <div
        className="mt-6 flex h-8 items-center gap-3"
        aria-label={`${entry.length} digits entered`}
        role="status"
      >
        {entry.length === 0 ? (
          <span className="text-ink-faint">· · · ·</span>
        ) : (
          Array.from(entry).map((_, i) => (
            <span key={i} className="h-4 w-4 rounded-full bg-brand-deep" />
          ))
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rust-wash px-4 py-2.5 text-rust-deep">
          {error}
        </p>
      )}

      {/* Big friendly keypad — comfortable on a tablet */}
      <div className="mt-6 grid w-64 grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            className="min-h-[64px] rounded-xl border border-cream-deep bg-[#FFFDF9] text-2xl font-semibold shadow-card hover:bg-cream-soft active:shadow-press"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => setEntry((e) => e.slice(0, -1))}
          aria-label="Delete last digit"
          className="min-h-[64px] rounded-xl text-2xl text-ink-muted hover:bg-cream-soft"
        >
          ⌫
        </button>
        <button
          onClick={() => press('0')}
          className="min-h-[64px] rounded-xl border border-cream-deep bg-[#FFFDF9] text-2xl font-semibold shadow-card hover:bg-cream-soft active:shadow-press"
        >
          0
        </button>
        <button
          onClick={() => submit(entry)}
          disabled={entry.length < 4}
          aria-label="Unlock"
          className="min-h-[64px] rounded-xl bg-amber text-2xl font-bold text-ink shadow-card disabled:opacity-40"
        >
          →
        </button>
      </div>

      <div className="mt-10 text-center">
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="font-semibold text-brand-deep underline underline-offset-4"
          >
            Forgot the PIN?
          </button>
        ) : (
          <div className="card max-w-sm p-5 text-left">
            <p className="text-base">
              Resetting removes the PIN so you can set a fresh one in
              Settings. All profiles and visits stay right where they are.
            </p>
            <div className="mt-4 flex gap-3">
              <Button variant="danger" onClick={resetPin}>
                Reset PIN
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Never mind
              </Button>
            </div>
          </div>
        )}
        <div className="mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-ink-faint underline underline-offset-4"
          >
            ← Back to the home page
          </button>
        </div>
      </div>
    </main>
  )
}

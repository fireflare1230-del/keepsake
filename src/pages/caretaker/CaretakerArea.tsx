import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { getSettings, checkPin, setPinAuthenticated, isPinAuthenticated } from '../../lib/storage'

// ─── PIN Guard ────────────────────────────────────────────────────────────────
function PinGuard({ onSuccess }: { onSuccess: () => void }) {
  const [pin,   setPin]   = useState('')
  const [error, setError] = useState('')

  function attempt() {
    if (checkPin(pin)) {
      setPinAuthenticated()
      onSuccess()
    } else {
      setError('Incorrect PIN. Please try again.')
      setPin('')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="card w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Caretaker Area</h2>
        <p className="text-navy/60 mb-6">Enter your PIN to continue.</p>

        <input
          className="input text-center text-3xl tracking-[0.5em] mb-4"
          type="password"
          inputMode="numeric"
          maxLength={8}
          placeholder="••••"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => { if (e.key === 'Enter') attempt() }}
          autoFocus
        />
        {error && <p className="text-danger text-sm mb-4">{error}</p>}
        <button onClick={attempt} disabled={pin.length < 1} className="btn-primary w-full">
          Unlock
        </button>
      </div>
    </div>
  )
}

// ─── Navigation link ──────────────────────────────────────────────────────────
function NavItem({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/caretaker'}
      className={({ isActive }) =>
        [
          'flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium transition-colors',
          isActive
            ? 'bg-brand/10 text-brand'
            : 'text-navy/60 hover:text-navy hover:bg-navy/5',
        ].join(' ')
      }
    >
      <span className="text-xl">{icon}</span>
      {label}
    </NavLink>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function CaretakerArea() {
  const navigate  = useNavigate()
  const settings  = getSettings()
  const needsPin  = !!settings.caretakerPin

  const [authed, setAuthed] = useState(() =>
    !needsPin || isPinAuthenticated()
  )

  if (!authed) {
    return <PinGuard onSuccess={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-navy/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-brand font-bold text-xl hover:opacity-80 transition-opacity"
          >
            Keepsake
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <NavItem to="/caretaker"            icon="📊" label="Dashboard" />
            <NavItem to="/caretaker/profile/new" icon="➕" label="New profile" />
            <NavItem to="/caretaker/settings"    icon="⚙️" label="Settings" />
          </nav>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

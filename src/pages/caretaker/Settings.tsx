import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings, saveSettings, clearPinSession } from '../../lib/storage'

const MODELS = [
  {
    id:    'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5 (default — fastest & cheapest)',
    note:  'Great for daily visits. ~$0.0008 per 1K tokens.',
  },
  {
    id:    'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6 (richer responses)',
    note:  'More nuanced conversations. ~$0.003 per 1K tokens.',
  },
]

export default function Settings() {
  const navigate  = useNavigate()
  const [settings, _] = useState(getSettings)   // initial load
  const [apiKey,   setApiKey]   = useState(settings.apiKey ?? '')
  const [showKey,  setShowKey]  = useState(false)
  const [model,    setModel]    = useState(settings.model)
  const [readAloud, setReadAloud] = useState(settings.readAloud !== false)
  const [pin,      setPin]      = useState(settings.caretakerPin ?? '')
  const [pinConfirm, setPinConfirm] = useState('')
  const [saved,    setSaved]    = useState(false)
  const [pinError, setPinError] = useState('')

  function save() {
    // Validate PIN
    if (pin && pin !== pinConfirm) { setPinError('PINs do not match.'); return }
    if (pin && !/^\d{4,8}$/.test(pin)) { setPinError('PIN must be 4–8 digits.'); return }
    setPinError('')

    saveSettings({
      apiKey:      apiKey.trim() || undefined,
      model,
      readAloud,
      caretakerPin: pin || undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function forgetKey() {
    setApiKey('')
    saveSettings({ ...getSettings(), apiKey: undefined })
  }

  function logout() {
    clearPinSession()
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button onClick={() => navigate('/caretaker')} className="btn-ghost text-base px-4 py-2 min-h-0">
          ← Dashboard
        </button>
      </div>

      <div className="space-y-6">

        {/* ── API key ─────────────────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-bold text-lg mb-1">Anthropic API key</h3>
          <p className="text-navy/60 text-base mb-4 leading-relaxed">
            Your key is stored only in this browser. Calls go directly from your browser to
            Anthropic — no server, no shared key. Only <em>you</em> are billed.{' '}
            <strong>Without a key, Lane uses free scripted conversations.</strong>
          </p>
          <div className="relative mb-3">
            <input
              className="input pr-20"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-ant-… (leave blank for free mode)"
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
          {settings.apiKey && (
            <button onClick={forgetKey} className="text-sm text-danger hover:underline">
              Forget saved key
            </button>
          )}
          <p className="text-sm text-navy/40 mt-2">
            Get a free key at console.anthropic.com. We recommend a $5/month spend limit.
          </p>
        </div>

        {/* ── Model ───────────────────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-bold text-lg mb-4">AI model</h3>
          <div className="space-y-3">
            {MODELS.map(m => (
              <label
                key={m.id}
                className={[
                  'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors',
                  model === m.id ? 'border-brand bg-brand/5' : 'border-navy/15 hover:border-brand/30',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="mt-1 accent-brand"
                />
                <div>
                  <p className="font-medium">{m.label}</p>
                  <p className="text-sm text-navy/50 mt-0.5">{m.note}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ── Read aloud ──────────────────────────────────────────────── */}
        <div className="card flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Read messages aloud</h3>
            <p className="text-navy/60 text-base mt-0.5">
              Lane will speak each message using your device's built-in text-to-speech.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={readAloud}
            onClick={() => setReadAloud(v => !v)}
            className={[
              'relative inline-flex w-14 h-8 rounded-full transition-colors duration-200 shrink-0 ml-4',
              readAloud ? 'bg-brand' : 'bg-navy/20',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200',
                readAloud ? 'translate-x-7' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        </div>

        {/* ── PIN ─────────────────────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-bold text-lg mb-1">Caretaker PIN</h3>
          <p className="text-navy/60 text-base mb-4">
            Set a 4–8 digit PIN to protect the caretaker area.
            Leave blank to allow open access.
          </p>
          {pinError && <p className="text-danger text-sm mb-3">{pinError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">New PIN</label>
              <input
                className="input"
                type="password"
                inputMode="numeric"
                placeholder="Leave blank to remove PIN"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,8))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm PIN</label>
              <input
                className="input"
                type="password"
                inputMode="numeric"
                placeholder="Repeat PIN"
                value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value.replace(/\D/g,'').slice(0,8))}
              />
            </div>
          </div>
        </div>

        {/* ── Save ────────────────────────────────────────────────────── */}
        <button onClick={save} className="btn-primary w-full text-xl">
          {saved ? '✓ Settings saved!' : 'Save settings'}
        </button>

        {/* ── Lock out ────────────────────────────────────────────────── */}
        {settings.caretakerPin && (
          <button
            onClick={logout}
            className="w-full text-center text-sm text-navy/40 hover:text-navy transition-colors py-2"
          >
            🔒 Lock caretaker area
          </button>
        )}

        {/* ── About ───────────────────────────────────────────────────── */}
        <div className="text-center text-sm text-navy/30 pb-4">
          <p>Keepsake v1.0 · All data stored locally in your browser.</p>
          <p className="mt-1">No accounts. No cloud. No shared keys.</p>
        </div>
      </div>
    </div>
  )
}

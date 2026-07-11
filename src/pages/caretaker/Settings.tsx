import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings, saveSettings, clearPinSession, getProfiles, saveProfile, generateId } from '../../lib/storage'
import { getSelectedVoiceName } from '../../lib/ai'
import type { SRTTarget } from '../../types'

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
  const [apiKey,      setApiKey]      = useState(settings.apiKey ?? '')
  const [showKey,     setShowKey]     = useState(false)
  const [model,       setModel]       = useState(settings.model)
  const [readAloud,   setReadAloud]   = useState(settings.readAloud !== false)
  const [pin,         setPin]         = useState(settings.caretakerPin ?? '')
  const [pinConfirm,  setPinConfirm]  = useState('')
  const [saved,       setSaved]       = useState(false)
  const [pinError,    setPinError]    = useState('')
  const [voiceMale,   setVoiceMale]   = useState(settings.voicePreferMale ?? false)
  const [voiceRate,   setVoiceRate]   = useState(settings.voiceRate ?? 0.85)

  // SRT targets — load from first profile (or all profiles if multi-profile)
  const profiles = getProfiles()
  const profile  = profiles[0]  // settings page targets the first profile for now
  const [srtTargets, setSrtTargets] = useState<SRTTarget[]>(profile?.srtTargets ?? [])
  const [srtPrompt,  setSrtPrompt]  = useState('')
  const [srtAnswer,  setSrtAnswer]  = useState('')
  const [srtError,   setSrtError]   = useState('')

  const activeTargets  = srtTargets.filter(t => !t.learnedAt)
  const learnedTargets = srtTargets.filter(t => !!t.learnedAt)

  function addSRTTarget() {
    if (!srtPrompt.trim() || !srtAnswer.trim()) { setSrtError('Both fields are required.'); return }
    if (activeTargets.length >= 2) { setSrtError('Maximum 2 active targets. Retire one first.'); return }
    setSrtError('')
    const newTarget: SRTTarget = {
      id: generateId(), prompt: srtPrompt.trim(), answer: srtAnswer.trim(),
      currentIntervalIdx: 0, consecutiveCorrect: 0,
    }
    const updated = [...srtTargets, newTarget]
    setSrtTargets(updated)
    if (profile) { saveProfile({ ...profile, srtTargets: updated }) }
    setSrtPrompt('')
    setSrtAnswer('')
  }

  function retireSRTTarget(id: string) {
    const updated = srtTargets.map(t =>
      t.id === id ? { ...t, learnedAt: new Date().toISOString() } : t,
    )
    setSrtTargets(updated)
    if (profile) { saveProfile({ ...profile, srtTargets: updated }) }
  }

  function deleteSRTTarget(id: string) {
    const updated = srtTargets.filter(t => t.id !== id)
    setSrtTargets(updated)
    if (profile) { saveProfile({ ...profile, srtTargets: updated }) }
  }

  function save() {
    // Validate PIN
    if (pin && pin !== pinConfirm) { setPinError('PINs do not match.'); return }
    if (pin && !/^\d{4,8}$/.test(pin)) { setPinError('PIN must be 4–8 digits.'); return }
    setPinError('')

    saveSettings({
      apiKey:         apiKey.trim() || undefined,
      model,
      readAloud,
      caretakerPin:   pin || undefined,
      voicePreferMale: voiceMale,
      voiceRate,
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

        {/* ── Voice ───────────────────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-bold text-lg mb-1">Lane's voice</h3>
          <p className="text-navy/60 text-base mb-4 leading-relaxed">
            Keepsake picks the warmest-sounding voice available on this device.
            No paid API needed — free browser speech synthesis only.
          </p>

          <div className="bg-brand/5 rounded-xl px-4 py-3 mb-4 text-sm text-navy/60 font-medium">
            Currently using: <span className="text-navy font-semibold">{getSelectedVoiceName()}</span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Prefer male voice</p>
              <p className="text-sm text-navy/50 mt-0.5">Closer to the warm "Adam" reference sound.</p>
            </div>
            <button
              role="switch"
              aria-checked={voiceMale}
              onClick={() => setVoiceMale(v => !v)}
              className={['relative inline-flex w-14 h-8 rounded-full transition-colors duration-200 shrink-0 ml-4', voiceMale ? 'bg-brand' : 'bg-navy/20'].join(' ')}
            >
              <span className={['absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200', voiceMale ? 'translate-x-7' : 'translate-x-1'].join(' ')} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Speaking rate: <span className="text-brand font-bold">{voiceRate.toFixed(2)}×</span>
              <span className="text-navy/40 font-normal ml-2">(slower ← → faster)</span>
            </label>
            <input
              type="range"
              min={0.7} max={1.0} step={0.05}
              value={voiceRate}
              onChange={e => setVoiceRate(parseFloat(e.target.value))}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-xs text-navy/40 mt-1">
              <span>0.70</span><span>1.00</span>
            </div>
          </div>
        </div>

        {/* ── SRT Memory Targets ───────────────────────────────────────── */}
        {profile && (
          <div className="card">
            <h3 className="font-bold text-lg mb-1">Memory targets <span className="text-sm font-normal text-navy/40">(Spaced Retrieval Training)</span></h3>
            <p className="text-navy/60 text-base mb-4 leading-relaxed">
              Pick 1–2 specific facts for Lane to gently practice with {profile.preferredName || profile.name} — a grandchild's name, a caregiver's name, a daily routine cue. Lane will weave these into visits using clinically-established errorless learning.
            </p>

            {/* Active targets */}
            {activeTargets.length > 0 && (
              <div className="space-y-3 mb-4">
                {activeTargets.map(t => (
                  <div key={t.id} className="flex items-start gap-3 bg-brand/5 rounded-xl p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy text-sm">{t.prompt}</p>
                      <p className="text-brand font-bold">→ {t.answer}</p>
                      <p className="text-xs text-navy/40 mt-1">
                        {t.consecutiveCorrect} consecutive correct · interval stage {t.currentIntervalIdx + 1}/7
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => retireSRTTarget(t.id)} className="text-xs text-success hover:underline font-medium">Retire</button>
                      <button onClick={() => deleteSRTTarget(t.id)} className="text-xs text-danger hover:underline font-medium">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Learned targets */}
            {learnedTargets.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-success/70 uppercase tracking-widest mb-2">Learned ✓</p>
                <div className="space-y-2">
                  {learnedTargets.map(t => (
                    <div key={t.id} className="flex items-center justify-between bg-success/5 rounded-xl px-4 py-3">
                      <div>
                        <span className="text-sm text-navy/60 line-through">{t.prompt}</span>
                        <span className="text-sm text-success font-semibold ml-2">→ {t.answer}</span>
                      </div>
                      <button onClick={() => deleteSRTTarget(t.id)} className="text-xs text-danger/60 hover:underline ml-3">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new target */}
            {activeTargets.length < 2 && (
              <div className="border-t border-navy/10 pt-4 mt-2">
                <p className="text-sm font-semibold text-navy/70 mb-3">Add a new memory target</p>
                {srtError && <p className="text-danger text-sm mb-2">{srtError}</p>}
                <div className="space-y-2 mb-3">
                  <input
                    className="input text-base py-2"
                    placeholder="What to practice, e.g. your granddaughter's name"
                    value={srtPrompt}
                    onChange={e => setSrtPrompt(e.target.value)}
                  />
                  <input
                    className="input text-base py-2"
                    placeholder='Correct answer, e.g. "Emma"'
                    value={srtAnswer}
                    onChange={e => setSrtAnswer(e.target.value)}
                  />
                </div>
                <button onClick={addSRTTarget} className="btn-primary text-base py-2 px-6 rounded-xl min-h-0">
                  + Add target
                </button>
              </div>
            )}
            {activeTargets.length >= 2 && (
              <p className="text-sm text-navy/40 border-t border-navy/10 pt-4 mt-2">
                Maximum 2 active targets. Retire a target once it's consistently recalled (3 in a row) to make room for a new one.
              </p>
            )}
          </div>
        )}

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

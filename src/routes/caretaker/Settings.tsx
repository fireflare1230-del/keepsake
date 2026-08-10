import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button'
import { Field } from '../../components/Field'
import { testConnection } from '../../features/lane/apiClient'
import {
  backupToCloud,
  deleteCloudBackup,
  getCloudStatus,
  getCurrentUser,
  restoreFromCloud,
  signIn,
  signOut,
  signUp,
} from '../../lib/cloud'
import { friendlyDateTime } from '../../lib/dates'
import { hashPin } from '../../lib/pin'
import { canSpeak, listVoices, speak, whenVoicesReady } from '../../lib/speech'
import { downloadReminderIcs } from '../../lib/reminder'
import {
  buildBackup,
  forgetApiKey,
  getActiveProfile,
  loadSettings,
  restoreBackup,
  saveSettings,
} from '../../lib/storage'
import { MODEL_OPTIONS } from '../../types'

/**
 * Settings (FR-27): API key with "forget key", model picker, PIN change,
 * read-aloud toggle, Test connection, plus data backup & restore (§16.11).
 */

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings())
  const [keyDraft, setKeyDraft] = useState(settings.apiKey ?? '')
  const [showKey, setShowKey] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const [pinDraft, setPinDraft] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinMessage, setPinMessage] = useState('')

  const [backupMessage, setBackupMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  // Daily reminder + phone install (v1.3)
  const [reminderTime, setReminderTime] = useState('10:00')
  const [reminderMessage, setReminderMessage] = useState('')
  const [copied, setCopied] = useState(false)

  // Voice picker (v1.1)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  useEffect(() => {
    whenVoicesReady().then(() => setVoices(listVoices()))
  }, [])

  // Account & sync (v1.1)
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState('')
  const [passwordDraft, setPasswordDraft] = useState('')
  const [accountBusy, setAccountBusy] = useState(false)
  const [accountMessage, setAccountMessage] = useState<{ ok: boolean; message: string } | null>(null)
  const [lastBackedUpAt, setLastBackedUpAt] = useState<string | undefined>()
  useEffect(() => {
    getCurrentUser().then((user) => {
      setAccountEmail(user?.email ?? null)
      if (user) getCloudStatus().then((s) => setLastBackedUpAt(s.lastBackedUpAt))
    })
  }, [])

  async function runAccountAction(
    action: () => Promise<{ ok: boolean; message: string }>
  ) {
    setAccountBusy(true)
    setAccountMessage(null)
    const result = await action()
    setAccountMessage(result)
    const user = await getCurrentUser()
    setAccountEmail(user?.email ?? null)
    if (user) getCloudStatus().then((s) => setLastBackedUpAt(s.lastBackedUpAt))
    setAccountBusy(false)
  }

  function persist(next: typeof settings) {
    setSettings(next)
    saveSettings(next)
  }

  /* ------------------------------- key -------------------------------- */

  function saveKey() {
    const trimmed = keyDraft.trim()
    persist({ ...settings, apiKey: trimmed || undefined })
    setTestResult(null)
  }

  function handleForgetKey() {
    forgetApiKey()
    const next = loadSettings()
    setSettings(next)
    setKeyDraft('')
    setTestResult({ ok: true, message: 'The key has been removed from this browser.' })
  }

  async function runTest() {
    setTesting(true)
    setTestResult(null)
    const stored = loadSettings()
    const result = await testConnection(stored.apiKey, stored.model)
    setTestResult(result)
    setTesting(false)
  }

  /* ------------------------------- pin -------------------------------- */

  async function changePin() {
    if (!/^\d{4,6}$/.test(pinDraft)) {
      setPinMessage('The PIN should be 4 to 6 digits.')
      return
    }
    if (pinDraft !== pinConfirm) {
      setPinMessage("Those PINs don't match, one more try.")
      return
    }
    persist({ ...settings, pinHash: await hashPin(pinDraft) })
    setPinDraft('')
    setPinConfirm('')
    setPinMessage('PIN updated ✓')
  }

  function removePin() {
    const next = { ...settings }
    delete next.pinHash
    persist(next)
    setPinMessage('PIN removed, the caretaker area is open on this device.')
  }

  /* ----------------------------- backups ------------------------------- */

  function downloadBackup() {
    const backup = buildBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keepsake-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setBackupMessage('Backup downloaded, keep it somewhere safe.')
  }

  function importBackup(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const result = restoreBackup(String(reader.result ?? ''))
      setBackupMessage(result.message)
      if (result.ok) setTimeout(() => window.location.reload(), 1200)
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-3xl py-8">
      <h1 className="text-3xl">Settings</h1>

      {/* --------------------------- AI connection --------------------------- */}
      <section className="card mt-8" aria-labelledby="ai-heading">
        <h2 id="ai-heading" className="text-2xl">
          AI conversation
        </h2>
        <p className="mt-2 text-base text-ink-muted">
          Your Anthropic API key stays in this browser and is sent only to
          Anthropic, never to any other server. Without a key, Lane uses
          friendly built-in prompts and Keepsake stays completely free.
        </p>

        <div className="mt-5 space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field
                label="Anthropic API key"
                type={showKey ? 'text' : 'password'}
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="sk-ant-…"
                autoComplete="off"
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowKey((s) => !s)}
              aria-pressed={showKey}
            >
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveKey}>Save key</Button>
            <Button variant="secondary" onClick={runTest} disabled={testing}>
              {testing ? 'Testing…' : 'Test connection'}
            </Button>
            {settings.apiKey && (
              <Button variant="danger" onClick={handleForgetKey}>
                Forget key
              </Button>
            )}
          </div>
          {testResult && (
            <p
              role="status"
              className={
                'rounded-lg px-4 py-3 ' +
                (testResult.ok
                  ? 'bg-moss-wash text-moss-deep'
                  : 'bg-rust-wash text-rust-deep')
              }
            >
              {testResult.message}
            </p>
          )}
          <p className="text-base text-ink-faint">
            Tip: create the key in a dedicated workspace at
            console.anthropic.com and set a monthly spend cap (about $5) as a
            safety net. Daily visits typically cost a cent or two.
          </p>
        </div>
      </section>

      {/* ----------------------------- model picker ---------------------------- */}
      <section className="card mt-6" aria-labelledby="model-heading">
        <h2 id="model-heading" className="text-2xl">
          Conversation model
        </h2>
        <div role="radiogroup" aria-labelledby="model-heading" className="mt-5 space-y-3">
          {MODEL_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={
                'flex cursor-pointer items-start gap-4 rounded-lg border p-4 ' +
                (settings.model === option.id
                  ? 'border-brand bg-brand-wash'
                  : 'border-cream-deep bg-[#FFFDF9] hover:bg-cream-soft')
              }
            >
              <input
                type="radio"
                name="model"
                className="mt-1.5 h-5 w-5 accent-[#3E6E86]"
                checked={settings.model === option.id}
                onChange={() => persist({ ...settings, model: option.id })}
              />
              <span>
                <span className="block font-semibold">{option.label}</span>
                <span className="mt-0.5 block text-base text-ink-faint">
                  {option.note}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-4 text-base text-ink-faint">
          Prices change, confirm current rates on Anthropic&rsquo;s pricing
          page.
        </p>
      </section>

      {/* ------------------------------ read aloud ------------------------------ */}
      <section className="card mt-6" aria-labelledby="voice-heading">
        <h2 id="voice-heading" className="text-2xl">
          Read aloud
        </h2>
        <label className="mt-4 flex min-h-[48px] cursor-pointer items-center gap-4">
          <input
            type="checkbox"
            className="h-6 w-6 accent-[#3E6E86]"
            checked={settings.readAloudEnabled}
            onChange={(e) =>
              persist({ ...settings, readAloudEnabled: e.target.checked })
            }
          />
          <span className="text-lg">
            Offer to read Lane&rsquo;s messages out loud during visits
          </span>
        </label>

        {canSpeak() && voices.length > 0 && (
          <div className="mt-5 border-t border-cream-deep pt-5">
            <label htmlFor="voice-picker" className="mb-1.5 block font-semibold text-ink">
              Lane&rsquo;s voice
            </label>
            <p className="mb-3 text-base text-ink-faint">
              Keepsake picks the most natural voice your device offers. You
              can choose a different one and hear a sample.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                id="voice-picker"
                className="min-h-[48px] max-w-full rounded-lg border border-cream-deep bg-[#FFFDF9] px-3 py-2 text-base"
                value={settings.voiceURI ?? ''}
                onChange={(e) =>
                  persist({ ...settings, voiceURI: e.target.value || undefined })
                }
              >
                <option value="">Automatic (best available)</option>
                {voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name.replace(/^Microsoft\s|\(Natural\)\s*|- English.*$/g, '').trim() || voice.name}
                    {/natural|neural/i.test(voice.name) ? ' (natural)' : ''}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={() =>
                  speak(
                    "Good morning. It's so good to sit with you today.",
                    loadSettings().voiceURI
                  )
                }
              >
                🔊 Hear a sample
              </Button>
            </div>
            <p className="mt-3 text-base text-ink-faint">
              Tip: on Windows tablets, Microsoft Edge offers the most
              natural-sounding voices.
            </p>
          </div>
        )}
      </section>

      {/* -------------------------------- PIN --------------------------------- */}
      <section className="card mt-6" aria-labelledby="pin-heading">
        <h2 id="pin-heading" className="text-2xl">
          Caretaker PIN
        </h2>
        <p className="mt-2 text-base text-ink-muted">
          {settings.pinHash
            ? 'A PIN is set. It keeps casual fingers out on a shared tablet, it is not bank-grade security.'
            : 'No PIN is set, anyone using this device can open the caretaker area.'}
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label={settings.pinHash ? 'New PIN (4-6 digits)' : 'PIN (4-6 digits)'}
            type="password"
            inputMode="numeric"
            value={pinDraft}
            onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete="off"
          />
          <Field
            label="Type it once more"
            type="password"
            inputMode="numeric"
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete="off"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={changePin}>
            {settings.pinHash ? 'Change PIN' : 'Set PIN'}
          </Button>
          {settings.pinHash && (
            <Button variant="danger" onClick={removePin}>
              Remove PIN
            </Button>
          )}
        </div>
        {pinMessage && (
          <p role="status" className="mt-4 rounded-lg bg-brand-wash px-4 py-3 text-brand-deeper">
            {pinMessage}
          </p>
        )}
      </section>

      {/* --------------------------- account & sync ---------------------------- */}
      <section className="card mt-6" aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-2xl">
          Keepsake account &amp; cloud backup
        </h2>
        <p className="mt-2 text-base text-ink-muted">
          Optional and free. An account keeps a private copy of profiles and
          visits in the cloud, so you can restore them on a new device or
          after a browser cleanup. Your AI key and PIN never leave this
          device, and Keepsake works fully without an account.
        </p>

        {accountEmail ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-lg bg-moss-wash px-4 py-3 text-moss-deep">
              Signed in as <strong>{accountEmail}</strong>
              {lastBackedUpAt
                ? `. Last backup: ${friendlyDateTime(lastBackedUpAt)}.`
                : '. No cloud backup yet.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={accountBusy}
                onClick={() => runAccountAction(backupToCloud)}
              >
                Back up now
              </Button>
              <Button
                variant="secondary"
                disabled={accountBusy}
                onClick={() =>
                  runAccountAction(async () => {
                    const result = await restoreFromCloud()
                    if (result.ok) setTimeout(() => window.location.reload(), 1200)
                    return result
                  })
                }
              >
                Restore from cloud
              </Button>
              <Button
                variant="ghost"
                disabled={accountBusy}
                onClick={() =>
                  runAccountAction(async () => {
                    await signOut()
                    return { ok: true, message: 'Signed out. Your data stays on this device.' }
                  })
                }
              >
                Sign out
              </Button>
              <Button
                variant="danger"
                disabled={accountBusy}
                onClick={() => runAccountAction(deleteCloudBackup)}
              >
                Delete cloud copy
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Email"
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder="you@example.com"
                autoComplete="off"
              />
              <Field
                label="Password"
                type="password"
                value={passwordDraft}
                onChange={(e) => setPasswordDraft(e.target.value)}
                hint="At least 6 characters."
                autoComplete="off"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={accountBusy || !emailDraft.trim() || passwordDraft.length < 6}
                onClick={() =>
                  runAccountAction(() => signIn(emailDraft.trim(), passwordDraft))
                }
              >
                Sign in
              </Button>
              <Button
                variant="secondary"
                disabled={accountBusy || !emailDraft.trim() || passwordDraft.length < 6}
                onClick={() =>
                  runAccountAction(() => signUp(emailDraft.trim(), passwordDraft))
                }
              >
                Create account
              </Button>
            </div>
          </div>
        )}
        {accountMessage && (
          <p
            role="status"
            className={
              'mt-4 rounded-lg px-4 py-3 ' +
              (accountMessage.ok
                ? 'bg-moss-wash text-moss-deep'
                : 'bg-rust-wash text-rust-deep')
            }
          >
            {accountMessage.message}
          </p>
        )}
      </section>

      {/* --------------------------- daily reminder --------------------------- */}
      <section className="card mt-6" aria-labelledby="reminder-heading">
        <h2 id="reminder-heading" className="text-2xl">
          Daily visit reminder
        </h2>
        <p className="mt-2 text-base text-ink-muted">
          The gentlest way to build the ritual: a repeating reminder in your
          phone&rsquo;s own calendar. Your phone delivers it reliably every
          day, even when Keepsake isn&rsquo;t open. Pick a time, add it once,
          done.
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="reminder-time" className="mb-1.5 block font-semibold text-ink">
              Time each day
            </label>
            <input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="min-h-[48px] rounded-lg border border-cream-deep bg-[#FFFDF9] px-4 py-3 text-base text-ink"
            />
          </div>
          <Button
            onClick={() => {
              downloadReminderIcs(
                reminderTime,
                getActiveProfile()?.preferredName ?? 'your loved one'
              )
              setReminderMessage(
                'Reminder downloaded. Open the file and your calendar will offer to add it. On a phone, it lands right in the calendar app.'
              )
            }}
          >
            Add to my calendar
          </Button>
        </div>
        {reminderMessage && (
          <p role="status" className="mt-4 rounded-lg bg-brand-wash px-4 py-3 text-brand-deeper">
            {reminderMessage}
          </p>
        )}
      </section>

      {/* ------------------------- put it on your phone ------------------------ */}
      <section className="card mt-6" aria-labelledby="install-heading">
        <h2 id="install-heading" className="text-2xl">
          Put Keepsake on your phone
        </h2>
        <p className="mt-2 text-base text-ink-muted">
          Keepsake installs like a real app, icon on the home screen, full
          screen, works offline. Open this address on the phone, then:
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="rounded-lg bg-cream-soft px-4 py-2.5 text-base">
            {window.location.origin + window.location.pathname}
          </code>
          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard
                ?.writeText(window.location.origin + window.location.pathname)
                .then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                })
                .catch(() => {})
            }}
          >
            {copied ? 'Copied ✓' : 'Copy address'}
          </Button>
        </div>
        <ul className="mt-4 space-y-2 text-base text-ink-muted">
          <li>
            <strong className="text-ink">iPhone / iPad:</strong> open it in
            Safari, tap the Share button, then &ldquo;Add to Home
            Screen&rdquo;.
          </li>
          <li>
            <strong className="text-ink">Android:</strong> open it in Chrome,
            tap the ⋮ menu, then &ldquo;Install app&rdquo; (or &ldquo;Add to
            Home screen&rdquo;).
          </li>
        </ul>
        <p className="mt-3 text-base text-ink-faint">
          Each device keeps its own data. Use the optional account above to
          move profiles and visits between devices; photos stay on the device
          that added them.
        </p>
      </section>

      {/* ---------------------------- data & backup ---------------------------- */}
      <section className="card mt-6" aria-labelledby="data-heading">
        <h2 id="data-heading" className="text-2xl">
          Your data
        </h2>
        <p className="mt-2 text-base text-ink-muted">
          Everything lives in this browser. Browsers occasionally clear
          storage, so download a backup now and then, these are precious
          memories. Backups never include your API key. Family photos stay on
          this device and aren&rsquo;t part of the backup file.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={downloadBackup}>
            Download backup (JSON)
          </Button>
          <Button variant="ghost" onClick={() => fileInput.current?.click()}>
            Restore from backup…
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importBackup(file)
              e.target.value = ''
            }}
          />
        </div>
        {backupMessage && (
          <p role="status" className="mt-4 rounded-lg bg-brand-wash px-4 py-3 text-brand-deeper">
            {backupMessage}
          </p>
        )}
      </section>
    </div>
  )
}

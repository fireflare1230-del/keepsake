import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getProfile, saveProfile, deleteProfile, generateId,
} from '../../lib/storage'
import type { PatientProfile, FamilyMember, YouTubeLink } from '../../types'

type Tab = 'basics' | 'family' | 'music' | 'story' | 'guidance'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'basics',    label: 'Basics',   icon: '👤' },
  { id: 'family',    label: 'Family',   icon: '❤️' },
  { id: 'music',     label: 'Music',    icon: '🎵' },
  { id: 'story',     label: 'Life story', icon: '📖' },
  { id: 'guidance',  label: 'Guidance', icon: '🧠' },
]

// ─── Tag list editor ──────────────────────────────────────────────────────────
function TagEditor({
  items, onChange, placeholder, addLabel,
}: {
  items: string[]; onChange: (v: string[]) => void; placeholder: string; addLabel: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const v = input.trim()
    if (!v || items.includes(v)) return
    onChange([...items, v])
    setInput('')
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          className="input flex-1"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button onClick={add} className="btn-secondary px-5">{addLabel}</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="tag">
            {item}
            <button
              onClick={() => remove(i)}
              className="ml-1 text-brand/60 hover:text-danger transition-colors"
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ProfileEditor() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const isNew     = id === 'new' || !id
  const existing  = isNew ? undefined : getProfile(id)

  const [tab,          setTab]          = useState<Tab>('basics')
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState('')
  const [confirmDel,   setConfirmDel]   = useState(false)

  // ── Form fields ──────────────────────────────────────────────────────────
  const [name,                setName]               = useState(existing?.name ?? '')
  const [preferredName,       setPreferredName]      = useState(existing?.preferredName ?? '')
  const [birthYear,           setBirthYear]          = useState(existing?.birthYear?.toString() ?? '')
  const [hometown,            setHometown]           = useState(existing?.hometown ?? '')
  const [firstHappyMemory,    setFirstHappyMemory]   = useState(existing?.firstHappyMemory ?? '')
  const [lifeStory,           setLifeStory]          = useState(existing?.lifeStory ?? '')
  const [topicsToAvoid,       setTopicsToAvoid]      = useState<string[]>(existing?.topicsToAvoid ?? [])
  const [factsToReinforce,    setFactsToReinforce]   = useState<string[]>(existing?.gentleFactsToReinforce ?? [])
  const [familyPeople,        setFamilyPeople]       = useState<FamilyMember[]>(existing?.familyPeople ?? [])
  const [favoriteMusic,       setFavoriteMusic]      = useState<YouTubeLink[]>(existing?.favoriteMusic ?? [])

  // Family edit state
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null)
  const [famName,         setFamName]         = useState('')
  const [famRelation,     setFamRelation]     = useState('')
  const [famMemory,       setFamMemory]       = useState('')

  // Music add state
  const [musicTitle,  setMusicTitle]  = useState('')
  const [musicUrl,    setMusicUrl]    = useState('')

  function saveChanges() {
    if (!name.trim()) { setError('Name is required.'); setTab('basics'); return }
    setError('')

    const now = new Date().toISOString()
    const profile: PatientProfile = {
      id:                     existing?.id ?? generateId(),
      name:                   name.trim(),
      preferredName:          preferredName.trim() || name.trim(),
      birthYear:              birthYear ? parseInt(birthYear) : undefined,
      hometown:               hometown.trim() || undefined,
      firstHappyMemory:       firstHappyMemory.trim() || undefined,
      familyPeople,
      favoriteMusic,
      lifeStory:              lifeStory.trim(),
      topicsToAvoid,
      gentleFactsToReinforce: factsToReinforce,
      srtTargets:             existing?.srtTargets ?? [],
      createdAt:              existing?.createdAt ?? now,
      lastVisitAt:            existing?.lastVisitAt,
      streak:                 existing?.streak ?? 0,
      lastStreakDate:         existing?.lastStreakDate,
    }
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── Family helpers ────────────────────────────────────────────────────────
  function startAddFamily() {
    setEditingFamilyId('__new__')
    setFamName(''); setFamRelation(''); setFamMemory('')
  }

  function startEditFamily(person: FamilyMember) {
    setEditingFamilyId(person.id)
    setFamName(person.name); setFamRelation(person.relationship); setFamMemory(person.memory ?? '')
  }

  function saveFamily() {
    if (!famName.trim() || !famRelation.trim()) return
    const person: FamilyMember = {
      id:           editingFamilyId === '__new__' ? generateId() : editingFamilyId!,
      name:         famName.trim(),
      relationship: famRelation.trim(),
      memory:       famMemory.trim() || undefined,
    }
    if (editingFamilyId === '__new__') {
      setFamilyPeople(prev => [...prev, person])
    } else {
      setFamilyPeople(prev => prev.map(p => p.id === person.id ? person : p))
    }
    setEditingFamilyId(null)
  }

  function removeFamily(id: string) {
    setFamilyPeople(prev => prev.filter(p => p.id !== id))
  }

  // ── Music helpers ─────────────────────────────────────────────────────────
  function addMusic() {
    if (!musicTitle.trim() || !musicUrl.trim()) return
    setFavoriteMusic(prev => [...prev, { id: generateId(), title: musicTitle.trim(), url: musicUrl.trim() }])
    setMusicTitle(''); setMusicUrl('')
  }

  function removeMusic(id: string) {
    setFavoriteMusic(prev => prev.filter(m => m.id !== id))
  }

  // ── Delete profile ────────────────────────────────────────────────────────
  function handleDelete() {
    if (!existing) return
    deleteProfile(existing.id)
    navigate('/caretaker')
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isNew ? 'New profile' : `Edit: ${name || 'Profile'}`}</h1>
        <div className="flex gap-2">
          {!isNew && (
            <button
              onClick={() => setConfirmDel(true)}
              className="text-sm text-danger/60 hover:text-danger transition-colors px-3 py-1"
            >
              Delete profile
            </button>
          )}
          <button onClick={saveChanges} className="btn-primary px-6">
            {saved ? '✓ Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {error && <div className="bg-danger/10 text-danger rounded-xl px-4 py-3 mb-4">{error}</div>}

      {/* Tab bar */}
      <div className="flex gap-1 bg-navy/5 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              tab === t.id
                ? 'bg-white text-navy shadow-sm'
                : 'text-navy/50 hover:text-navy',
            ].join(' ')}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Basics ─────────────────────────────────────────────────── */}
      {tab === 'basics' && (
        <div className="space-y-5">
          <div>
            <label className="block font-semibold mb-2">Full name *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Robert Walker" />
          </div>
          <div>
            <label className="block font-semibold mb-2">Preferred name</label>
            <input className="input" value={preferredName} onChange={e => setPreferredName(e.target.value)} placeholder={`e.g. Bob, Grandpa — leave blank to use ${name || 'their full name'}`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Birth year</label>
              <input className="input" value={birthYear} onChange={e => setBirthYear(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="e.g. 1942" inputMode="numeric" />
            </div>
            <div>
              <label className="block font-semibold mb-2">Hometown</label>
              <input className="input" value={hometown} onChange={e => setHometown(e.target.value)} placeholder="e.g. Albany, NY" />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-2">A first happy memory (seed)</label>
            <textarea className="textarea min-h-[100px]" value={firstHappyMemory} onChange={e => setFirstHappyMemory(e.target.value)} placeholder="A short happy memory to help Lane open warm conversations." />
          </div>
        </div>
      )}

      {/* ── Tab: Family ──────────────────────────────────────────────────── */}
      {tab === 'family' && (
        <div>
          <p className="text-navy/60 mb-4 text-base">
            Lane will warmly mention these people during family reminiscence moments.
          </p>

          {editingFamilyId ? (
            <div className="card mb-4">
              <h4 className="font-bold mb-4">{editingFamilyId === '__new__' ? 'Add family member' : 'Edit family member'}</h4>
              <div className="space-y-3">
                <input className="input" placeholder="Name *" value={famName} onChange={e => setFamName(e.target.value)} />
                <input className="input" placeholder="Relationship * (son, daughter, granddaughter…)" value={famRelation} onChange={e => setFamRelation(e.target.value)} />
                <textarea className="textarea" placeholder="A happy memory involving this person (optional)" value={famMemory} onChange={e => setFamMemory(e.target.value)} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditingFamilyId(null)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={saveFamily} disabled={!famName.trim()||!famRelation.trim()} className="btn-primary flex-[2]">Save</button>
              </div>
            </div>
          ) : (
            <button onClick={startAddFamily} className="btn-secondary w-full mb-4">+ Add family member</button>
          )}

          <div className="space-y-3">
            {familyPeople.map(person => (
              <div key={person.id} className="card flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-semibold">{person.name} <span className="text-navy/50 font-normal">· {person.relationship}</span></p>
                  {person.memory && <p className="text-sm text-navy/60 mt-1 italic">"{person.memory}"</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEditFamily(person)} className="text-brand hover:underline text-sm">Edit</button>
                  <button onClick={() => removeFamily(person.id)} className="text-danger hover:underline text-sm">Remove</button>
                </div>
              </div>
            ))}
            {familyPeople.length === 0 && !editingFamilyId && (
              <p className="text-navy/40 text-center py-8">No family members added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Music ───────────────────────────────────────────────────── */}
      {tab === 'music' && (
        <div>
          <p className="text-navy/60 mb-4 text-base">
            Add YouTube links to favourite songs. During visits, Lane will play a random one.
          </p>
          <div className="card mb-4 space-y-3">
            <input className="input" placeholder="Song title (e.g. Moon River)" value={musicTitle} onChange={e => setMusicTitle(e.target.value)} />
            <input className="input" placeholder="YouTube URL (e.g. https://youtu.be/…)" value={musicUrl} onChange={e => setMusicUrl(e.target.value)} />
            <button onClick={addMusic} disabled={!musicTitle.trim()||!musicUrl.trim()} className="btn-secondary w-full">Add song</button>
          </div>
          <div className="space-y-3">
            {favoriteMusic.map(song => (
              <div key={song.id} className="card flex items-center gap-4">
                <span className="text-2xl">🎵</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{song.title}</p>
                  <p className="text-sm text-navy/40 truncate">{song.url}</p>
                </div>
                <button onClick={() => removeMusic(song.id)} className="text-danger hover:underline text-sm shrink-0">Remove</button>
              </div>
            ))}
            {favoriteMusic.length === 0 && (
              <p className="text-navy/40 text-center py-8">No songs added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Life story ──────────────────────────────────────────────── */}
      {tab === 'story' && (
        <div>
          <p className="text-navy/60 mb-4 text-base">
            Write a brief life story — where they grew up, work, passions, important moments.
            Lane uses this to personalise every conversation.
          </p>
          <textarea
            className="textarea min-h-[280px]"
            placeholder={`${name || 'They'} grew up in… They loved… They worked as… Their proudest moment was…`}
            value={lifeStory}
            onChange={e => setLifeStory(e.target.value)}
          />
          <p className="text-sm text-navy/40 mt-2">{lifeStory.length} characters</p>
        </div>
      )}

      {/* ── Tab: Guidance ────────────────────────────────────────────────── */}
      {tab === 'guidance' && (
        <div className="space-y-8">
          <div>
            <label className="block font-bold text-lg mb-1">Topics to gently avoid</label>
            <p className="text-navy/60 text-base mb-3">
              Lane will stay away from these subjects (e.g. "recent death of a sibling", "car accident").
            </p>
            <TagEditor
              items={topicsToAvoid}
              onChange={setTopicsToAvoid}
              placeholder="Add a topic to avoid…"
              addLabel="Add"
            />
          </div>

          <div>
            <label className="block font-bold text-lg mb-1">Gentle facts to reinforce</label>
            <p className="text-navy/60 text-base mb-3">
              Once per visit, Lane will warmly <em>state</em> one of these as a grounding fact —
              never as a quiz. Good examples: "Your son James visits every Sunday."
              "You live in Oak Hill — you moved there in 1988."
            </p>
            <TagEditor
              items={factsToReinforce}
              onChange={setFactsToReinforce}
              placeholder="Add a fact to gently reinforce…"
              addLabel="Add"
            />
          </div>
        </div>
      )}

      {/* ── Save button (repeated at bottom) ─────────────────────────────── */}
      <div className="mt-8 flex gap-3">
        <button onClick={() => navigate('/caretaker')} className="btn-ghost flex-1">← Back to dashboard</button>
        <button onClick={saveChanges} className="btn-primary flex-[2]">
          {saved ? '✓ Saved!' : 'Save profile'}
        </button>
      </div>

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full text-center">
            <p className="text-2xl mb-3">⚠️</p>
            <h3 className="text-xl font-bold mb-2">Delete this profile?</h3>
            <p className="text-navy/60 mb-6">
              This will permanently delete <strong>{name}'s</strong> profile and all visit history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleDelete} className="bg-danger text-white font-semibold rounded-xl min-h-[48px] px-6 flex-1 hover:brightness-110 transition-all">
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

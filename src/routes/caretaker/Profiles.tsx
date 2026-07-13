import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import { Field } from '../../components/Field'
import {
  deleteProfile,
  loadAppState,
  loadProfiles,
  saveProfile,
  setActiveProfile,
  uid,
} from '../../lib/storage'
import { emptyFavorites, type Profile } from '../../types'

/** Multiple profiles: switch, add, edit, delete (FR-10..12). */

export default function Profiles() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles())
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPreferred, setNewPreferred] = useState('')
  const activeId = loadAppState().activeProfileId ?? profiles[0]?.id

  function refresh() {
    setProfiles(loadProfiles())
  }

  function addProfile() {
    if (!newName.trim()) return
    const now = new Date().toISOString()
    const profile: Profile = {
      id: uid(),
      name: newName.trim(),
      preferredName: newPreferred.trim() || newName.trim().split(' ')[0],
      family: [],
      favoriteMusic: [],
      favorites: emptyFavorites(),
      topicsToAvoid: [],
      factsToReinforce: [],
      createdAt: now,
      updatedAt: now,
    }
    saveProfile(profile)
    setActiveProfile(profile.id)
    navigate('../profile')
  }

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">Profiles</h1>
        {!adding && (
          <Button onClick={() => setAdding(true)}>+ Add a profile</Button>
        )}
      </div>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Each profile keeps its own life story, visits, and streak, nothing is
        shared between them.
      </p>

      {adding && (
        <div className="card mt-6 max-w-xl">
          <h2 className="text-2xl">New profile</h2>
          <div className="mt-4 space-y-4">
            <Field
              label="Their name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Eleanor Whitfield"
              autoFocus
            />
            <Field
              label="What they like to be called"
              optional
              value={newPreferred}
              onChange={(e) => setNewPreferred(e.target.value)}
              placeholder="Ellie"
            />
          </div>
          <div className="mt-5 flex gap-3">
            <Button onClick={addProfile} disabled={!newName.trim()}>
              Create & open profile
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {profiles.map((profile) => (
          <li key={profile.id} className="card flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl">
                {profile.preferredName}
                {profile.id === activeId && (
                  <span className="ml-3 rounded-full bg-moss-wash px-3 py-1 text-base font-semibold text-moss-deep">
                    Active
                  </span>
                )}
              </h2>
              <p className="mt-1 truncate text-base text-ink-faint">
                {profile.name}
                {profile.hometown ? ` · ${profile.hometown}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.id !== activeId && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActiveProfile(profile.id)
                    window.location.reload()
                  }}
                >
                  Make active
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setActiveProfile(profile.id)
                  navigate('../profile')
                }}
              >
                Edit
              </Button>
              {confirmingDelete === profile.id ? (
                <span className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    onClick={() => {
                      deleteProfile(profile.id)
                      setConfirmingDelete(null)
                      refresh()
                    }}
                  >
                    Delete forever
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmingDelete(null)}>
                    Keep
                  </Button>
                </span>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setConfirmingDelete(profile.id)}
                  aria-label={`Delete ${profile.preferredName}'s profile`}
                >
                  Delete
                </Button>
              )}
            </div>
            {confirmingDelete === profile.id && (
              <p className="w-full rounded-lg bg-rust-wash px-4 py-3 text-rust-deep">
                This permanently removes {profile.preferredName}&rsquo;s profile
                and every saved visit. Consider exporting a backup in Settings
                first.
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import ChipListEditor from '../../components/ChipListEditor'
import { Field, TextArea } from '../../components/Field'
import MusicEmbed from '../../components/MusicEmbed'
import { extractVideoId } from '../../lib/youtube'
import { backupToCloudQuietly } from '../../lib/cloud'
import { getActiveProfile, saveProfile, uid } from '../../lib/storage'
import type { Favorites, MusicLink, Person } from '../../types'

/**
 * The profile editor (FR-23): everything Lane knows about the person.
 * The guidance in each hint follows the conversation research, collect
 * warm early-life material, note what to avoid, keep it minimal.
 */

export default function ProfileEditor() {
  const original = getActiveProfile()

  // Local working copy; explicit Save writes it back.
  const [profile, setProfile] = useState(original)
  const [savedFlash, setSavedFlash] = useState(false)

  // Music entry form
  const [songTitle, setSongTitle] = useState('')
  const [songUrl, setSongUrl] = useState('')
  const [songError, setSongError] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)

  if (!profile) return null

  function update(changes: Partial<NonNullable<typeof profile>>) {
    setProfile((p) => (p ? { ...p, ...changes } : p))
    setSavedFlash(false)
  }

  function save() {
    if (!profile) return
    saveProfile(profile)
    setSavedFlash(true)
    backupToCloudQuietly()
  }

  function updateFavorites(changes: Partial<Favorites>) {
    update({ favorites: { ...profile!.favorites, ...changes } })
  }

  /* ------------------------------ people ------------------------------- */

  function updatePerson(id: string, changes: Partial<Person>) {
    update({
      family: profile!.family.map((person) =>
        person.id === id ? { ...person, ...changes } : person
      ),
    })
  }

  function addPerson() {
    update({
      family: [...profile!.family, { id: uid(), name: '', relationship: '' }],
    })
  }

  /* ------------------------------- music ------------------------------- */

  function addSong() {
    const videoId = extractVideoId(songUrl)
    if (!videoId) {
      setSongError(
        "That doesn't look like a YouTube link. Copy the address of the song's YouTube page and paste it here."
      )
      return
    }
    if (!songTitle.trim()) {
      setSongError('Give the song a name they would recognize, like "Moon River".')
      return
    }
    const link: MusicLink = {
      id: uid(),
      title: songTitle.trim(),
      youtubeUrl: songUrl.trim(),
      videoId,
    }
    update({ favoriteMusic: [...profile!.favoriteMusic, link] })
    setSongTitle('')
    setSongUrl('')
    setSongError('')
    setPreviewId(videoId) // instant confidence that it actually plays (§16.8)
  }

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl">{profile.preferredName}&rsquo;s profile</h1>
        <Link
          to="../profiles"
          className="font-semibold text-brand-deep underline underline-offset-4"
        >
          Switch or add profiles →
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Everything here helps Lane share warm, specific memories, and steer
        gently around hard ones. Add what feels right; more can come later.
      </p>

      <div className="mt-8 space-y-8">
        {/* ------------------------------ basics ---------------------------- */}
        <section className="card" aria-labelledby="basics-heading">
          <h2 id="basics-heading" className="text-2xl">
            The basics
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field
              label="Full name"
              value={profile.name}
              onChange={(e) => update({ name: e.target.value })}
            />
            <Field
              label="What they like to be called"
              value={profile.preferredName}
              onChange={(e) => update({ preferredName: e.target.value })}
            />
            <Field
              label="Year they were born"
              optional
              inputMode="numeric"
              value={profile.birthYear ? String(profile.birthYear) : ''}
              onChange={(e) =>
                update({
                  birthYear: e.target.value
                    ? Number(e.target.value.replace(/\D/g, '').slice(0, 4))
                    : undefined,
                })
              }
              hint="Helps Lane pick music and memories from the right era."
            />
            <Field
              label="Hometown"
              optional
              value={profile.hometown ?? ''}
              onChange={(e) => update({ hometown: e.target.value || undefined })}
            />
          </div>
          <div className="mt-5">
            <TextArea
              label="One happy memory"
              optional
              value={profile.happyMemory ?? ''}
              onChange={(e) => update({ happyMemory: e.target.value || undefined })}
              hint="Something that reliably makes them smile. Lane shares it, never asks them to produce it."
            />
          </div>
        </section>

        {/* ------------------------- family & people ------------------------ */}
        <section className="card" aria-labelledby="people-heading">
          <h2 id="people-heading" className="text-2xl">
            Family &amp; important people
          </h2>
          <p className="mt-2 text-base text-ink-faint">
            Lane mentions these people warmly by name, &ldquo;Your daughter
            Mary comes by every Sunday.&rdquo;
          </p>
          <div className="mt-5 space-y-4">
            {profile.family.map((person, index) => (
              <div
                key={person.id}
                className="grid gap-3 rounded-lg border border-cream-deep bg-cream-soft/50 p-4 md:grid-cols-[1fr_1fr_1.4fr_auto]"
              >
                <Field
                  label={index === 0 ? 'Name' : `Name (person ${index + 1})`}
                  value={person.name}
                  onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                  placeholder="Mary"
                />
                <Field
                  label="Relationship"
                  value={person.relationship}
                  onChange={(e) =>
                    updatePerson(person.id, { relationship: e.target.value })
                  }
                  placeholder="Daughter"
                />
                <Field
                  label="A warm note"
                  optional
                  value={person.notes ?? ''}
                  onChange={(e) =>
                    updatePerson(person.id, { notes: e.target.value || undefined })
                  }
                  placeholder="Visits every Sunday with the grandkids"
                />
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      update({
                        family: profile.family.filter((p) => p.id !== person.id),
                      })
                    }
                    aria-label={`Remove ${person.name || 'this person'}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={addPerson}>
              + Add a person
            </Button>
          </div>
        </section>

        {/* ------------------------------ music ------------------------------ */}
        <section className="card" aria-labelledby="music-heading">
          <h2 id="music-heading" className="text-2xl">
            Favorite music
          </h2>
          <p className="mt-2 text-base text-ink-faint">
            Songs from their teens and twenties reach the deepest. Paste
            YouTube links, each visit includes one music moment.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1.4fr_auto]">
            <Field
              label="Song name"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="Moon River, Andy Williams"
            />
            <Field
              label="YouTube link"
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
            <div className="flex items-end">
              <Button variant="secondary" onClick={addSong}>
                Add song
              </Button>
            </div>
          </div>
          {songError && (
            <p role="alert" className="mt-3 rounded-lg bg-rust-wash px-4 py-3 text-rust-deep">
              {songError}
            </p>
          )}

          {profile.favoriteMusic.length > 0 && (
            <ul className="mt-5 space-y-3">
              {profile.favoriteMusic.map((song) => (
                <li
                  key={song.id}
                  className="rounded-lg border border-cream-deep bg-cream-soft/50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="min-w-0 flex-1 font-semibold">♪ {song.title}</span>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setPreviewId(previewId === song.videoId ? null : song.videoId)
                      }
                    >
                      {previewId === song.videoId ? 'Hide preview' : 'Preview'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        update({
                          favoriteMusic: profile.favoriteMusic.filter(
                            (s) => s.id !== song.id
                          ),
                        })
                      }
                      aria-label={`Remove ${song.title}`}
                    >
                      Remove
                    </Button>
                  </div>
                  {previewId === song.videoId && (
                    <div className="mt-4 max-w-xl">
                      <MusicEmbed videoId={song.videoId} title={song.title} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --------------------------- favorite things ------------------------ */}
        <section className="card" aria-labelledby="favorites-heading">
          <h2 id="favorites-heading" className="text-2xl">
            Their favorite things
          </h2>
          <p className="mt-2 text-base text-ink-faint">
            Lane brings these up the way an old friend would. A team, a cold
            drink, a good western. Each one is a doorway to a warm chat, and
            they take turns as the special moment of a visit.
          </p>
          <div className="mt-5 space-y-7">
            <ChipListEditor
              label="Sports & teams"
              placeholder="The Braves"
              values={profile.favorites.sports}
              onChange={(sports) => updateFavorites({ sports })}
            />
            <ChipListEditor
              label="Drinks"
              placeholder="Sweet tea"
              values={profile.favorites.drinks}
              onChange={(drinks) => updateFavorites({ drinks })}
            />
            <ChipListEditor
              label="Foods"
              placeholder="Peach cobbler"
              values={profile.favorites.foods}
              onChange={(foods) => updateFavorites({ foods })}
            />
            <ChipListEditor
              label="Movies & shows"
              placeholder="The Andy Griffith Show"
              values={profile.favorites.shows}
              onChange={(shows) => updateFavorites({ shows })}
            />
            <ChipListEditor
              label="Hobbies & pastimes"
              placeholder="Fishing"
              values={profile.favorites.hobbies}
              onChange={(hobbies) => updateFavorites({ hobbies })}
            />
          </div>
        </section>

        {/* ---------------------------- life story --------------------------- */}
        <section className="card" aria-labelledby="story-heading">
          <h2 id="story-heading" className="text-2xl">
            Their life story
          </h2>
          <div className="mt-5">
            <TextArea
              label="Notes for Lane"
              optional
              rows={7}
              value={profile.lifeStory ?? ''}
              onChange={(e) => update({ lifeStory: e.target.value || undefined })}
              placeholder={
                'Grew up on a farm outside Mobile with three brothers. Met June at a church dance in 1961. Worked 30 proud years as a machinist at Brookley. Loved fishing on the causeway, Hank Williams, and his tomato garden…'
              }
              hint="Early life matters most, childhood, young adulthood, work they were proud of. Lane draws on these details to share, never to test."
            />
          </div>
        </section>

        {/* ------------------------- gentle guardrails ------------------------ */}
        <section className="card" aria-labelledby="guardrails-heading">
          <h2 id="guardrails-heading" className="text-2xl">
            Gentle guardrails
          </h2>
          <div className="mt-5 space-y-7">
            <ChipListEditor
              label="Topics to gently avoid"
              tone="rust"
              hint="Lane will warmly change the subject, a late spouse's passing, a painful loss, anything that brings distress."
              placeholder="The car accident"
              values={profile.topicsToAvoid}
              onChange={(topicsToAvoid) => update({ topicsToAvoid })}
            />
            <ChipListEditor
              label="Gentle facts to reinforce"
              tone="sage"
              hint="Reassuring facts Lane restates warmly, one per visit, never as a question. Example: 'Your daughter Mary visits every Sunday.'"
              placeholder="Mary visits every Sunday"
              values={profile.factsToReinforce}
              onChange={(factsToReinforce) => update({ factsToReinforce })}
            />
          </div>
        </section>
      </div>

      {/* ------------------------------ save bar ------------------------------ */}
      <div className="sticky bottom-4 mt-8 flex items-center justify-end gap-4">
        {savedFlash && (
          <span role="status" className="rounded-full bg-moss-wash px-4 py-2 font-semibold text-moss-deep shadow-card">
            Saved ✓
          </span>
        )}
        <Button size="lg" onClick={save}>
          Save profile
        </Button>
      </div>
    </div>
  )
}

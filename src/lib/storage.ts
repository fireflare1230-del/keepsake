/**
 * storage.ts, the ONLY module that touches localStorage.
 *
 * Everything Keepsake knows lives in this browser (PRD NFR-11):
 *
 *   keepsake:schemaVersion      number, for safe future migrations
 *   keepsake:profiles           Profile[]
 *   keepsake:visits:<profileId> Visit[]
 *   keepsake:progress:<profileId> ProfileProgress (streak + theme rotation)
 *   keepsake:draft:<profileId>  VisitDraft (interrupted-visit resume)
 *   keepsake:settings           Settings (API key lives here and only here)
 *   keepsake:app                AppState (active profile)
 *
 * Every read is defensive: corrupted JSON returns the fallback instead of
 * crashing a visit. Every write is wrapped so a full disk / quota error
 * degrades gracefully.
 */

import type {
  AppState,
  LearnedFact,
  Profile,
  ProfileProgress,
  Settings,
  Visit,
  VisitDraft,
} from '../types'
import { DEFAULT_MODEL, emptyFavorites } from '../types'
import { isoDay, isDayBefore } from './dates'
import { deleteProfilePhotos } from './photos'

export const SCHEMA_VERSION = 2

const K = {
  schema: 'keepsake:schemaVersion',
  profiles: 'keepsake:profiles',
  settings: 'keepsake:settings',
  app: 'keepsake:app',
  visits: (profileId: string) => `keepsake:visits:${profileId}`,
  progress: (profileId: string) => `keepsake:progress:${profileId}`,
  draft: (profileId: string) => `keepsake:draft:${profileId}`,
  learned: (profileId: string) => `keepsake:learned:${profileId}`,
}

/* ------------------------------- primitives ------------------------------ */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // Quota exceeded or storage disabled. The app keeps running on
    // in-memory state; the caretaker is nudged to export a backup.
    return false
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Simple unique id, good enough for a single-device, no-server app. */
export function uid(): string {
  return (
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
  )
}

/* ------------------------------ schema ---------------------------------- */

/** Run once at startup. Stamps the schema version for future migrations. */
export function ensureSchema(): void {
  const version = read<number>(K.schema, 0)
  if (version === 0) {
    write(K.schema, SCHEMA_VERSION)
    return
  }
  if (version < 2) {
    // v2 adds Profile.favorites; normalizeProfile() backfills it on read,
    // so the migration just persists the normalized shape once.
    write(K.profiles, read<Profile[]>(K.profiles, []).map(normalizeProfile))
    write(K.schema, 2)
  }
}

/* ------------------------------ profiles -------------------------------- */

/**
 * Fills in fields added after a profile was created (older schema
 * versions, restored backups from previous releases).
 */
function normalizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    favorites: { ...emptyFavorites(), ...(profile.favorites ?? {}) },
  }
}

export function loadProfiles(): Profile[] {
  return read<Profile[]>(K.profiles, []).map(normalizeProfile)
}

export function saveProfile(profile: Profile): void {
  const profiles = loadProfiles()
  const index = profiles.findIndex((p) => p.id === profile.id)
  const updated = { ...profile, updatedAt: new Date().toISOString() }
  if (index >= 0) profiles[index] = updated
  else profiles.push(updated)
  write(K.profiles, profiles)
}

/** Deletes the profile and everything that belongs to it. */
export function deleteProfile(profileId: string): void {
  write(
    K.profiles,
    loadProfiles().filter((p) => p.id !== profileId)
  )
  remove(K.visits(profileId))
  remove(K.progress(profileId))
  remove(K.draft(profileId))
  remove(K.learned(profileId))
  // Photos live in IndexedDB; best-effort async cleanup.
  void deleteProfilePhotos(profileId).catch(() => {})
  const app = loadAppState()
  if (app.activeProfileId === profileId) {
    const remaining = loadProfiles()
    saveAppState({ activeProfileId: remaining[0]?.id })
  }
}

export function getProfile(profileId: string): Profile | undefined {
  return loadProfiles().find((p) => p.id === profileId)
}

/* ------------------------------ app state ------------------------------- */

export function loadAppState(): AppState {
  return read<AppState>(K.app, {})
}

export function saveAppState(state: AppState): void {
  write(K.app, state)
}

export function getActiveProfile(): Profile | undefined {
  const { activeProfileId } = loadAppState()
  const profiles = loadProfiles()
  if (!profiles.length) return undefined
  return profiles.find((p) => p.id === activeProfileId) ?? profiles[0]
}

export function setActiveProfile(profileId: string): void {
  saveAppState({ ...loadAppState(), activeProfileId: profileId })
}

/* ------------------------------ settings -------------------------------- */

export function loadSettings(): Settings {
  return read<Settings>(K.settings, {
    model: DEFAULT_MODEL,
    readAloudEnabled: true,
  })
}

export function saveSettings(settings: Settings): void {
  write(K.settings, settings)
}

/** The "forget key" button (NFR-14), removes the key immediately. */
export function forgetApiKey(): void {
  const settings = loadSettings()
  delete settings.apiKey
  saveSettings(settings)
}

/* ------------------------------- visits --------------------------------- */

export function loadVisits(profileId: string): Visit[] {
  return read<Visit[]>(K.visits(profileId), [])
}

/** Insert or update a visit (newest first). */
export function saveVisit(visit: Visit): void {
  const visits = loadVisits(visit.profileId)
  const index = visits.findIndex((v) => v.id === visit.id)
  if (index >= 0) visits[index] = visit
  else visits.unshift(visit)
  write(K.visits(visit.profileId), visits)
}

/* ------------------------- Lane noticed (learned) ------------------------- */

/** Newest first, capped so localStorage never bloats (PDR v1.2 §2.4). */
const LEARNED_CAP = 200

export function loadLearnedFacts(profileId: string): LearnedFact[] {
  return read<LearnedFact[]>(K.learned(profileId), [])
}

function saveLearnedFacts(profileId: string, facts: LearnedFact[]): void {
  write(K.learned(profileId), facts.slice(0, LEARNED_CAP))
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** Everything the profile already knows, for "is this actually new?". */
function knownValues(profile: Profile): Set<string> {
  const known = new Set<string>()
  const add = (s?: string) => s && known.add(norm(s))
  add(profile.hometown)
  add(profile.happyMemory)
  Object.values(profile.favorites).forEach((list) => list.forEach(add))
  profile.topicsToAvoid.forEach(add)
  return known
}

/**
 * Queue fresh candidates from a visit. Anything the profile already has,
 * or that was already suggested (pending, approved, OR dismissed, a
 * dismissal must stick, PDR §2.1), is silently dropped.
 */
export function addLearnedFacts(
  profileId: string,
  candidates: Array<Pick<LearnedFact, 'category' | 'value' | 'quote'>>,
  sourceVisitId: string,
  visitDate: string
): LearnedFact[] {
  const profile = getProfile(profileId)
  if (!profile) return []
  const existing = loadLearnedFacts(profileId)
  const seen = new Set(existing.map((f) => norm(f.value)))
  const known = knownValues(profile)

  const fresh: LearnedFact[] = []
  for (const c of candidates) {
    const value = c.value.trim()
    if (!value || seen.has(norm(value)) || known.has(norm(value))) continue
    seen.add(norm(value))
    fresh.push({
      id: uid(),
      profileId,
      category: c.category,
      value,
      quote: c.quote?.trim() || undefined,
      sourceVisitId,
      visitDate,
      status: 'pending',
    })
  }
  if (fresh.length) saveLearnedFacts(profileId, [...fresh, ...existing])
  return fresh
}

/**
 * Approve or dismiss one pending item. Approval merges the fact into the
 * profile per the PDR §2.3 merge table, so it reaches Lane's prompt on
 * the very next visit like any caretaker-entered data.
 */
export function decideLearnedFact(
  profileId: string,
  factId: string,
  decision: 'approved' | 'dismissed'
): void {
  const facts = loadLearnedFacts(profileId)
  const fact = facts.find((f) => f.id === factId)
  if (!fact || fact.status !== 'pending') return
  fact.status = decision
  fact.decidedAt = new Date().toISOString()
  saveLearnedFacts(profileId, facts)
  if (decision === 'approved') applyLearnedFact(profileId, fact)
}

const FAVORITE_TARGET: Partial<Record<LearnedFact['category'], keyof Profile['favorites']>> = {
  food: 'foods',
  drink: 'drinks',
  sport: 'sports',
  show: 'shows',
  hobby: 'hobbies',
}

function applyLearnedFact(profileId: string, fact: LearnedFact): void {
  const profile = getProfile(profileId)
  if (!profile) return
  const appendToStory = () => {
    const line = `${fact.value} (Lane noticed this on ${fact.visitDate.slice(0, 10)})`
    profile.lifeStory = profile.lifeStory ? `${profile.lifeStory}\n${line}` : line
  }

  const favoriteKey = FAVORITE_TARGET[fact.category]
  if (favoriteKey) {
    const list = profile.favorites[favoriteKey]
    if (!list.some((item) => norm(item) === norm(fact.value))) list.push(fact.value)
  } else if (fact.category === 'hometown') {
    if (profile.hometown?.trim()) appendToStory()
    else profile.hometown = fact.value
  } else if (fact.category === 'happyMemory') {
    if (profile.happyMemory?.trim()) appendToStory()
    else profile.happyMemory = fact.value
  } else if (fact.category === 'avoid') {
    if (!profile.topicsToAvoid.some((t) => norm(t) === norm(fact.value))) {
      profile.topicsToAvoid.push(fact.value)
    }
  } else {
    // lifeStory and delight both land as life-story lines.
    appendToStory()
  }
  saveProfile(profile)
}

/* ----------------------- streaks & theme rotation ------------------------ */

export function loadProgress(profileId: string): ProfileProgress {
  return read<ProfileProgress>(K.progress(profileId), {
    currentStreak: 0,
    longestStreak: 0,
    lastThemeIndex: -1,
  })
}

export function saveProgress(profileId: string, progress: ProfileProgress): void {
  write(K.progress(profileId), progress)
}

/**
 * Called once when a visit completes. The streak rewards SHOWING UP,
 * once per calendar day, never memory performance (FR-28/29).
 * Returns the updated progress so the celebration screen can show it.
 */
export function recordCompletedVisit(profileId: string): ProfileProgress {
  const progress = loadProgress(profileId)
  const today = isoDay()

  if (progress.lastVisitDate === today) {
    // Second visit today, lovely, but the streak already counted.
    return progress
  }

  const next: ProfileProgress = {
    ...progress,
    currentStreak:
      progress.lastVisitDate && isDayBefore(progress.lastVisitDate, today)
        ? progress.currentStreak + 1
        : 1,
    lastVisitDate: today,
  }
  next.longestStreak = Math.max(next.longestStreak, next.currentStreak)
  saveProgress(profileId, next)
  return next
}

/**
 * Theme rotation (§8.5): peek the next theme when a visit starts, and
 * persist the pointer only when a visit actually completes, so an
 * abandoned hello screen never burns a theme.
 */
export function peekNextThemeIndex(profileId: string, themeCount: number): number {
  return (loadProgress(profileId).lastThemeIndex + 1) % themeCount
}

export function saveLastThemeIndex(profileId: string, index: number): void {
  const progress = loadProgress(profileId)
  saveProgress(profileId, { ...progress, lastThemeIndex: index })
}

/* --------------------------- interrupted visits -------------------------- */

export function saveDraft(draft: VisitDraft): void {
  write(K.draft(draft.visit.profileId), draft)
}

export function loadDraft(profileId: string): VisitDraft | undefined {
  return read<VisitDraft | undefined>(K.draft(profileId), undefined)
}

export function clearDraft(profileId: string): void {
  remove(K.draft(profileId))
}

/* ------------------------- backup export / import ------------------------ */

export interface BackupFile {
  app: 'keepsake'
  schemaVersion: number
  exportedAt: string
  profiles: Profile[]
  visits: Record<string, Visit[]>
  progress: Record<string, ProfileProgress>
  /** "Lane noticed" queue per profile (added v1.2; absent in old backups). */
  learned?: Record<string, LearnedFact[]>
  /** Settings minus the API key and PIN, a backup never carries either. */
  settings: Omit<Settings, 'apiKey' | 'pinHash'>
}

export function buildBackup(): BackupFile {
  const profiles = loadProfiles()
  const visits: Record<string, Visit[]> = {}
  const progress: Record<string, ProfileProgress> = {}
  const learned: Record<string, LearnedFact[]> = {}
  for (const p of profiles) {
    visits[p.id] = loadVisits(p.id)
    progress[p.id] = loadProgress(p.id)
    learned[p.id] = loadLearnedFacts(p.id)
  }
  const { apiKey: _omitted, pinHash: _omitted2, ...settings } = loadSettings()
  return {
    app: 'keepsake',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profiles,
    visits,
    progress,
    learned,
    settings,
  }
}

/**
 * Restores a backup produced by buildBackup(). Merges by id: existing
 * profiles/visits with the same id are replaced, everything else is kept.
 * Returns a human-readable result for the settings screen.
 */
export function restoreBackup(raw: string): { ok: boolean; message: string } {
  let data: BackupFile
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, message: "That file doesn't look like a Keepsake backup (couldn't read it)." }
  }
  if (data?.app !== 'keepsake' || !Array.isArray(data.profiles)) {
    return { ok: false, message: "That file doesn't look like a Keepsake backup." }
  }

  const existing = loadProfiles()
  const byId = new Map(existing.map((p) => [p.id, p]))
  for (const profile of data.profiles) byId.set(profile.id, profile)
  write(K.profiles, Array.from(byId.values()))

  for (const profile of data.profiles) {
    const incoming = data.visits?.[profile.id] ?? []
    const current = loadVisits(profile.id)
    const visitById = new Map(current.map((v) => [v.id, v]))
    for (const v of incoming) visitById.set(v.id, v)
    const merged = Array.from(visitById.values()).sort(
      (a, b) => (a.date < b.date ? 1 : -1)
    )
    write(K.visits(profile.id), merged)
    if (data.progress?.[profile.id]) {
      write(K.progress(profile.id), data.progress[profile.id])
    }
    if (data.learned?.[profile.id]) {
      const current = loadLearnedFacts(profile.id)
      const learnedById = new Map(current.map((f) => [f.id, f]))
      for (const f of data.learned[profile.id]) learnedById.set(f.id, f)
      write(K.learned(profile.id), Array.from(learnedById.values()))
    }
  }

  if (!loadAppState().activeProfileId && data.profiles[0]) {
    setActiveProfile(data.profiles[0].id)
  }

  const profileCount = data.profiles.length
  const visitCount = Object.values(data.visits ?? {}).reduce(
    (n, list) => n + list.length,
    0
  )
  return {
    ok: true,
    message: `Restored ${profileCount} profile${profileCount === 1 ? '' : 's'} and ${visitCount} visit${visitCount === 1 ? '' : 's'}.`,
  }
}

/**
 * storage.ts — the ONLY module that touches localStorage.
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
  Profile,
  ProfileProgress,
  Settings,
  Visit,
  VisitDraft,
} from '../types'
import { DEFAULT_MODEL } from '../types'
import { isoDay, isDayBefore } from './dates'

export const SCHEMA_VERSION = 1

const K = {
  schema: 'keepsake:schemaVersion',
  profiles: 'keepsake:profiles',
  settings: 'keepsake:settings',
  app: 'keepsake:app',
  visits: (profileId: string) => `keepsake:visits:${profileId}`,
  progress: (profileId: string) => `keepsake:progress:${profileId}`,
  draft: (profileId: string) => `keepsake:draft:${profileId}`,
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

/** Simple unique id — good enough for a single-device, no-server app. */
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
  // Future migrations go here:
  // if (version < 2) { ...migrate...; write(K.schema, 2) }
}

/* ------------------------------ profiles -------------------------------- */

export function loadProfiles(): Profile[] {
  return read<Profile[]>(K.profiles, [])
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

/** The "forget key" button (NFR-14) — removes the key immediately. */
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
 * Called once when a visit completes. The streak rewards SHOWING UP —
 * once per calendar day, never memory performance (FR-28/29).
 * Returns the updated progress so the celebration screen can show it.
 */
export function recordCompletedVisit(profileId: string): ProfileProgress {
  const progress = loadProgress(profileId)
  const today = isoDay()

  if (progress.lastVisitDate === today) {
    // Second visit today — lovely, but the streak already counted.
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

/** Advance to the next theme in rotation and persist the pointer (§8.5). */
export function advanceTheme(profileId: string, themeCount: number): number {
  const progress = loadProgress(profileId)
  const nextIndex = (progress.lastThemeIndex + 1) % themeCount
  saveProgress(profileId, { ...progress, lastThemeIndex: nextIndex })
  return nextIndex
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
  /** Settings minus the API key — a backup never carries the key. */
  settings: Omit<Settings, 'apiKey'>
}

export function buildBackup(): BackupFile {
  const profiles = loadProfiles()
  const visits: Record<string, Visit[]> = {}
  const progress: Record<string, ProfileProgress> = {}
  for (const p of profiles) {
    visits[p.id] = loadVisits(p.id)
    progress[p.id] = loadProgress(p.id)
  }
  const { apiKey: _omitted, ...settings } = loadSettings()
  return {
    app: 'keepsake',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profiles,
    visits,
    progress,
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

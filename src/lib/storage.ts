// ─── localStorage helpers ─────────────────────────────────────────────────────
// Everything persists in the browser. No server, no accounts.

import type { PatientProfile, Visit, AppSettings, SRTTarget } from '../types';

const PROFILES_KEY = 'ks_profiles';
const VISITS_KEY   = 'ks_visits';
const SETTINGS_KEY = 'ks_settings';
const PIN_SESSION  = 'ks_pin_auth';   // sessionStorage — clears on tab close

// ─── ID generation ───────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export function getProfiles(): PatientProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    const profiles = raw ? (JSON.parse(raw) as PatientProfile[]) : [];
    // Backfill srtTargets for profiles created before v2
    return profiles.map(p => (p.srtTargets ? p : { ...p, srtTargets: [] }));
  } catch {
    return [];
  }
}

export function getProfile(id: string): PatientProfile | undefined {
  return getProfiles().find(p => p.id === id);
}

export function saveProfile(profile: PatientProfile): void {
  const profiles = getProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function deleteProfile(id: string): void {
  localStorage.setItem(
    PROFILES_KEY,
    JSON.stringify(getProfiles().filter(p => p.id !== id)),
  );
  localStorage.setItem(
    VISITS_KEY,
    JSON.stringify(getVisits().filter(v => v.patientId !== id)),
  );
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export function updateStreak(profile: PatientProfile): PatientProfile {
  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

  let streak = profile.streak;
  if (profile.lastStreakDate === today) {
    // Already visited today — no change
  } else if (profile.lastStreakDate === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  return { ...profile, streak, lastStreakDate: today, lastVisitAt: new Date().toISOString() };
}

// ─── Visits ───────────────────────────────────────────────────────────────────

export function getVisits(): Visit[] {
  try {
    const raw = localStorage.getItem(VISITS_KEY);
    return raw ? (JSON.parse(raw) as Visit[]) : [];
  } catch {
    return [];
  }
}

export function getVisitsForPatient(patientId: string): Visit[] {
  return getVisits()
    .filter(v => v.patientId === patientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function saveVisit(visit: Visit): void {
  const visits = getVisits();
  const idx = visits.findIndex(v => v.id === visit.id);
  if (idx >= 0) visits[idx] = visit;
  else visits.push(visit);
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const defaults: AppSettings = { model: 'claude-haiku-4-5-20251001', readAloud: true, voicePreferMale: false, voiceRate: 0.85 };
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<AppSettings>) } : defaults;
  } catch {
    return { model: 'claude-haiku-4-5-20251001', readAloud: true, voicePreferMale: false, voiceRate: 0.85 };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── PIN (session-scoped) ─────────────────────────────────────────────────────

export function isPinAuthenticated(): boolean {
  return sessionStorage.getItem(PIN_SESSION) === 'true';
}

export function setPinAuthenticated(): void {
  sessionStorage.setItem(PIN_SESSION, 'true');
}

export function clearPinSession(): void {
  sessionStorage.removeItem(PIN_SESSION);
}

export function checkPin(attempt: string): boolean {
  const { caretakerPin } = getSettings();
  if (!caretakerPin) return true;       // no PIN set → always pass
  return caretakerPin === attempt;
}

// ─── SRT (Spaced Retrieval Training) ─────────────────────────────────────────
// Expanding interval scale in minutes — mirrors clinical SRT literature.
// idx: 0=1min  1=2min  2=4min  3=8min  4=1day  5=2days  6=1week
export const SRT_INTERVALS_MIN = [1, 2, 4, 8, 1440, 2880, 10080] as const;

export function getDueSRTTarget(profile: PatientProfile): SRTTarget | null {
  const active = (profile.srtTargets ?? []).filter(t => !t.learnedAt);
  if (active.length === 0) return null;

  const now = Date.now();
  const due = active.filter(t => {
    if (!t.lastTestedAt) return true;  // never tested → always due
    const elapsedMin = (now - new Date(t.lastTestedAt).getTime()) / 60_000;
    const threshold  = SRT_INTERVALS_MIN[Math.min(t.currentIntervalIdx, SRT_INTERVALS_MIN.length - 1)];
    return elapsedMin >= threshold;
  });

  if (due.length === 0) return null;
  // Pick the one lowest on the interval scale (needs the most practice)
  return due.sort((a, b) => a.currentIntervalIdx - b.currentIntervalIdx)[0];
}

export function updateSRTTarget(
  profile: PatientProfile,
  targetId: string,
  result: 'correct' | 'prompted',
): PatientProfile {
  const now = new Date().toISOString();
  const srtTargets = (profile.srtTargets ?? []).map((t): SRTTarget => {
    if (t.id !== targetId) return t;
    if (result === 'correct') {
      const consecutive = t.consecutiveCorrect + 1;
      const learned     = consecutive >= 3;
      return {
        ...t,
        lastTestedAt: now,
        lastResult: 'correct',
        consecutiveCorrect: consecutive,
        currentIntervalIdx: Math.min(t.currentIntervalIdx + 1, SRT_INTERVALS_MIN.length - 1),
        ...(learned ? { learnedAt: now } : {}),
      };
    }
    return {
      ...t,
      lastTestedAt: now,
      lastResult: 'prompted',
      consecutiveCorrect: 0,
      currentIntervalIdx: Math.max(t.currentIntervalIdx - 1, 0),
    };
  });
  const updated = { ...profile, srtTargets };
  saveProfile(updated);
  return updated;
}

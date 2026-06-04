// ─── localStorage helpers ─────────────────────────────────────────────────────
// Everything persists in the browser. No server, no accounts.

import type { PatientProfile, Visit, AppSettings } from '../types';

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
    return raw ? (JSON.parse(raw) as PatientProfile[]) : [];
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
    const defaults: AppSettings = { model: 'claude-haiku-4-5-20251001', readAloud: true };
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<AppSettings>) } : defaults;
  } catch {
    return { model: 'claude-haiku-4-5-20251001', readAloud: true };
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

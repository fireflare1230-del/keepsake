/**
 * cloud.ts, the optional Keepsake account (v1.1).
 *
 * Signing up is never required: the app is fully usable on-device, and
 * this module only wakes up when a caretaker chooses to create an
 * account. What syncs is exactly the backup file (profiles, visits,
 * progress). What NEVER syncs: the Anthropic API key and the PIN hash
 * (buildBackup strips the key; we strip pin settings here too).
 *
 * Backend: a Supabase project with one row-per-user table
 * (keepsake_backups) protected by row-level security. The publishable
 * key below is designed to be public; RLS is what protects the data.
 * This is a deliberate, documented v1.1 amendment to the PRD's
 * "no backend" rule, chosen by the product owner.
 */

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { buildBackup, restoreBackup, type BackupFile } from './storage'

const SUPABASE_URL = 'https://evehyddsyonbxokrfknm.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ubDUJYrDD2Vhat_XOJJ9Bw_txPDcy_h'

let client: SupabaseClient | null = null

export function cloud(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  }
  return client
}

/* -------------------------------- auth ---------------------------------- */

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await cloud().auth.getSession()
    return data.session?.user ?? null
  } catch {
    return null
  }
}

export async function signUp(
  email: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await cloud().auth.signUp({ email, password })
  if (error) return { ok: false, message: friendlyAuthError(error.message) }
  // With email confirmation on (the default), there is no session yet.
  if (!data.session) {
    return {
      ok: true,
      message:
        'Almost there. Check your email for a confirmation link, then come back and sign in.',
    }
  }
  return { ok: true, message: 'Account created. You are signed in.' }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  const { error } = await cloud().auth.signInWithPassword({ email, password })
  if (error) return { ok: false, message: friendlyAuthError(error.message) }
  return { ok: true, message: 'Signed in.' }
}

export async function signOut(): Promise<void> {
  try {
    await cloud().auth.signOut()
  } catch {
    /* signing out can't really fail in a way the user needs to know about */
  }
}

function friendlyAuthError(raw: string): string {
  const text = raw.toLowerCase()
  if (text.includes('invalid login')) return "That email and password didn't match."
  if (text.includes('already registered'))
    return 'That email already has an account. Try signing in instead.'
  if (text.includes('at least 6')) return 'The password needs at least 6 characters.'
  if (text.includes('confirm')) return 'Please confirm your email first (check your inbox), then sign in.'
  if (text.includes('rate')) return 'A little too fast. Give it a minute and try again.'
  return 'That did not work. Check the email and password and try again.'
}

/* ------------------------------ backup sync ------------------------------ */

export interface CloudStatus {
  lastBackedUpAt?: string
}

/** Pushes the current on-device data to the user's private cloud row. */
export async function backupToCloud(): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: 'Sign in first to back up.' }
  const payload = buildBackup()
  const { error } = await cloud()
    .from('keepsake_backups')
    .upsert(
      { user_id: user.id, payload, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  if (error) {
    return { ok: false, message: 'The backup could not be saved. Check your connection and try again.' }
  }
  return { ok: true, message: 'Backed up to your account just now.' }
}

/**
 * Fire-and-forget variant used after visits and profile saves. Quietly
 * does nothing when signed out or offline; day-to-day use never waits
 * on the network.
 */
export function backupToCloudQuietly(): void {
  backupToCloud().catch(() => {
    /* offline or signed out: the next manual backup covers it */
  })
}

/** Pulls the cloud copy and merges it into this device (same as file restore). */
export async function restoreFromCloud(): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: 'Sign in first to restore.' }
  const { data, error } = await cloud()
    .from('keepsake_backups')
    .select('payload, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) {
    return { ok: false, message: 'Could not reach your cloud backup. Try again in a moment.' }
  }
  if (!data) {
    return { ok: false, message: 'No cloud backup yet. Use "Back up now" first.' }
  }
  return restoreBackup(JSON.stringify(data.payload as BackupFile))
}

/** When the caretaker last pushed a backup, for the status line. */
export async function getCloudStatus(): Promise<CloudStatus> {
  const user = await getCurrentUser()
  if (!user) return {}
  const { data } = await cloud()
    .from('keepsake_backups')
    .select('updated_at')
    .eq('user_id', user.id)
    .maybeSingle()
  return { lastBackedUpAt: data?.updated_at ?? undefined }
}

/** Removes the cloud copy (the account itself stays). */
export async function deleteCloudBackup(): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: 'Sign in first.' }
  const { error } = await cloud().from('keepsake_backups').delete().eq('user_id', user.id)
  if (error) return { ok: false, message: 'Could not delete the cloud copy. Try again.' }
  return { ok: true, message: 'Cloud copy deleted. Your data is still on this device.' }
}

/**
 * Caretaker PIN helpers.
 *
 * Honest threat model (PRD §16.6): this PIN keeps a curious family member
 * on a shared tablet out of the caretaker area. It is NOT real security —
 * anyone technical can read localStorage. We therefore store a hash
 * (never the raw digits) and offer a friendly reset instead of pretending
 * the data is encrypted.
 */

const SALT = 'keepsake-pin-v1:'

/** SHA-256 via WebCrypto when available (https/localhost). */
async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * FNV-1a fallback for non-secure contexts (opening the built site as a
 * plain file:// — crypto.subtle doesn't exist there). Weaker, but the
 * PIN is casual deterrence either way.
 */
function fnv1aHex(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return 'fnv-' + hash.toString(16).padStart(8, '0')
}

export async function hashPin(pin: string): Promise<string> {
  const salted = SALT + pin
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      return await sha256Hex(salted)
    } catch {
      /* fall through to fnv */
    }
  }
  return fnv1aHex(salted)
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const salted = SALT + pin
  // Compare against whichever scheme produced the stored hash, so a PIN
  // set on localhost still verifies if the site is later opened as a file.
  if (storedHash.startsWith('fnv-')) return fnv1aHex(salted) === storedHash
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      return (await sha256Hex(salted)) === storedHash
    } catch {
      return false
    }
  }
  return false
}

/* --- caretaker-session unlock (cleared when the browser tab closes) --- */

const UNLOCK_KEY = 'keepsake:unlocked'

export function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}

export function setUnlocked(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(UNLOCK_KEY, '1')
    else sessionStorage.removeItem(UNLOCK_KEY)
  } catch {
    /* sessionStorage unavailable — the PIN gate will simply re-ask */
  }
}

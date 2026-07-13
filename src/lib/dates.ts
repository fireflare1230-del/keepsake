/** Small date helpers used by streaks, visit logs, and charts. */

/** yyyy-mm-dd for a Date (local time, streaks follow the user's clock). */
export function isoDay(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Was `dayA` (yyyy-mm-dd) exactly the day before `dayB`? */
export function isDayBefore(dayA: string, dayB: string): boolean {
  const a = new Date(dayA + 'T12:00:00')
  const b = new Date(dayB + 'T12:00:00')
  return b.getTime() - a.getTime() === 24 * 60 * 60 * 1000
}

/** "Tuesday, July 11" style, friendly for elderly users and caretakers. */
export function friendlyDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/** "July 11, 3:20 PM" for visit-log rows. */
export function friendlyDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** "Jul 4" ultra-short label for chart axes. */
export function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Time-of-day greeting: "Good morning" / "Good afternoon" / "Good evening". */
export function timeGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

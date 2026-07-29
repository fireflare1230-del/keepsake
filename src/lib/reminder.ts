/**
 * The daily visit reminder (PDR v1.3 §2).
 *
 * The honest truth about the web platform: a page cannot schedule a
 * future notification by itself, and Web Push needs a server to send
 * every push. Keepsake has no server on purpose. So the reminder is a
 * calendar event instead: a standards-compliant .ics with a daily RRULE
 * and an alarm, delivered by the phone's own calendar, which is more
 * reliable than any web notification could be.
 */

/** Escape text per RFC 5545. */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Builds a daily-repeating reminder at the given local time ("HH:MM").
 * Floating local time (no TZID) so it stays put if they travel.
 */
export function buildReminderIcs(time: string, personName: string): string {
  const [hh = '10', mm = '00'] = time.split(':')
  const now = new Date()
  const stamp =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0') +
    'T' +
    String(now.getUTCHours()).padStart(2, '0') +
    String(now.getUTCMinutes()).padStart(2, '0') +
    String(now.getUTCSeconds()).padStart(2, '0') +
    'Z'
  // First occurrence: today at the chosen local time.
  const start =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    'T' +
    hh.padStart(2, '0') +
    mm.padStart(2, '0') +
    '00'

  const title = icsEscape(`💛 Visit with Lane`)
  const description = icsEscape(
    `A few gentle minutes with ${personName}. Open Keepsake and start today's visit.`
  )

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Keepsake//Daily Visit Reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:keepsake-daily-visit-${stamp}@keepsake.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    'DURATION:PT15M',
    'RRULE:FREQ=DAILY',
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${title}`,
    'TRIGGER:PT0S',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Trigger a download of the reminder file. */
export function downloadReminderIcs(time: string, personName: string): void {
  const blob = new Blob([buildReminderIcs(time, personName)], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'keepsake-daily-visit.ics'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

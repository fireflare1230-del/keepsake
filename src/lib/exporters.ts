/**
 * Visit-data export (FR-26): JSON for machines, CSV for spreadsheets.
 * The caretaker owns their data (NFR-13).
 */

import type { Profile, Visit } from '../types'

export function downloadFile(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return '"' + value.replace(/"/g, '""') + '"'
  return value
}

export function visitsToCsv(visits: Visit[]): string {
  const header = [
    'date',
    'theme',
    'mood_1to5',
    'engagement_1to5',
    'completed',
    'duration_seconds',
    'mode',
    'preview',
    'fact_reinforced',
    'flags',
    'summary',
  ]
  const rows = visits.map((v) =>
    [
      v.date,
      v.theme,
      v.mood !== undefined ? String(v.mood) : '',
      v.summary ? String(v.summary.engagement) : '',
      String(v.completed),
      v.durationSec !== undefined ? String(v.durationSec) : '',
      v.mode ?? '',
      v.preview ? 'true' : '',
      v.factReinforced ?? '',
      v.summary ? v.summary.flags.join('; ') : '',
      v.summary ? v.summary.summary : '',
    ]
      .map(csvEscape)
      .join(',')
  )
  return [header.join(','), ...rows].join('\n')
}

export function exportVisitsJson(profile: Profile, visits: Visit[]): void {
  downloadFile(
    `keepsake-visits-${profile.preferredName.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify({ profile: profile.name, exportedAt: new Date().toISOString(), visits }, null, 2),
    'application/json'
  )
}

export function exportVisitsCsv(profile: Profile, visits: Visit[]): void {
  downloadFile(
    `keepsake-visits-${profile.preferredName.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`,
    visitsToCsv(visits),
    'text/csv'
  )
}

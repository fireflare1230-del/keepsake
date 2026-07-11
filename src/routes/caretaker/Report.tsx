import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import { friendlyDate } from '../../lib/dates'
import { getActiveProfile, loadProgress, loadVisits } from '../../lib/storage'

/**
 * The one-tap printable caretaker report (§16.11) — recent visits, mood
 * and engagement at a glance, and any gentle flags. Handy for sharing
 * with family or bringing to a doctor's visit. Print styles hide the
 * app chrome; this page is the .print-block.
 */

const MOOD_WORD = ['Not so good', 'A little low', 'Okay', 'Good', 'Wonderful']

export default function Report() {
  const profile = getActiveProfile()
  const data = useMemo(() => {
    if (!profile) return undefined
    const visits = loadVisits(profile.id)
      .filter((v) => v.completed && !v.preview)
      .slice(0, 14)
    const moods = visits.filter((v) => v.mood !== undefined).map((v) => v.mood as number)
    const engagements = visits
      .filter((v) => v.summary)
      .map((v) => v.summary!.engagement)
    const average = (nums: number[]) =>
      nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : undefined
    return {
      visits,
      progress: loadProgress(profile.id),
      avgMood: average(moods),
      avgEngagement: average(engagements),
    }
  }, [profile])

  if (!profile || !data) return null
  const { visits } = data

  return (
    <div className="py-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to=".."
          className="font-semibold text-brand-deep underline underline-offset-4"
        >
          ← Back to the dashboard
        </Link>
        <Button onClick={() => window.print()} disabled={visits.length === 0}>
          🖨️ Print this report
        </Button>
      </div>

      {visits.length === 0 ? (
        <div className="card text-center">
          <p className="text-xl">Nothing to report yet.</p>
          <p className="mt-2 text-ink-muted">
            Once {profile.preferredName} has completed a visit or two, this
            page becomes a tidy report you can print or share.
          </p>
        </div>
      ) : (
        <article className="card print-block">
          <header className="border-b border-cream-deep pb-5">
            <h1 className="text-3xl">Keepsake visit report</h1>
            <p className="mt-2 text-lg text-ink-muted">
              {profile.name} ({profile.preferredName}) · prepared{' '}
              {friendlyDate(new Date().toISOString())}
            </p>
            <p className="mt-1 text-base text-ink-faint">
              Covering the last {visits.length} visit
              {visits.length === 1 ? '' : 's'} — Keepsake is a wellness
              companion, not a medical device; this report reflects mood and
              engagement only.
            </p>
          </header>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Visits" value={String(visits.length)} />
            <Stat
              label="Current streak"
              value={`${data.progress.currentStreak} day${data.progress.currentStreak === 1 ? '' : 's'}`}
            />
            <Stat
              label="Typical mood"
              value={
                data.avgMood !== undefined
                  ? `${MOOD_WORD[Math.round(data.avgMood) - 1]} (${data.avgMood}/5)`
                  : '—'
              }
            />
            <Stat
              label="Typical engagement"
              value={data.avgEngagement !== undefined ? `${data.avgEngagement}/5` : '—'}
            />
          </div>

          <div className="mt-8 space-y-6">
            {visits.map((visit) => (
              <section key={visit.id} className="border-t border-cream-deep pt-5">
                <h2 className="text-xl">
                  {friendlyDate(visit.date)}{' '}
                  <span className="font-normal text-ink-muted">
                    · {visit.theme}
                    {visit.mood !== undefined && <> · mood: {MOOD_WORD[visit.mood - 1]}</>}
                    {visit.summary && <> · engagement {visit.summary.engagement}/5</>}
                  </span>
                </h2>
                {visit.summary ? (
                  <>
                    <p className="mt-2 text-base">{visit.summary.summary}</p>
                    {visit.summary.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {visit.summary.highlights.map((highlight) => (
                          <li key={highlight} className="text-base text-ink-muted">
                            ✨ {highlight}
                          </li>
                        ))}
                      </ul>
                    )}
                    {visit.summary.flags.map((flag) => (
                      <p key={flag} className="mt-2 text-base text-rust-deep">
                        ⚑ {flag}
                      </p>
                    ))}
                  </>
                ) : (
                  <p className="mt-2 text-base text-ink-faint">
                    No summary was recorded for this visit.
                  </p>
                )}
              </section>
            ))}
          </div>

          <footer className="mt-8 border-t border-cream-deep pt-4 text-base text-ink-faint">
            Generated by Keepsake — Reconnect. Remember. All data lives on the
            family&rsquo;s own device.
          </footer>
        </article>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-cream-soft px-4 py-3">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}

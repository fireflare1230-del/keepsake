import { Link } from 'react-router-dom'
import TrendChart from '../../components/TrendChart'
import { shortDate } from '../../lib/dates'
import type { Profile, ProfileProgress, Visit } from '../../types'

/**
 * The at-a-glance dashboard (FR-24): streak, mood & engagement trends,
 * gentle flags, and the latest visit summary. Preview visits never appear
 * here, and nothing on this screen ever grades memory (FR-29).
 */

const MOOD_LABEL = ['😞 Not so good', '😕 A little low', '😐 Okay', '🙂 Good', '😄 Wonderful']
const ENGAGEMENT_LABEL = ['Very quiet', 'Quiet', 'Present', 'Engaged', 'Lit up']

// Trend-line colors validated (contrast, chroma, CVD) on the card surface.
const MOOD_COLOR = '#0E7FB0'
const ENGAGEMENT_COLOR = '#2E8B4E'

export default function DashboardInsights({
  profile,
  visits,
  progress,
}: {
  profile: Profile
  visits: Visit[] // completed, non-preview, newest first
  progress: ProfileProgress
}) {
  const recent = [...visits].slice(0, 14).reverse() // chronological
  const moodData = recent
    .filter((v) => v.mood !== undefined)
    .map((v) => ({ label: shortDate(v.date), value: v.mood as number }))
  const engagementData = recent
    .filter((v) => v.summary)
    .map((v) => ({ label: shortDate(v.date), value: v.summary!.engagement }))

  const latest = visits[0]
  const recentFlags = visits
    .slice(0, 7)
    .flatMap((v) =>
      (v.summary?.flags ?? []).map((flag) => ({ flag, date: shortDate(v.date) }))
    )
    .slice(0, 5)

  return (
    <div className="mt-8 space-y-6">
      {/* ------------------------- streak + latest ------------------------- */}
      <div className="grid gap-6 md:grid-cols-[1fr_1.6fr]">
        <div className="card">
          <h2 className="text-xl text-ink-muted">Showing up</h2>
          <p className="mt-3 text-5xl font-bold text-amber-deep">
            ☀️ {progress.currentStreak}
            <span className="ml-2 text-xl font-semibold text-ink-muted">
              day{progress.currentStreak === 1 ? '' : 's'} in a row
            </span>
          </p>
          <p className="mt-3 text-base text-ink-faint">
            Longest: {progress.longestStreak} · {visits.length} visit
            {visits.length === 1 ? '' : 's'} all together. Streaks celebrate
            showing up, memory is never scored.
          </p>
        </div>

        <div className="card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl text-ink-muted">Latest visit</h2>
            {latest && (
              <span className="text-base text-ink-faint">
                {shortDate(latest.date)} · {latest.theme}
                {latest.mode === 'ai' ? ' · AI' : ' · built-in'}
              </span>
            )}
          </div>
          {!latest ? (
            <p className="mt-3 text-ink-muted">
              After {profile.preferredName}&rsquo;s first visit, the summary
              will appear here.
            </p>
          ) : latest.summary ? (
            <>
              <p className="mt-3 text-lg">{latest.summary.summary}</p>
              {latest.summary.highlights.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {latest.summary.highlights.map((highlight) => (
                    <li key={highlight} className="text-base text-ink-muted">
                      ✨ {highlight}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 rounded-lg bg-sage-wash px-4 py-2.5 text-base text-sage-deep">
                💛 {latest.summary.encouragement}
              </p>
            </>
          ) : (
            <p className="mt-3 text-ink-muted">
              The visit finished, its summary is still being written.
            </p>
          )}
        </div>
      </div>

      {/* ------------------------------ trends ------------------------------ */}
      {visits.length >= 2 && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="text-xl">Mood at check-in</h2>
            <p className="mt-1 text-base text-ink-faint">
              Self-reported at the start of each visit.
            </p>
            <div className="mt-4">
              <TrendChart
                data={moodData}
                color={MOOD_COLOR}
                formatValue={(v) => MOOD_LABEL[v - 1] ?? String(v)}
              />
            </div>
          </div>
          <div className="card">
            <h2 className="text-xl">Engagement during visits</h2>
            <p className="mt-1 text-base text-ink-faint">
              How present and involved they seemed, from each visit summary.
            </p>
            <div className="mt-4">
              {engagementData.length >= 2 ? (
                <TrendChart
                  data={engagementData}
                  color={ENGAGEMENT_COLOR}
                  formatValue={(v) => `${ENGAGEMENT_LABEL[v - 1] ?? v} (${v}/5)`}
                />
              ) : (
                <p className="mt-6 text-ink-muted">
                  Engagement trends appear once a couple of summaries are in.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------- flags ------------------------------- */}
      <div className="card">
        <h2 className="text-xl">Gentle flags</h2>
        {recentFlags.length === 0 ? (
          <p className="mt-3 text-ink-muted">
            Nothing needs your attention right now, lovely. Anything worth a
            closer look from recent visits will show up here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentFlags.map(({ flag, date }, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-lg bg-rust-wash/70 px-4 py-3"
              >
                <span aria-hidden="true">⚑</span>
                <span className="text-base text-rust-deep">
                  {flag} <span className="opacity-70">({date})</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-base text-ink-faint">
          Flags are gentle observations, never diagnoses.{' '}
          <Link to="../visits" className="font-semibold text-brand-deep underline underline-offset-4">
            See all visits →
          </Link>
        </p>
      </div>
    </div>
  )
}

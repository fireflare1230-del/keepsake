import type { Profile, ProfileProgress, Visit } from '../../types'

/**
 * Trends, flags and the latest summary. Fleshed out in M6 — this
 * placeholder shows the streak and a warm empty state until then.
 */
export default function DashboardInsights({
  profile,
  visits,
  progress,
}: {
  profile: Profile
  visits: Visit[]
  progress: ProfileProgress
}) {
  return (
    <section className="mt-8 grid gap-6 md:grid-cols-2">
      <div className="card">
        <h2 className="text-2xl">Showing up</h2>
        <p className="mt-4 text-5xl font-bold text-amber-deep">
          {progress.currentStreak}
          <span className="ml-2 text-xl font-semibold text-ink-muted">
            day{progress.currentStreak === 1 ? '' : 's'} in a row
          </span>
        </p>
        <p className="mt-2 text-base text-ink-faint">
          Longest so far: {progress.longestStreak} — streaks celebrate visits,
          never memory.
        </p>
      </div>
      <div className="card">
        <h2 className="text-2xl">Visits so far</h2>
        {visits.length === 0 ? (
          <p className="mt-4 text-ink-muted">
            After {profile.preferredName}&rsquo;s first visit, mood and
            engagement trends will appear here.
          </p>
        ) : (
          <p className="mt-4 text-5xl font-bold text-brand-deeper">
            {visits.length}
            <span className="ml-2 text-xl font-semibold text-ink-muted">
              completed
            </span>
          </p>
        )}
      </div>
    </section>
  )
}

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import { THEMES } from '../../data/themes'
import { earnedMilestones } from '../../features/checkin/milestones'
import { timeGreeting } from '../../lib/dates'
import { disableDemo, isDemoActive } from '../../lib/demo'
import {
  getActiveProfile,
  loadLearnedFacts,
  loadProgress,
  loadSettings,
  loadVisits,
} from '../../lib/storage'
import DashboardInsights from './DashboardInsights'
import LaneNoticed from './LaneNoticed'

/**
 * Caretaker home: a quick-start checklist while setting up (FR-22),
 * then the at-a-glance dashboard (FR-24) once visits exist.
 */

export default function Dashboard() {
  const navigate = useNavigate()
  // Bumped when an approved "Lane noticed" fact changes the profile, so
  // the checklist and insights below re-read fresh data.
  const [refresh, setRefresh] = useState(0)
  const profile = useMemo(() => getActiveProfile(), [refresh])

  const data = useMemo(() => {
    if (!profile) return undefined
    const visits = loadVisits(profile.id).filter((v) => !v.preview)
    return {
      visits,
      completed: visits.filter((v) => v.completed),
      progress: loadProgress(profile.id),
      settings: loadSettings(),
      learnedCount: loadLearnedFacts(profile.id).length,
    }
  }, [profile])

  if (!profile || !data) return null

  const checklist = [
    {
      label: `Create ${profile.preferredName}'s profile`,
      done: true,
      to: 'profile',
    },
    {
      label: 'Add family & important people',
      done: profile.family.length > 0,
      to: 'profile',
    },
    {
      label: 'Add a favorite song or two',
      done: profile.favoriteMusic.length > 0,
      to: 'profile',
    },
    {
      label: 'Add favorite things (a team, a drink, a show)',
      done: Object.values(profile.favorites).some((list) => list.length > 0),
      to: 'profile',
    },
    {
      label: 'Add one gentle fact to reinforce',
      done: profile.factsToReinforce.length > 0,
      to: 'profile',
    },
    {
      label: 'Set a caretaker PIN',
      done: Boolean(data.settings.pinHash),
      to: 'settings',
    },
    {
      label: 'Optional: add an AI key for natural conversation',
      done: Boolean(data.settings.apiKey),
      to: 'settings',
      optional: true,
    },
    {
      label: 'Complete the first visit together',
      done: data.completed.length > 0,
      to: '/visit',
      external: true,
    },
  ]
  const coreItems = checklist.filter((item) => !item.optional)
  const setupComplete = coreItems.every((item) => item.done)

  return (
    <div className="stagger-in py-8">
      {isDemoActive() && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber/50 bg-amber-wash px-5 py-3.5">
          <p className="font-semibold text-amber-deep">
            👋 You&rsquo;re touring the sample family. Everything here is
            example data, explore freely.
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              disableDemo()
              navigate('/')
            }}
          >
            Remove sample data
          </Button>
        </div>
      )}
      <h1 className="text-3xl">
        {timeGreeting()}, here&rsquo;s {profile.preferredName}&rsquo;s Keepsake.
      </h1>

      {/* ------------------------- quick actions ------------------------- */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button size="lg" onClick={() => navigate('/visit')}>
          Start today&rsquo;s visit →
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate('/visit?preview=1')}
        >
          Preview Lane yourself
        </Button>
        <Button variant="ghost" size="lg" onClick={() => navigate('report')}>
          Printable report
        </Button>
      </div>
      <p className="mt-3 text-base text-ink-faint">
        Preview lets you feel what a visit is like, it isn&rsquo;t saved and
        doesn&rsquo;t touch the streak.
      </p>

      {/* ---------------------- quick-start checklist --------------------- */}
      {!setupComplete && (
        <section className="index-card mt-8 rotate-[-0.35deg]" aria-labelledby="checklist-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="checklist-heading" className="text-2xl">
              Getting set up
            </h2>
            <span className="hand text-lg text-[#8A4B2A]">
              {coreItems.filter((i) => i.done).length} of {coreItems.length} done
            </span>
          </div>
          <ul className="mt-5 space-y-3">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="flex min-h-[48px] items-center gap-4 rounded-lg px-3 py-2 hover:bg-cream-soft"
                >
                  <span
                    aria-hidden="true"
                    className={
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg ' +
                      (item.done
                        ? 'bg-moss text-white'
                        : 'border-2 border-cream-deep bg-[#FFFDF9] text-transparent')
                    }
                  >
                    ✓
                  </span>
                  <span
                    className={
                      item.done ? 'text-ink-faint line-through' : 'font-medium'
                    }
                  >
                    {item.label}
                  </span>
                  {!item.done && <span className="ml-auto text-brand-deep">→</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------- "Lane noticed" review inbox ------------------- */}
      {(data.completed.length > 0 || data.learnedCount > 0) && (
        <LaneNoticed
          key={refresh}
          profile={profile}
          hasApiKey={Boolean(data.settings.apiKey)}
          onChanged={() => setRefresh((n) => n + 1)}
        />
      )}

      {/* --------------------------- keepsake shelf ------------------------- */}
      {data.completed.length > 0 && (
        <section className="sheet mt-10" aria-labelledby="shelf-heading">
          <p className="section-label">Kept so far</p>
          <h2 id="shelf-heading" className="mt-1 text-2xl">
            The keepsake shelf
          </h2>
          <p className="mt-2 max-w-xl text-base text-ink-muted">
            Every visit leaves a little memento. A quiet record that the
            ritual is alive.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {data.completed.slice(0, 21).map((visit, index) => (
              <span
                key={visit.id}
                title={`${visit.theme} · ${new Date(visit.date).toLocaleDateString()}`}
                className="flex h-12 w-12 items-center justify-center border border-[#dcccb0] bg-[#FFFDF6] text-2xl shadow-[2px_2px_0_rgba(61,47,36,0.1)]"
                style={{ transform: `rotate(${(index % 3) - 1}deg)` }}
              >
                {THEMES.find((t) => t.name === visit.theme)?.emoji ?? '💛'}
              </span>
            ))}
            {data.completed.length > 21 && (
              <span className="flex h-11 items-center px-2 text-base text-ink-faint">
                +{data.completed.length - 21} more
              </span>
            )}
          </div>
          {earnedMilestones(data.progress.longestStreak).length > 0 && (
            <div className="mt-5 border-t border-cream-deep pt-4">
              <p className="text-base font-semibold text-ink-muted">Milestones</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {earnedMilestones(data.progress.longestStreak).map((m) => (
                  <span
                    key={m.days}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-wash px-4 py-2 font-semibold text-amber-deep"
                  >
                    <span aria-hidden="true">{m.emoji}</span>
                    {m.days} days
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* --------------- trends, flags & latest summary (M6) --------------- */}
      <DashboardInsights
        profile={profile}
        visits={data.completed}
        progress={data.progress}
      />
    </div>
  )
}

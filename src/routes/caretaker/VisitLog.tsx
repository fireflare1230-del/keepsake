import { useMemo, useState } from 'react'
import Button from '../../components/Button'
import { exportVisitsCsv, exportVisitsJson } from '../../lib/exporters'
import { friendlyDateTime } from '../../lib/dates'
import { getActiveProfile, loadVisits } from '../../lib/storage'
import type { Visit } from '../../types'

/**
 * The visit log (FR-25): every visit opens into a full detail view,
 * how it went at a glance, the summary, warm moments, flags, and the
 * complete conversation. JSON/CSV export (FR-26).
 */

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄']
const MOOD_WORD = ['Not so good', 'A little low', 'Okay', 'Good', 'Wonderful']
const ENGAGEMENT_WORD = ['Very quiet', 'Quiet', 'Present', 'Engaged', 'Lit up']

function formatDuration(seconds?: number): string {
  if (!seconds) return 'n/a'
  if (seconds < 60) return 'under a minute'
  const minutes = Math.round(seconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

export default function VisitLog() {
  const profile = getActiveProfile()
  const visits = useMemo(
    () => (profile ? loadVisits(profile.id) : []),
    [profile]
  )
  const [openId, setOpenId] = useState<string | null>(null)

  if (!profile) return null

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">Visits</h1>
        {visits.length > 0 && (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => exportVisitsJson(profile, visits)}>
              Export JSON
            </Button>
            <Button variant="secondary" onClick={() => exportVisitsCsv(profile, visits)}>
              Export CSV
            </Button>
          </div>
        )}
      </div>

      {visits.length === 0 ? (
        <div className="card mt-8 text-center">
          <p className="text-xl">No visits yet.</p>
          <p className="mt-2 text-ink-muted">
            When {profile.preferredName} completes a visit, the full story of
            it lands here.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {visits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              open={openId === visit.id}
              onToggle={() => setOpenId(openId === visit.id ? null : visit.id)}
              preferredName={profile.preferredName}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------ one visit -------------------------------- */

function VisitCard({
  visit,
  open,
  onToggle,
  preferredName,
}: {
  visit: Visit
  open: boolean
  onToggle: () => void
  preferredName: string
}) {
  return (
    <li className="card p-0">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-[64px] w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-xl px-6 py-4 text-left hover:bg-cream-soft"
      >
        <span className="text-2xl" aria-hidden="true">
          {visit.mood ? MOOD_EMOJI[visit.mood - 1] : '·'}
        </span>
        <span className="font-semibold">{friendlyDateTime(visit.date)}</span>
        <span className="text-ink-muted">{visit.theme}</span>
        <span className="ml-auto flex items-center gap-2 text-base">
          {visit.preview && (
            <span className="rounded-full bg-brand-wash px-3 py-1 font-semibold text-brand-deeper">
              Preview
            </span>
          )}
          {!visit.completed && (
            <span className="rounded-full bg-cream-deep px-3 py-1 font-semibold text-ink-muted">
              Unfinished
            </span>
          )}
          <span className="rounded-full bg-cream-soft px-3 py-1 text-ink-faint">
            {visit.mode === 'ai' ? 'AI' : 'Built-in'}
          </span>
          <span aria-hidden="true" className="text-ink-faint">
            {open ? '▲' : '▼'}
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-cream-deep px-6 py-5">
          {/* ------------------------- at a glance ------------------------- */}
          <h3 className="text-lg font-semibold text-ink-muted">At a glance</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <GlanceStat
              label="Mood at check-in"
              value={
                visit.mood
                  ? `${MOOD_EMOJI[visit.mood - 1]} ${MOOD_WORD[visit.mood - 1]}`
                  : 'Not recorded'
              }
            />
            <GlanceStat
              label="Engagement"
              value={
                visit.summary
                  ? `${ENGAGEMENT_WORD[visit.summary.engagement - 1]} (${visit.summary.engagement}/5)`
                  : 'No summary yet'
              }
            />
            <GlanceStat label="Visit length" value={formatDuration(visit.durationSec)} />
            <GlanceStat
              label="Conversation"
              value={visit.mode === 'ai' ? 'AI (their profile)' : 'Built-in prompts'}
            />
          </div>

          {visit.factReinforced && (
            <p className="mt-4 rounded-lg bg-sage-wash px-4 py-3 text-base text-sage-deep">
              🌱 Gentle fact shared this visit: &ldquo;{visit.factReinforced}&rdquo;
            </p>
          )}

          {/* -------------------------- the summary ------------------------- */}
          {visit.summary && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-ink-muted">How it went</h3>
              <p className="mt-2 text-base">{visit.summary.summary}</p>

              {visit.summary.highlights.length > 0 && (
                <>
                  <h4 className="mt-4 text-base font-semibold text-ink-muted">
                    Warm moments
                  </h4>
                  <ul className="mt-1.5 space-y-1.5">
                    {visit.summary.highlights.map((highlight) => (
                      <li key={highlight} className="text-base">
                        ✨ {highlight}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {visit.summary.flags.length > 0 && (
                <>
                  <h4 className="mt-4 text-base font-semibold text-ink-muted">
                    Worth a gentle eye
                  </h4>
                  <ul className="mt-1.5 space-y-1.5">
                    {visit.summary.flags.map((flag) => (
                      <li key={flag} className="rounded-lg bg-rust-wash/70 px-3 py-2 text-base text-rust-deep">
                        ⚑ {flag}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <p className="mt-4 rounded-lg bg-brand-wash/60 px-4 py-3 text-base text-brand-deeper">
                💛 {visit.summary.encouragement}
              </p>
            </div>
          )}

          {/* ------------------------- the conversation --------------------- */}
          <h3 className="mb-3 mt-6 text-lg font-semibold text-ink-muted">
            The whole conversation
          </h3>
          {visit.transcript.length === 0 ? (
            <p className="text-base text-ink-faint">No conversation was recorded.</p>
          ) : (
            <div className="space-y-3">
              {visit.transcript.map((message, index) => (
                <div
                  key={index}
                  className={
                    'max-w-[85%] rounded-xl px-4 py-2.5 text-base ' +
                    (message.role === 'lane'
                      ? 'bg-brand-wash/60'
                      : 'ml-auto bg-amber-wash')
                  }
                >
                  <span className="mb-0.5 block text-sm font-semibold text-ink-faint">
                    {message.role === 'lane' ? 'Lane' : preferredName}
                  </span>
                  {message.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function GlanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-cream-soft px-4 py-3">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  )
}

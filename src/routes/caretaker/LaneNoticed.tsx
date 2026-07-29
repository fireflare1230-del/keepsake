import { useMemo, useState } from 'react'
import Button from '../../components/Button'
import { decideLearnedFact, loadLearnedFacts } from '../../lib/storage'
import type { LearnedCategory, LearnedFact, Profile } from '../../types'

/**
 * The "Lane noticed" review inbox (PDR v1.2 §2.5).
 *
 * During visits, people volunteer things the caretaker never wrote down,
 * a hometown, a favorite pie, a team. Lane queues them here as candidates
 * with the person's own words as evidence. Nothing touches the profile
 * until the caretaker approves it; a dismissal sticks forever.
 */

const CATEGORY_LABEL: Record<LearnedCategory, string> = {
  hometown: 'Hometown',
  happyMemory: 'Happy memory',
  food: 'Favorite food',
  drink: 'Favorite drink',
  sport: 'Team or sport',
  show: 'Movie or show',
  hobby: 'Hobby',
  lifeStory: 'Life story',
  delight: 'Lights them up',
  avoid: 'Topic to avoid',
}

const CATEGORY_EMOJI: Record<LearnedCategory, string> = {
  hometown: '🏡',
  happyMemory: '💛',
  food: '🥧',
  drink: '☕',
  sport: '🏟️',
  show: '🎬',
  hobby: '🎣',
  lifeStory: '📖',
  delight: '✨',
  avoid: '🌿',
}

export default function LaneNoticed({
  profile,
  hasApiKey,
  onChanged,
}: {
  profile: Profile
  hasApiKey: boolean
  /** Lets the dashboard refresh anything derived from the profile. */
  onChanged?: () => void
}) {
  const [facts, setFacts] = useState<LearnedFact[]>(() =>
    loadLearnedFacts(profile.id)
  )
  const [showHistory, setShowHistory] = useState(false)
  /** Ids fading out right now, so a decision feels acknowledged. */
  const [leaving, setLeaving] = useState<string[]>([])

  const pending = useMemo(
    () => facts.filter((f) => f.status === 'pending'),
    [facts]
  )
  const decided = useMemo(
    () => facts.filter((f) => f.status !== 'pending').slice(0, 12),
    [facts]
  )

  function decide(fact: LearnedFact, decision: 'approved' | 'dismissed') {
    setLeaving((ids) => [...ids, fact.id])
    window.setTimeout(() => {
      decideLearnedFact(profile.id, fact.id, decision)
      setFacts(loadLearnedFacts(profile.id))
      setLeaving((ids) => ids.filter((id) => id !== fact.id))
      onChanged?.()
    }, 260)
  }

  return (
    <section className="card mt-8" aria-labelledby="lane-noticed-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="lane-noticed-heading" className="flex items-center gap-3 text-2xl">
          Lane noticed
          {pending.length > 0 && (
            <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-amber px-2 text-base font-bold text-ink">
              {pending.length}
            </span>
          )}
        </h2>
        {decided.length > 0 && (
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="text-base font-semibold text-brand-deep underline-offset-4 hover:underline"
          >
            {showHistory ? 'Hide history' : 'History'}
          </button>
        )}
      </div>
      <p className="mt-2 text-base text-ink-muted">
        Things {profile.preferredName} shared during visits that aren&rsquo;t in
        the profile yet. Nothing is added until you approve it.
      </p>

      {pending.length === 0 ? (
        <p className="mt-5 rounded-lg bg-cream-soft px-4 py-3 text-base text-ink-faint">
          {hasApiKey
            ? 'Nothing waiting for review. Lane keeps listening during visits.'
            : 'Lane only learns during AI conversations. Add an AI key in Settings and new favorites will start appearing here.'}
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {pending.map((fact) => (
            <li
              key={fact.id}
              className={
                'rounded-xl border border-cream-deep bg-[#FFFDF9] p-4 transition-all duration-300 ' +
                (leaving.includes(fact.id)
                  ? 'translate-x-3 opacity-0'
                  : 'opacity-100')
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-sage-wash px-3 py-1 text-sm font-semibold text-sage-deep"
                >
                  <span aria-hidden="true">{CATEGORY_EMOJI[fact.category]}</span>
                  {CATEGORY_LABEL[fact.category]}
                </span>
                <span className="text-sm text-ink-faint">
                  from the visit on{' '}
                  {new Date(fact.visitDate).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="mt-2.5 text-lg font-semibold text-ink">{fact.value}</p>
              {fact.quote && (
                <p className="mt-1 text-base italic text-ink-muted">
                  &ldquo;{fact.quote}&rdquo;
                </p>
              )}
              <div className="mt-4 flex gap-3">
                <Button size="md" onClick={() => decide(fact, 'approved')}>
                  Add to profile
                </Button>
                <Button
                  size="md"
                  variant="ghost"
                  onClick={() => decide(fact, 'dismissed')}
                >
                  Not right
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showHistory && decided.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-cream-deep pt-4">
          {decided.map((fact) => (
            <li key={fact.id} className="flex items-baseline gap-3 text-base">
              <span
                aria-hidden="true"
                className={
                  fact.status === 'approved' ? 'text-moss' : 'text-ink-faint'
                }
              >
                {fact.status === 'approved' ? '✓' : '✕'}
              </span>
              <span className={fact.status === 'dismissed' ? 'text-ink-faint line-through' : ''}>
                {fact.value}
              </span>
              <span className="ml-auto shrink-0 text-sm text-ink-faint">
                {CATEGORY_LABEL[fact.category]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

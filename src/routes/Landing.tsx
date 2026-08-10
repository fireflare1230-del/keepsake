import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import CountUp from '../components/CountUp'
import { LogoLockup, LogoMark } from '../components/Logo'
import Reveal from '../components/Reveal'
import { enableDemo, isDemoActive } from '../lib/demo'
import { ensureSchema, loadProfiles } from '../lib/storage'

/**
 * Public landing page, v1.4 "showcase" redesign: an aurora hero with a
 * word-by-word headline, a self-playing live demo of a visit with Lane,
 * scroll-triggered reveals, and one-tap demo mode so anyone can tour
 * the full product without setting anything up.
 */

export default function Landing() {
  const navigate = useNavigate()
  const [hasProfiles, setHasProfiles] = useState(false)

  useEffect(() => {
    ensureSchema()
    setHasProfiles(loadProfiles().length > 0)
  }, [])

  const start = () => navigate(hasProfiles ? '/visit' : '/welcome')
  const startDemo = () => {
    if (!isDemoActive()) enableDemo()
    navigate('/care')
  }

  return (
    <div className="min-h-screen">
      {/* ------------------------------ header ------------------------------ */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <LogoLockup size={36} />
        <nav className="flex items-center gap-3" aria-label="Main">
          {hasProfiles && (
            <Button variant="ghost" onClick={() => navigate('/care')}>
              Caretaker area
            </Button>
          )}
          <Button variant={hasProfiles ? 'primary' : 'ghost'} onClick={start}>
            {hasProfiles ? "Start today's visit" : 'Get started'}
          </Button>
        </nav>
      </header>

      {/* ------------------------------- hero ------------------------------- */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="aurora aurora-a" />
        <div aria-hidden="true" className="aurora aurora-b" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-16">
          <div className="grid items-center gap-12 md:grid-cols-[1.05fr_1fr]">
            <div>
              <p className="eyebrow">AI companion for memory care</p>
              <h1 className="mt-5 text-5xl font-bold md:text-6xl">
                <Words text="Help your loved one hold" startIndex={0} />{' '}
                <span className="highlight">
                  <Words text="the moments that matter." startIndex={5} />
                </span>
              </h1>
              <p
                className="mt-6 max-w-xl text-xl leading-relaxed text-ink-muted opacity-0"
                style={{ animation: 'stepEnter 0.7s ease-out 1.1s forwards' }}
              >
                A short daily visit with Lane, a gentle companion who{' '}
                <span className="accent-word">shares</span> memories instead of
                testing them. Built on dementia-care research, private by
                design.
              </p>
              <div
                className="mt-8 flex flex-wrap items-center gap-4 opacity-0"
                style={{ animation: 'stepEnter 0.7s ease-out 1.35s forwards' }}
              >
                <Button size="lg" onClick={start}>
                  {hasProfiles ? "Start today's visit" : 'Get started'} →
                </Button>
                <Button size="lg" variant="secondary" onClick={startDemo}>
                  Tour the sample family
                </Button>
              </div>
              <p
                className="mt-6 text-base text-ink-faint opacity-0"
                style={{ animation: 'stepEnter 0.7s ease-out 1.55s forwards' }}
              >
                Free · Private · Installs on any phone or tablet
              </p>
            </div>

            {/* The self-playing visit */}
            <LiveDemo />
          </div>
        </div>
      </section>

      {/* ------------------------------ fact strip ---------------------------- */}
      <section className="border-y border-cream-deep bg-[#FFFDF9]/70">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 md:grid-cols-4">
          <Fact n={12} label="rotating memory themes" />
          <Fact n={7} label="golden rules of dementia care" />
          <Fact n={1} label="gentle visit a day" />
          <Fact n={0} label="servers holding their data" />
        </div>
      </section>

      {/* ------------------------------ story ------------------------------- */}
      <section className="bg-brand-wash/60 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <LogoMark size={44} />
            <h2 className="mt-5 text-3xl">Built by a grandson, for his grandfather.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
              &ldquo;Do you remember me?&rdquo; hurt my grandfather every time.
              But when someone simply <em>shared</em> a memory, he lit up.
              Keepsake turns that lesson, and decades of dementia-care research,
              into a gentle daily ritual.
            </p>
          </Reveal>
        </div>
      </section>

      {/* --------------------------- how it works --------------------------- */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-16">
        <Reveal>
          <h2 className="text-center text-3xl">How it works</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <div className="card flex h-full flex-col p-7 transition-all duration-300 ease-gentle hover:-translate-y-1.5 hover:shadow-lift">
              <StepBadge n="1" />
              <h3 className="mt-4 text-xl">Tell Keepsake their story</h3>
              <p className="mt-2 text-ink-muted">
                The people they love, their songs, their team, their photos.
              </p>
              <div aria-hidden="true" className="mt-5 rounded-lg border border-cream-deep bg-cream-soft/60 p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
                  Their favorite things
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <MiniTag>♪ Moon River</MiniTag>
                  <MiniTag>🏈 The Braves</MiniTag>
                  <MiniTag>🥤 Sweet tea</MiniTag>
                  <MiniTag>🎬 Westerns</MiniTag>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="card flex h-full flex-col p-7 transition-all duration-300 ease-gentle hover:-translate-y-1.5 hover:shadow-lift">
              <StepBadge n="2" />
              <h3 className="mt-4 text-xl">Hand over the tablet</h3>
              <p className="mt-2 text-ink-muted">
                Lane guides a calm visit. Big buttons, nothing to get wrong.
              </p>
              <div aria-hidden="true" className="mt-5 rounded-lg border border-cream-deep bg-cream-soft/60 p-4">
                <p className="text-center text-base font-semibold">
                  How are you feeling today?
                </p>
                <div className="mt-2.5 flex justify-center gap-2 text-2xl">
                  <span className="rounded-lg bg-[#FFFDF9] px-2 py-1 shadow-card">😐</span>
                  <span className="rounded-lg bg-[#FFFDF9] px-2 py-1 shadow-card">🙂</span>
                  <span className="rounded-lg border-2 border-brand bg-brand-wash px-2 py-1 shadow-card">😄</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="card flex h-full flex-col p-7 transition-all duration-300 ease-gentle hover:-translate-y-1.5 hover:shadow-lift">
              <StepBadge n="3" />
              <h3 className="mt-4 text-xl">Watch Keepsake learn</h3>
              <p className="mt-2 text-ink-muted">
                Lane notices what lights them up. You approve every discovery.
              </p>
              <div aria-hidden="true" className="mt-5 rounded-lg border border-cream-deep bg-cream-soft/60 p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
                  Lane noticed
                </p>
                <p className="mt-2 text-base">
                  🎶 &ldquo;I sang in the church choir, tenor&rdquo;
                </p>
                <div className="mt-2.5 flex gap-2">
                  <span className="rounded-full bg-moss-wash px-3 py-1 text-sm font-semibold text-moss-deep">
                    Add to profile
                  </span>
                  <span className="rounded-full bg-cream-deep px-3 py-1 text-sm font-semibold text-ink-faint">
                    Not right
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------- gentle by design ------------------------ */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <Reveal>
          <div className="overflow-hidden rounded-2xl bg-evergreen text-cream shadow-deep">
            <div className="grid items-center gap-10 p-8 md:grid-cols-[1fr_1fr] md:p-12">
              <div>
                <h2 className="text-3xl text-cream">Gentle by design</h2>
                <p className="mt-2 text-cream/70">
                  Every word follows dementia-care research. The calm is the
                  craft.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Never quizzes, never corrects',
                    'Big tap-able answers, nothing to get wrong',
                    'Rewards showing up, never scores memory',
                    'Learns their favorites over time, you approve every one',
                    'Everything stays on your device',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage/25 text-sage"
                      >
                        ✓
                      </span>
                      <span className="text-lg text-cream/95">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div aria-hidden="true" className="relative mx-auto w-full max-w-xs">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-sage/20" />
                <div className="card relative rotate-[1.4deg] p-6 text-center shadow-lift">
                  <span className="text-4xl">🌻</span>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    That was a lovely visit, Walter.
                  </p>
                  <p className="mt-3 rounded-lg bg-amber-wash px-4 py-2.5 font-semibold text-amber-deep">
                    ☀️ 6 days in a row
                  </p>
                  <p className="mt-2 text-base text-ink-faint">See you tomorrow 💛</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------ final CTA ---------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-20 text-center">
        <Reveal>
          <h2 className="text-3xl">Start their first visit today.</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-ink-muted">
            Setup takes two minutes. Free, with or without an AI key.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" onClick={start}>
              {hasProfiles ? "Start today's visit" : 'Get started'} →
            </Button>
            <Button size="lg" variant="secondary" onClick={startDemo}>
              Tour the sample family
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------- footer ------------------------------ */}
      <footer className="border-t border-cream-deep bg-cream-soft/70 py-10">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <LogoLockup size={28} />
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-muted">
            Keepsake is a wellness companion, not a medical device. It does not
            provide medical advice, diagnosis, or treatment. Always consult
            healthcare providers for medical concerns.
          </p>
          <p className="mt-4 text-base text-ink-faint">
            Reconnect. Remember. · v1.4 ·{' '}
            <Link to="/care" className="underline underline-offset-4">
              Caretaker area
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------ hero pieces ------------------------------ */

/** Splits text into .word spans that rise one by one. */
function Words({ text, startIndex }: { text: string; startIndex: number }) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <span
          key={i}
          className="word"
          style={{ '--i': startIndex + i } as React.CSSProperties}
        >
          {word}
          {i < text.split(' ').length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

function Fact({ n, label }: { n: number; label: string }) {
  return (
    <Reveal className="text-center">
      <p className="font-display text-4xl font-bold text-brand-deeper">
        <CountUp value={n} />
      </p>
      <p className="mt-1 text-base text-ink-muted">{label}</p>
    </Reveal>
  )
}

/* ---------------------------- the live demo ------------------------------ */

interface DemoTurn {
  lane: string
  chips: string[]
  pick: number
}

const DEMO_TURNS: DemoTurn[] = [
  {
    lane: 'I was thinking about those long summer evenings in Savannah. I bet the porch was the place to be.',
    chips: ['It sure was', 'That sounds like home', 'Tell me more'],
    pick: 0,
  },
  {
    lane: 'Streetlights coming on, somebody calling you in for supper. What a way to grow up.',
    chips: ['Those were the days', "I'm not sure", 'Tell me more'],
    pick: 0,
  },
]

type DemoPhase = 'typing' | 'chips' | 'picked' | 'replied'

/**
 * A hands-free loop of one visit exchange: Lane types, chips pop in,
 * one gets "tapped", the reply lands, and the next turn begins. Frozen
 * to its final state under prefers-reduced-motion.
 */
function LiveDemo() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [turnIndex, setTurnIndex] = useState(0)
  const [phase, setPhase] = useState<DemoPhase>('typing')
  const [typed, setTyped] = useState(reduced ? DEMO_TURNS[0].lane : '')
  const timers = useRef<number[]>([])
  const turn = DEMO_TURNS[turnIndex]

  useEffect(() => {
    if (reduced) return
    const wait = (ms: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, ms))
    }

    if (phase === 'typing') {
      if (typed.length < turn.lane.length) {
        wait(26, () => setTyped(turn.lane.slice(0, typed.length + 1)))
      } else {
        wait(350, () => setPhase('chips'))
      }
    } else if (phase === 'chips') {
      wait(1600, () => setPhase('picked'))
    } else if (phase === 'picked') {
      wait(650, () => setPhase('replied'))
    } else if (phase === 'replied') {
      wait(1900, () => {
        setTurnIndex((i) => (i + 1) % DEMO_TURNS.length)
        setTyped('')
        setPhase('typing')
      })
    }
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [phase, typed, turn.lane, reduced])

  const showChips = reduced || phase !== 'typing'
  const showReply = reduced || phase === 'replied'

  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md">
      <div className="absolute -left-6 -top-6 h-40 w-40 rounded-full bg-sage-wash" />
      <div className="absolute -bottom-8 -right-4 h-52 w-52 rounded-full bg-amber-wash" />
      <div className="card relative rotate-[-1.2deg] p-6 shadow-deep">
        <div className="flex items-start gap-3">
          <LogoMark size={34} />
          <div className="min-h-[96px] flex-1 rounded-xl rounded-tl-sm bg-brand-wash px-4 py-3 text-ink">
            {reduced ? turn.lane : typed}
            {!reduced && phase === 'typing' && <span className="demo-caret" />}
          </div>
        </div>

        <div className="mt-5 flex min-h-[88px] flex-wrap content-start justify-end gap-2.5">
          {showChips &&
            turn.chips.map((chip, i) => {
              const isPicked =
                (phase === 'picked' || phase === 'replied') && i === turn.pick
              return (
                <span
                  key={`${turnIndex}-${chip}`}
                  className={
                    'demo-chip-in rounded-full border px-4 py-2 font-semibold shadow-card transition-all duration-300 ' +
                    (isPicked
                      ? 'border-brand bg-brand-wash text-brand-deeper'
                      : 'border-cream-deep bg-[#FFFDF9] text-ink') +
                    (phase === 'replied' && !isPicked ? ' opacity-40' : '')
                  }
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  {chip}
                </span>
              )
            })}
        </div>

        {showReply && (
          <div className="demo-chip-in mt-3 flex justify-end">
            <span className="rounded-xl rounded-br-sm bg-amber-wash px-4 py-2.5 text-ink">
              {turn.chips[turn.pick]}
            </span>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 border-t border-cream-deep pt-4 text-base text-ink-faint">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-moss" />
          Live demo · Today&rsquo;s theme: Childhood summers
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ tiny pieces ------------------------------ */

function MiniTag({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-[#FFFDF9] px-3 py-1.5 text-sm font-semibold shadow-card">
      {children}
    </span>
  )
}

function StepBadge({ n }: { n: string }) {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber font-display text-xl font-bold text-ink">
      {n}
    </span>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { LogoLockup, LogoMark } from '../components/Logo'
import { ensureSchema, loadProfiles } from '../lib/storage'

/**
 * Public landing page (FR-1..5), v1.1: short and warm. Little "moments
 * from the app" vignette cards do the explaining instead of paragraphs.
 */

export default function Landing() {
  const navigate = useNavigate()
  const [hasProfiles, setHasProfiles] = useState(false)

  useEffect(() => {
    ensureSchema()
    setHasProfiles(loadProfiles().length > 0)
  }, [])

  const start = () => navigate(hasProfiles ? '/visit' : '/welcome')

  return (
    <div className="min-h-screen">
      {/* ------------------------------ header ------------------------------ */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
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
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-10 md:pt-16">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-5 inline-block rounded-full bg-brand-wash px-4 py-1.5 font-semibold text-brand-deeper">
              Reconnect. Remember.
            </p>
            <h1 className="text-4xl font-bold leading-[1.15] md:text-5xl">
              Help your loved one remember the{' '}
              <span className="highlight">moments that matter</span>.
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-ink-muted">
              A short daily visit with Lane, a gentle companion who{' '}
              <span className="accent-word">shares</span> memories instead of
              testing them.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={start}>
                {hasProfiles ? "Start today's visit" : 'Get started'} →
              </Button>
              {/* A plain #anchor href fights the HashRouter, so scroll directly */}
              <button
                onClick={() =>
                  document
                    .getElementById('how-it-works')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="min-h-[48px] font-semibold text-brand-deep underline-offset-4 hover:underline"
              >
                See how it works ↓
              </button>
            </div>
            <p className="mt-6 text-base text-ink-faint">
              Free · Private · Works with or without an AI key
            </p>
          </div>

          {/* A moment with Lane */}
          <div aria-hidden="true" className="relative mx-auto w-full max-w-md">
            <div className="absolute -left-6 -top-6 h-40 w-40 rounded-full bg-sage-wash" />
            <div className="absolute -bottom-8 -right-4 h-52 w-52 rounded-full bg-amber-wash" />
            <div className="card relative rotate-[-1.2deg] p-6 shadow-lift">
              <div className="flex items-start gap-3">
                <LogoMark size={34} />
                <div className="rounded-xl rounded-tl-sm bg-brand-wash px-4 py-3 text-ink">
                  I was thinking about those long summer evenings in Mobile.
                  I bet the porch was the place to be.
                </div>
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-2.5">
                <MockChip>It sure was</MockChip>
                <MockChip>That sounds like home</MockChip>
                <MockChip muted>Tell me more</MockChip>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-cream-deep pt-4 text-base text-ink-faint">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-moss" />
                Today&rsquo;s theme: Childhood summers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ story ------------------------------- */}
      <section className="bg-brand-wash/60 py-14">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <LogoMark size={44} />
          <h2 className="mt-5 text-3xl">Built by a grandson, for his grandfather.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
            &ldquo;Do you remember me?&rdquo; hurt my grandfather every time.
            But when someone simply <em>shared</em> a memory, he lit up.
            Keepsake turns that lesson, and decades of dementia-care research,
            into a gentle daily ritual.
          </p>
        </div>
      </section>

      {/* --------------------------- how it works --------------------------- */}
      <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-8 px-6 py-16">
        <h2 className="text-center text-3xl">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Step 1 */}
          <div className="card flex flex-col p-7">
            <StepBadge n="1" />
            <h3 className="mt-4 text-xl">Tell Keepsake their story</h3>
            <p className="mt-2 text-ink-muted">
              The people they love, their songs, their team, their sweet tea.
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

          {/* Step 2 */}
          <div className="card flex flex-col p-7">
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

          {/* Step 3 */}
          <div className="card flex flex-col p-7">
            <StepBadge n="3" />
            <h3 className="mt-4 text-xl">See how it went</h3>
            <p className="mt-2 text-ink-muted">
              A gentle summary of mood and warm moments. Never a memory score.
            </p>
            <div aria-hidden="true" className="mt-5 rounded-lg border border-cream-deep bg-cream-soft/60 p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
                Today&rsquo;s visit
              </p>
              <p className="mt-2 text-base">
                Bob lit up talking about porch evenings. 🙂 Good mood ·
                engaged 4/5
              </p>
              <p className="mt-2 rounded bg-sage-wash px-2.5 py-1.5 text-sm text-sage-deep">
                💛 These visits matter more than they look.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- gentle by design ------------------------ */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="card p-8 md:p-10">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="text-3xl">Gentle by design</h2>
              <p className="mt-2 text-ink-muted">
                Every word follows dementia-care research.
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
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss-wash text-moss-deep"
                    >
                      ✓
                    </span>
                    <span className="text-lg">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The streak vignette */}
            <div aria-hidden="true" className="relative mx-auto w-full max-w-xs">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-sage-wash" />
              <div className="card relative rotate-[1.4deg] p-6 text-center shadow-lift">
                <span className="text-4xl">🌻</span>
                <p className="mt-2 font-display text-2xl font-semibold">
                  That was a lovely visit, Bob.
                </p>
                <p className="mt-3 rounded-lg bg-amber-wash px-4 py-2.5 font-semibold text-amber-deep">
                  ☀️ 6 days in a row
                </p>
                <p className="mt-2 text-base text-ink-faint">See you tomorrow 💛</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ final CTA ---------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-20 text-center">
        <h2 className="text-3xl">Start their first visit today.</h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink-muted">
          Setup takes two minutes. Free, with or without an AI key.
        </p>
        <div className="mt-7">
          <Button size="lg" onClick={start}>
            {hasProfiles ? "Start today's visit" : 'Get started'} →
          </Button>
        </div>
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
            Reconnect. Remember. · v1.2 ·{' '}
            <Link to="/care" className="underline underline-offset-4">
              Caretaker area
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------ tiny pieces ------------------------------ */

function MockChip({ children, muted }: { children: string; muted?: boolean }) {
  return (
    <span
      className={
        'rounded-full border border-cream-deep bg-[#FFFDF9] px-4 py-2 font-semibold shadow-card ' +
        (muted ? 'text-ink-muted' : 'text-ink')
      }
    >
      {children}
    </span>
  )
}

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

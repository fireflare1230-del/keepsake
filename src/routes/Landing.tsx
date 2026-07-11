import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { LogoLockup, LogoMark } from '../components/Logo'
import { ensureSchema, loadProfiles } from '../lib/storage'

/**
 * Public landing page (FR-1..5). Warm and unhurried — it needs to earn
 * the trust of a stressed family caretaker in one scroll.
 */

export default function Landing() {
  const navigate = useNavigate()
  const [hasProfiles, setHasProfiles] = useState(false)

  useEffect(() => {
    ensureSchema()
    setHasProfiles(loadProfiles().length > 0)
  }, [])

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
          <Button
            variant={hasProfiles ? 'primary' : 'ghost'}
            onClick={() => navigate(hasProfiles ? '/visit' : '/welcome')}
          >
            {hasProfiles ? "Start today's visit" : 'Get started'}
          </Button>
        </nav>
      </header>

      {/* ------------------------------- hero ------------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-10 md:pt-16">
        <div className="grid items-center gap-12 md:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-4 inline-block rounded-full bg-brand-wash px-4 py-1.5 font-semibold text-brand-deeper">
              Reconnect. Remember.
            </p>
            <h1 className="text-4xl font-bold md:text-5xl">
              Help your loved one remember the moments that matter.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">
              Keepsake gives a person living with Alzheimer&rsquo;s a short,
              pleasant daily visit with Lane — a gentle companion who shares
              memories instead of testing them. No quizzes. No corrections.
              Just warmth.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate(hasProfiles ? '/visit' : '/welcome')}
              >
                {hasProfiles ? "Start today's visit" : 'Get started'} →
              </Button>
              <a
                href="#how-it-works"
                className="font-semibold text-brand-deep underline-offset-4 hover:underline"
              >
                See how it works
              </a>
            </div>
            <p className="mt-6 text-base text-ink-faint">
              Free to use · Everything stays on your device · Works with or
              without an AI key
            </p>
          </div>

          {/* A calm illustrative vignette — a sample moment with Lane */}
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
                <span className="rounded-full border border-cream-deep bg-[#FFFDF9] px-4 py-2 font-semibold text-ink shadow-card">
                  It sure was
                </span>
                <span className="rounded-full border border-cream-deep bg-[#FFFDF9] px-4 py-2 font-semibold text-ink shadow-card">
                  We had sweet tea
                </span>
                <span className="rounded-full border border-cream-deep bg-[#FFFDF9] px-4 py-2 font-semibold text-ink-muted shadow-card">
                  Tell me more
                </span>
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
      <section className="bg-brand-wash/60 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <LogoMark size={44} />
          <h2 className="mt-5 text-3xl">
            Built by a grandson, for his grandfather.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
            When my grandfather began losing his recent memories, I watched
            well-meaning questions — <em>&ldquo;Do you remember me?&rdquo;</em> —
            hurt him again and again. But when someone simply <em>shared</em> a
            memory, he would light up. Keepsake turns that lesson, and decades
            of dementia-care research, into a gentle daily ritual any family
            can keep: reminiscence without tests, validation without
            corrections, and music from the years he remembers best.
          </p>
        </div>
      </section>

      {/* --------------------------- how it works --------------------------- */}
      <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-8 px-6 py-16">
        <h2 className="text-center text-3xl">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Tell Keepsake their story',
              body: 'Add their name, the people they love, favorite songs, and the memories that make them smile. Five minutes is plenty to start.',
            },
            {
              step: '2',
              title: 'Hand over the tablet',
              body: 'Each day, Lane guides a short visit — a warm hello, a favorite song, one happy memory. Big buttons, calm pace, nothing to get wrong.',
            },
            {
              step: '3',
              title: 'See how it went',
              body: 'A gentle summary tells you their mood, what lit them up, and anything worth a closer look — never a memory score.',
            },
          ].map((item) => (
            <div key={item.step} className="card p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber text-xl font-bold text-ink">
                {item.step}
              </span>
              <h3 className="mt-4 text-xl">{item.title}</h3>
              <p className="mt-2 text-ink-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------- gentle by design ------------------------ */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="card p-8 md:p-10">
          <h2 className="text-3xl">Gentle by design</h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Every conversation follows rules drawn from clinical dementia-care
            practice — reminiscence therapy, validation, and errorless
            learning.
          </p>
          <div className="mt-8 grid gap-x-10 gap-y-5 md:grid-cols-2">
            {[
              ['Never quizzes', 'Lane never asks "do you remember?" — it shares the memory first and invites a feeling.'],
              ['Never corrects', 'Feelings are validated, facts are never argued. Lane meets your loved one wherever they are.'],
              ['Every answer is a win', 'Big tap-able choices instead of blank boxes, so there is nothing to get wrong.'],
              ['Rewards showing up', 'The daily streak celebrates the visit itself — memory is never scored or graded.'],
              ['Their music, their era', 'A favorite song from their youth is part of every visit — music reaches what facts cannot.'],
              ['Private by default', 'Profiles and visits live only on your device. No accounts, no cloud, no tracking.'],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-wash text-moss-deep"
                >
                  ✓
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-base text-ink-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ final CTA ---------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-20 text-center">
        <h2 className="text-3xl">Start their first visit today.</h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink-muted">
          Setup takes two minutes, and Keepsake is completely free — with or
          without an AI key.
        </p>
        <div className="mt-7">
          <Button size="lg" onClick={() => navigate(hasProfiles ? '/visit' : '/welcome')}>
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
            Reconnect. Remember. ·{' '}
            <Link to="/care" className="underline underline-offset-4">
              Caretaker area
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

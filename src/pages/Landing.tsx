import { useNavigate } from 'react-router-dom'
import { getProfiles } from '../lib/storage'

export default function Landing() {
  const navigate  = useNavigate()
  const profiles  = getProfiles()
  const hasProfiles = profiles.length > 0

  function startVisit() {
    if (profiles.length === 1) {
      navigate(`/checkin/${profiles[0].id}`)
    } else if (profiles.length > 1) {
      // Multiple profiles — go to caretaker to pick
      navigate('/caretaker')
    } else {
      navigate('/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand">Keepsake</span>
        </div>
        <button
          onClick={() => navigate('/caretaker')}
          className="btn-ghost text-base px-4 py-2 min-h-[40px]"
        >
          Caretaker Area
        </button>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
          <p className="text-brand font-semibold text-lg mb-3 tracking-wide uppercase text-sm">
            Reconnect. Remember.
          </p>
          <h1 className="text-5xl font-extrabold text-navy leading-tight mb-6">
            Help your loved one remember{' '}
            <span className="text-primary">the moments that matter.</span>
          </h1>
          <p className="text-xl text-navy/70 max-w-xl mx-auto mb-10 leading-relaxed">
            Keepsake is a gentle daily companion that uses AI-guided conversation
            to spark warm memories, lift mood, and keep families connected —
            all with a simple tap.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {hasProfiles ? (
              <>
                <button onClick={startVisit} className="btn-primary text-xl px-10 py-4">
                  Begin Today's Visit
                </button>
                <button onClick={() => navigate('/caretaker')} className="btn-ghost text-xl px-10 py-4">
                  Caretaker Area
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/onboarding')} className="btn-primary text-xl px-10 py-4">
                Get Started — It's Free
              </button>
            )}
          </div>

          {hasProfiles && profiles.length > 1 && (
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/checkin/${p.id}`)}
                  className="bg-white rounded-2xl px-5 py-3 border-2 border-brand/20 hover:border-brand transition-colors shadow-sm"
                >
                  <span className="font-semibold text-navy">{p.preferredName || p.name}</span>
                  {p.streak > 0 && (
                    <span className="ml-2 text-primary font-bold">🔥 {p.streak}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="bg-white/60 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  icon: '🖊️',
                  title: 'Set up a profile',
                  body: 'A caretaker takes 5 minutes to add your loved one's name, favourite music, key family members, and a few happy memories.',
                },
                {
                  step: '2',
                  icon: '💬',
                  title: 'Lane leads the conversation',
                  body: 'Each day, Lane — a warm AI companion — greets them by name, checks in on their mood, and guides a gentle themed conversation.',
                },
                {
                  step: '3',
                  icon: '📋',
                  title: 'Caretakers stay informed',
                  body: 'After every visit, Keepsake gives the caretaker a private summary: mood trends, engagement, highlights, and any moments to follow up on.',
                },
              ].map(item => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4 text-3xl">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-navy/70 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Origin story ──────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="bg-brand/5 rounded-3xl p-8 border border-brand/10">
            <p className="text-4xl mb-4">💙</p>
            <h2 className="text-2xl font-bold mb-4">Built by a grandson, for his grandfather.</h2>
            <p className="text-lg text-navy/70 leading-relaxed">
              Keepsake was born from a simple wish — to help a grandfather feel seen, heard, and
              connected, even on the harder days. Alzheimer's may change memory, but it doesn't
              change the capacity for joy, warmth, and love. Every feature in Keepsake was built
              with that belief at its core.
            </p>
          </div>
        </section>

        {/* ── Feature highlights ────────────────────────────────────────── */}
        <section className="bg-white/60 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-10">Designed for dignity</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { icon: '🧠', title: 'Evidence-based approach', body: 'Validation therapy, errorless learning, and spaced retrieval — built into every conversation.' },
                { icon: '🔒', title: 'Fully private', body: 'No accounts, no cloud database. Everything stays in your own browser. Your key, your data.' },
                { icon: '🎵', title: 'Music moments', body: 'Embed favourite YouTube songs directly into visits — music is one of the most powerful memory anchors.' },
                { icon: '📈', title: 'Mood tracking', body: 'Visualise mood and engagement trends over time to spot good days and share progress with healthcare providers.' },
                { icon: '🔥', title: 'Streak rewards showing up', body: 'The streak celebrates visiting every day — never whether they remembered correctly. No shame, ever.' },
                { icon: '🆓', title: 'Free without a key', body: 'Lane works with warm scripted conversations at no cost. Add your own Anthropic key for personalised AI.' },
              ].map(f => (
                <div key={f.title} className="flex gap-4 bg-white rounded-2xl p-5 shadow-sm border border-black/5">
                  <span className="text-2xl mt-0.5">{f.icon}</span>
                  <div>
                    <h4 className="font-semibold mb-1">{f.title}</h4>
                    <p className="text-navy/70 text-base leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        {!hasProfiles && (
          <section className="py-16 text-center px-6">
            <h2 className="text-3xl font-bold mb-4">Ready to begin?</h2>
            <p className="text-lg text-navy/70 mb-8">
              Set up takes about 5 minutes. No account, no payment required.
            </p>
            <button onClick={() => navigate('/onboarding')} className="btn-primary text-xl px-10 py-4">
              Create your first profile
            </button>
          </section>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-navy/10 py-8 px-6 text-center text-navy/50 text-sm">
        <p className="max-w-2xl mx-auto">
          <strong>Keepsake is a wellness companion, not a medical device.</strong>{' '}
          Always consult qualified healthcare providers regarding Alzheimer's care and treatment.
          Keepsake does not store any data outside your own device.
        </p>
        <p className="mt-3">
          Made with love. Bring Your Own Key —{' '}
          <span className="text-brand font-medium">you are never billed for others' use.</span>
        </p>
      </footer>
    </div>
  )
}

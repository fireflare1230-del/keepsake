import { useNavigate } from 'react-router-dom'
import { getProfiles } from '../lib/storage'
import BottomNav from '../components/BottomNav'

export default function Landing() {
  const navigate   = useNavigate()
  const profiles   = getProfiles()
  const hasProfiles = profiles.length > 0

  function startVisit() {
    if (profiles.length === 1) {
      navigate(`/checkin/${profiles[0].id}`)
    } else if (profiles.length > 1) {
      navigate('/caretaker')
    } else {
      navigate('/onboarding')
    }
  }

  // ── Welcome view (no profiles yet) ────────────────────────────────────────
  if (!hasProfiles) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
        <header className="bg-white px-5 py-4 flex items-center justify-between shadow-sm">
          <span className="font-bold text-navy text-xl tracking-tight">Keepsake</span>
          <button
            onClick={() => navigate('/caretaker')}
            className="text-sm text-navy/50 font-medium hover:text-navy"
          >
            Login
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          <div className="max-w-sm w-full">

            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-200 to-orange-300
                              mx-auto mb-6 flex items-center justify-center text-4xl shadow-md">
                💙
              </div>
              <h1 className="text-3xl font-extrabold text-navy leading-tight mb-3">
                Welcome to Keepsake
              </h1>
              <p className="text-navy/60 text-lg leading-relaxed">
                Help your loved one preserve their story through gentle AI conversations.
              </p>
            </div>

            <div className="space-y-4 mb-10">
              {[
                {
                  num: '1', icon: '🖊️', title: 'Add Patient Info',
                  body: 'Set up a profile for your loved one with basic context and happy memories.',
                },
                {
                  num: '2', icon: '📸', title: 'Share Key Memories',
                  body: 'Upload key memories and add family members to ground every conversation.',
                },
                {
                  num: '3', icon: '📱', title: 'Connect the App',
                  body: "Your loved one starts their daily gentle check-in — Lane will be there.",
                },
              ].map(s => (
                <div key={s.num} className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center
                                  text-primary font-extrabold text-lg shrink-0">
                    {s.num}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{s.icon}</span>
                      <h3 className="font-bold text-navy text-base">{s.title}</h3>
                    </div>
                    <p className="text-navy/60 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/onboarding')}
              className="btn-primary w-full text-xl py-4 rounded-2xl"
            >
              Get Started →
            </button>
            <p className="text-center text-navy/40 text-sm mt-4">
              Already set up?{' '}
              <button
                onClick={() => navigate('/caretaker')}
                className="text-brand font-semibold hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Home view (profiles exist) ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col pb-16">
      <header className="bg-white px-5 py-4 flex items-center justify-between shadow-sm">
        <span className="font-bold text-navy text-xl tracking-tight">Keepsake</span>
        <button
          onClick={() => navigate('/caretaker')}
          className="text-sm text-navy/50 font-medium hover:text-navy"
        >
          Caretaker Area
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-sm mx-auto w-full space-y-4">

        <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-300
                          mx-auto mb-4 flex items-center justify-center text-4xl shadow-sm">
            💙
          </div>
          <h2 className="text-2xl font-extrabold text-navy mb-1">Ready for today's visit?</h2>
          <p className="text-navy/55 text-base mb-5">Lane is waiting to chat.</p>
          <button onClick={startVisit} className="btn-primary w-full text-xl py-4 rounded-2xl">
            Begin Today's Visit
          </button>
        </div>

        {profiles.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-navy/40 uppercase tracking-widest px-1">Choose a profile</p>
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/checkin/${p.id}`)}
                className="w-full bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm border-2 border-transparent hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-xl">👤</div>
                  <span className="font-semibold text-navy text-lg">{p.preferredName || p.name}</span>
                </div>
                {p.streak > 0 && (
                  <span className="text-primary font-bold flex items-center gap-1">🔥 {p.streak}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-navy/40 uppercase tracking-widest mb-4">Designed for dignity</p>
          <div className="space-y-3">
            {[
              { icon: '🧠', label: 'Evidence-based conversations' },
              { icon: '🔒', label: 'All data stays on your device' },
              { icon: '🔥', label: 'Streaks reward showing up, not memory' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-navy/70 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-navy/35 text-xs pb-2 leading-relaxed px-2">
          Keepsake is a wellness companion, not a medical device.
          Your key, your data — you are never billed for others' use.
        </p>
      </div>

      <BottomNav profileId={profiles[0]?.id} />
    </div>
  )
}

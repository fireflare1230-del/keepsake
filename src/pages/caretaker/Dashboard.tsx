import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfiles, getVisitsForPatient } from '../../lib/storage'
import { getThemeById } from '../../lib/themes'
import { MoodTrendChart, EngagementChart } from '../../components/TrendChart'
import type { PatientProfile, Visit } from '../../types'

const MOOD_LABELS = ['','Not great','A little low','Okay','Pretty good','Wonderful!']
const MOOD_EMOJI  = ['','😔','😕','😊','😄','😁']

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-3 py-2 ${done ? 'text-success' : 'text-navy/70'}`}>
      <span className="text-xl">{done ? '✅' : '⬜'}</span>
      <span className={`text-base ${done ? 'line-through text-navy/40' : ''}`}>{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const navigate  = useNavigate()
  const profiles  = getProfiles()
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id ?? '')

  const profile = profiles.find(p => p.id === selectedId)
  const visits  = profile ? getVisitsForPatient(profile.id) : []
  const lastVisit: Visit | undefined = visits[0]

  if (profiles.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">👋</div>
        <h2 className="text-2xl font-bold mb-4">No profiles yet</h2>
        <p className="text-navy/60 mb-8">Create a profile to get started.</p>
        <button onClick={() => navigate('/onboarding')} className="btn-primary">
          Create first profile
        </button>
      </div>
    )
  }

  // Quick-start checklist
  const checklist = profile ? [
    { done: true,                                        label: 'Profile created' },
    { done: profile.familyPeople.length > 0,            label: 'Family members added' },
    { done: profile.favoriteMusic.length > 0,           label: 'Favourite music added' },
    { done: profile.lifeStory.length > 20,              label: 'Life story written' },
    { done: profile.gentleFactsToReinforce.length > 0,  label: 'Facts to gently reinforce added' },
  ] : []

  const checklistDone = checklist.every(c => c.done)

  return (
    <div className="space-y-6">

      {/* ── Profile switcher ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap gap-2 ml-auto">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={[
                'px-4 py-2 rounded-xl text-base font-medium border-2 transition-colors',
                p.id === selectedId
                  ? 'bg-brand/10 border-brand text-brand'
                  : 'bg-white border-navy/20 text-navy/70 hover:border-brand/40',
              ].join(' ')}
            >
              {p.preferredName || p.name}
              {p.streak > 0 && <span className="ml-1 text-primary">🔥{p.streak}</span>}
            </button>
          ))}
          <button
            onClick={() => navigate('/caretaker/profile/new')}
            className="px-4 py-2 rounded-xl text-base font-medium border-2 border-dashed border-navy/20 text-navy/50 hover:border-brand/40 transition-colors"
          >
            + Add profile
          </button>
        </div>
      </div>

      {profile && (
        <>
          {/* ── Action buttons ──────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/checkin/${profile.id}`)}
              className="btn-primary flex-1 text-lg"
            >
              ▶ Start today's visit
            </button>
            <button
              onClick={() => navigate(`/caretaker/profile/${profile.id}`)}
              className="btn-ghost flex-none text-lg"
            >
              ✏️ Edit profile
            </button>
            <button
              onClick={() => navigate(`/caretaker/visits/${profile.id}`)}
              className="btn-ghost flex-none text-lg"
            >
              📋 Visit log
            </button>
          </div>

          {/* ── Quick-start checklist ───────────────────────────────── */}
          {!checklistDone && (
            <div className="card">
              <h3 className="font-bold text-lg mb-3">Quick-start checklist</h3>
              {checklist.map(item => (
                <ChecklistItem key={item.label} done={item.done} label={item.label} />
              ))}
              <button
                onClick={() => navigate(`/caretaker/profile/${profile.id}`)}
                className="btn-secondary mt-4 w-full"
              >
                Complete profile →
              </button>
            </div>
          )}

          {/* ── Stats row ───────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Current streak',
                value: profile.streak > 0 ? `🔥 ${profile.streak}` : '—',
                sub: profile.streak === 1 ? 'day' : profile.streak > 1 ? 'days' : 'No visits yet',
              },
              {
                label: 'Total visits',
                value: visits.length.toString(),
                sub: 'all time',
              },
              {
                label: 'Last mood',
                value: lastVisit ? MOOD_EMOJI[lastVisit.mood] : '—',
                sub: lastVisit ? MOOD_LABELS[lastVisit.mood] : 'No visits yet',
              },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <p className="text-3xl font-extrabold text-navy">{s.value}</p>
                <p className="text-sm text-navy/60 mt-1">{s.sub}</p>
                <p className="text-xs text-navy/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Last visit summary ──────────────────────────────────── */}
          {lastVisit?.summary && (
            <div className="card border-l-4 border-brand">
              <h3 className="font-bold text-lg mb-3">Last visit summary</h3>
              <p className="text-navy/80 leading-relaxed mb-4">{lastVisit.summary.summary}</p>

              {lastVisit.summary.highlights.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-success mb-2">✨ Highlights</p>
                  <ul className="space-y-1">
                    {lastVisit.summary.highlights.map((h, i) => (
                      <li key={i} className="text-base text-navy/70 flex gap-2">
                        <span className="text-success mt-0.5">•</span>{h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lastVisit.summary.flags.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-danger mb-2">⚑ Flags</p>
                  <ul className="space-y-1">
                    {lastVisit.summary.flags.map((f, i) => (
                      <li key={i} className="text-base text-danger/80 flex gap-2">
                        <span className="mt-0.5">•</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-secondary/10 rounded-xl px-4 py-3 mt-2">
                <p className="text-sm font-semibold text-secondary mb-1">💚 For you, caretaker</p>
                <p className="text-base text-navy/70">{lastVisit.summary.encouragement}</p>
              </div>
            </div>
          )}

          {/* ── Theme of last visit ─────────────────────────────────── */}
          {lastVisit && (
            <p className="text-sm text-navy/40 text-center">
              Last visit: {new Date(lastVisit.date).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
              {' · '}{getThemeById(lastVisit.theme).icon} {getThemeById(lastVisit.theme).name} theme
              {' · '}Mood {MOOD_EMOJI[lastVisit.mood]}
            </p>
          )}

          {/* ── Trend charts ────────────────────────────────────────── */}
          {visits.length >= 2 && (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="card">
                <h3 className="font-bold mb-3">Mood trend</h3>
                <MoodTrendChart visits={visits} />
              </div>
              <div className="card">
                <h3 className="font-bold mb-3">Engagement</h3>
                <EngagementChart visits={visits} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

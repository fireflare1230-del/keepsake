import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfiles, getVisitsForPatient, SRT_INTERVALS_MIN } from '../../lib/storage'
import { getThemeById } from '../../lib/themes'
import { MoodTrendChart } from '../../components/TrendChart'
import type { PatientProfile, Visit, SRTTarget } from '../../types'

const MOOD_LABELS = ['','Not great','A little low','Okay','Pretty good','Wonderful!']
const MOOD_EMOJI  = ['','😔','😕','😊','😄','😁']

// Circular progress SVG for Memory Recall Strength
function CircleProgress({ pct, label }: { pct: number; label: string }) {
  const r = 36, cx = 44, cy = 44
  const circumference = 2 * Math.PI * r
  const dash = (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="#E8A04C" strokeWidth="8"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="#1A2332">
          {pct}%
        </text>
      </svg>
      <p className="text-xs text-navy/55 text-center leading-snug max-w-[100px]">{label}</p>
    </div>
  )
}

// Tag pill
function Tag({ label, variant = 'blue' }: { label: string; variant?: 'blue' | 'green' | 'amber' }) {
  const colours = {
    blue:  'bg-brand/10 text-brand',
    green: 'bg-success/10 text-success',
    amber: 'bg-primary/10 text-primary',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colours[variant]}`}>
      {label}
    </span>
  )
}

function getEngagementTag(engagement?: number): { label: string; variant: 'blue' | 'green' | 'amber' } {
  if (!engagement) return { label: 'Gentle Session', variant: 'blue' }
  if (engagement >= 4) return { label: 'High Engagement', variant: 'green' }
  if (engagement >= 3) return { label: 'Good Engagement', variant: 'blue' }
  return { label: 'Gentle Session', variant: 'amber' }
}

function getThemeTag(themeId: string): string {
  const t = getThemeById(themeId)
  return t?.name ?? 'Memory Chat'
}

// Compute memory recall strength from engagement scores
function recallStrength(visits: Visit[]): { pct: number; label: string } {
  if (visits.length === 0) return { pct: 0, label: 'No visits yet' }
  const recent = visits.slice(0, 10)
  const avg = recent.reduce((sum, v) => sum + (v.engagement ?? v.mood ?? 3), 0) / recent.length
  const pct = Math.round((avg / 5) * 100)
  if (pct >= 75) return { pct, label: 'Consistent recognition of family' }
  if (pct >= 50) return { pct, label: 'Good recall of recent memories' }
  return { pct, label: 'Gentle support recommended' }
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-3 py-1.5 ${done ? 'text-success' : 'text-navy/60'}`}>
      <span className="text-lg">{done ? '✅' : '⬜'}</span>
      <span className={`text-sm ${done ? 'line-through text-navy/35' : ''}`}>{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const navigate   = useNavigate()
  const profiles   = getProfiles()
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id ?? '')

  const profile   = profiles.find(p => p.id === selectedId)
  const visits    = profile ? getVisitsForPatient(profile.id) : []
  const lastVisit: Visit | undefined = visits[0]

  if (profiles.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <div className="text-6xl mb-4">👋</div>
        <h2 className="text-2xl font-bold mb-4">No profiles yet</h2>
        <p className="text-navy/60 mb-8">Create a profile to get started.</p>
        <button onClick={() => navigate('/onboarding')} className="btn-primary rounded-2xl">
          Create first profile
        </button>
      </div>
    )
  }

  const checklist = profile ? [
    { done: true,                                        label: 'Profile created' },
    { done: profile.familyPeople.length > 0,            label: 'Family members added' },
    { done: profile.favoriteMusic.length > 0,           label: 'Favourite music added' },
    { done: profile.lifeStory.length > 20,              label: 'Life story written' },
    { done: profile.gentleFactsToReinforce.length > 0,  label: 'Facts to reinforce added' },
  ] : []
  const checklistDone = checklist.every(c => c.done)

  const { pct: recallPct, label: recallLabel } = recallStrength(visits)
  const moodUp = visits.length >= 2
    ? Math.round(((visits[0].mood - visits[visits.length - 1].mood) / 5) * 100)
    : 0

  return (
    <div className="space-y-4">

      {/* ── Profile switcher ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={[
              'px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors',
              p.id === selectedId
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-white border-navy/15 text-navy/60 hover:border-primary/40',
            ].join(' ')}
          >
            {p.preferredName || p.name}
            {p.streak > 0 && <span className="ml-1">🔥{p.streak}</span>}
          </button>
        ))}
        <button
          onClick={() => navigate('/caretaker/profile/new')}
          className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-navy/20 text-navy/45 hover:border-primary/40"
        >
          + Add profile
        </button>
      </div>

      {profile && (
        <>
          {/* ── Patient overview header ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-navy/40 uppercase tracking-widest mb-3">Patient Overview</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-300
                              flex items-center justify-center text-2xl shadow-sm shrink-0">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-navy truncate">{profile.name}</p>
                {profile.birthYear && (
                  <p className="text-sm text-navy/50">
                    {new Date().getFullYear() - profile.birthYear} years old
                    {profile.hometown ? ` · ${profile.hometown}` : ''}
                  </p>
                )}
                {profile.streak > 0 && (
                  <p className="text-sm text-primary font-semibold mt-0.5">🔥 {profile.streak}-day streak</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/checkin/${profile.id}`)}
                  className="btn-primary text-sm px-4 py-2 rounded-xl"
                >
                  ▶ Start visit
                </button>
              </div>
            </div>
          </div>

          {/* ── Action row ──────────────────────────────────────────────── */}
          <div className="flex gap-2">
            <button onClick={() => navigate(`/caretaker/profile/${profile.id}`)} className="btn-ghost flex-1 text-base rounded-xl py-2">
              ✏️ Edit Profile
            </button>
            <button onClick={() => navigate(`/caretaker/visits/${profile.id}`)} className="btn-ghost flex-1 text-base rounded-xl py-2">
              📋 Visit Log
            </button>
          </div>

          {/* ── Checklist ───────────────────────────────────────────────── */}
          {!checklistDone && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm text-navy/60 uppercase tracking-widest mb-3">Quick-start checklist</h3>
              {checklist.map(item => (
                <ChecklistItem key={item.label} done={item.done} label={item.label} />
              ))}
              <button
                onClick={() => navigate(`/caretaker/profile/${profile.id}`)}
                className="btn-primary mt-4 w-full text-base rounded-xl py-2"
              >
                Complete profile →
              </button>
            </div>
          )}

          {/* ── Mood trend + Memory recall ───────────────────────────────── */}
          {visits.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm text-navy">Recent Mood Trends</h3>
                  {moodUp !== 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${moodUp > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {moodUp > 0 ? '+' : ''}{moodUp}% Uplift
                    </span>
                  )}
                </div>
                <p className="text-xs text-navy/40 mb-3">Real {Math.min(visits.length, 7)} days</p>
                <MoodTrendChart visits={visits} />
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center gap-2">
                <h3 className="font-bold text-sm text-navy self-start w-full mb-2">Memory Recall Strength</h3>
                <CircleProgress pct={recallPct} label={recallLabel} />
              </div>
            </div>
          )}

          {/* ── Latest session ──────────────────────────────────────────── */}
          {lastVisit && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-navy">Latest Session</h3>
                <span className="text-xs text-navy/40">
                  {new Date(lastVisit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                  {new Date(lastVisit.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{MOOD_EMOJI[lastVisit.mood]}</span>
                <span className="text-sm text-navy/60 font-medium">{MOOD_LABELS[lastVisit.mood]}</span>
              </div>

              {lastVisit.summary ? (
                <>
                  <p className="text-sm text-navy/70 leading-relaxed mb-3 line-clamp-3">
                    {lastVisit.summary.summary}
                  </p>
                  {lastVisit.summary.encouragement && (
                    <div className="bg-secondary/10 rounded-xl px-3 py-2 mb-3">
                      <p className="text-xs text-secondary font-semibold mb-0.5">💚 For you</p>
                      <p className="text-xs text-navy/65 leading-relaxed">{lastVisit.summary.encouragement}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-navy/50 italic mb-3">No AI summary — add an API key in Settings to enable summaries.</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Tag {...getEngagementTag(lastVisit.engagement)} />
                <Tag label={getThemeTag(lastVisit.theme)} variant="blue" />
                {lastVisit.summary?.highlights && lastVisit.summary.highlights.length > 0 && (
                  <Tag label="✨ Has highlights" variant="green" />
                )}
              </div>
            </div>
          )}

          {/* ── Session History ──────────────────────────────────────────── */}
          {visits.length > 1 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm text-navy mb-4">Session History</h3>
              <div className="space-y-4">
                {visits.slice(0, 5).map((v, i) => {
                  const snippet = v.transcript.find(m => m.role === 'patient')?.content
                  return (
                    <div key={v.id} className={`${i < visits.slice(0, 5).length - 1 ? 'pb-4 border-b border-navy/8' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-navy/40">
                          {new Date(v.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <div className="flex gap-1">
                          <Tag {...getEngagementTag(v.engagement)} />
                        </div>
                      </div>
                      {snippet && (
                        <p className="text-sm text-navy/65 italic leading-relaxed line-clamp-2">
                          "{snippet}"
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => navigate(`/caretaker/visits/${profile.id}`)}
                className="w-full mt-4 text-brand font-semibold text-sm py-2 hover:underline"
              >
                View Full History →
              </button>
            </div>
          )}

          {/* ── Memory Targets (SRT) ────────────────────────────────────── */}
          {((profile.srtTargets ?? []).length > 0) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm text-navy mb-4">Memory Targets
                <span className="ml-2 text-xs font-normal text-navy/40">Spaced Retrieval Training</span>
              </h3>
              <div className="space-y-3">
                {(profile.srtTargets ?? []).filter(t => !t.learnedAt).map((t: SRTTarget) => {
                  const intervalLabel = [
                    '1 min','2 min','4 min','8 min','1 day','2 days','1 week',
                  ][Math.min(t.currentIntervalIdx, 6)]
                  return (
                    <div key={t.id} className="flex items-center gap-3 bg-brand/5 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy">{t.prompt}</p>
                        <p className="text-sm text-brand font-bold">→ {t.answer}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-navy/60 font-medium">Interval: {intervalLabel}</p>
                        <p className="text-xs text-success font-semibold">
                          {'★'.repeat(t.consecutiveCorrect)}{'☆'.repeat(Math.max(0, 3 - t.consecutiveCorrect))}
                          {' '}{t.consecutiveCorrect}/3 correct
                        </p>
                      </div>
                    </div>
                  )
                })}
                {(profile.srtTargets ?? []).filter(t => !!t.learnedAt).map((t: SRTTarget) => (
                  <div key={t.id} className="flex items-center gap-3 bg-success/5 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy/50 line-through">{t.prompt}</p>
                      <p className="text-sm text-success font-bold">✓ Learned: {t.answer}</p>
                    </div>
                    <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-semibold shrink-0">Retired</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Stats strip ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Streak',  value: profile.streak > 0 ? `🔥 ${profile.streak}` : '—', sub: profile.streak > 0 ? 'days' : 'No visits yet' },
              { label: 'Visits',  value: visits.length.toString(), sub: 'all time' },
              { label: 'Last mood', value: lastVisit ? MOOD_EMOJI[lastVisit.mood] : '—', sub: lastVisit ? MOOD_LABELS[lastVisit.mood] : 'No visits yet' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-navy">{s.value}</p>
                <p className="text-xs text-navy/50 mt-0.5">{s.sub}</p>
                <p className="text-xs text-navy/30 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

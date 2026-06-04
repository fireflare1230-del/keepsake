import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVisitsForPatient, getProfile } from '../../lib/storage'
import { getThemeById } from '../../lib/themes'
import type { Visit } from '../../types'

const MOOD_EMOJI  = ['','😔','😕','😊','😄','😁']
const MOOD_LABEL  = ['','Not great','A little low','Okay','Pretty good','Wonderful!']

function EngagementDots({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1,2,3,4,5].map(n => (
        <div
          key={n}
          className={`w-2.5 h-2.5 rounded-full ${n <= score ? 'bg-success' : 'bg-navy/10'}`}
        />
      ))}
      <span className="text-sm text-navy/50 ml-1">{score}/5</span>
    </div>
  )
}

function VisitCard({ visit, name }: { visit: Visit; name: string }) {
  const [open, setOpen] = useState(false)
  const theme = getThemeById(visit.theme)
  const d     = new Date(visit.date)

  return (
    <div className="card">
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-4 text-left"
      >
        <div className="min-w-[60px] text-center">
          <p className="text-3xl">{MOOD_EMOJI[visit.mood]}</p>
          <p className="text-xs text-navy/50 mt-1">{MOOD_LABEL[visit.mood]}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">
            {d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
          </p>
          <p className="text-sm text-navy/50 mt-0.5">
            {theme.icon} {theme.name} · {visit.transcript.length} messages
            {visit.engagement != null && (
              <span className="ml-2 inline-flex items-center gap-1">
                · Engagement: <EngagementDots score={visit.engagement} />
              </span>
            )}
          </p>
        </div>
        <span className="text-navy/30 text-xl shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {/* Summary */}
      {open && (
        <div className="mt-4 pt-4 border-t border-navy/10">
          {visit.summary && (
            <div className="mb-4 bg-brand/5 rounded-xl p-4">
              <p className="font-semibold text-sm text-brand mb-1">AI Summary</p>
              <p className="text-base text-navy/80">{visit.summary.summary}</p>
              {visit.summary.highlights.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-success mb-1">Highlights</p>
                  <ul className="space-y-0.5">
                    {visit.summary.highlights.map((h,i) => <li key={i} className="text-sm text-navy/70">• {h}</li>)}
                  </ul>
                </div>
              )}
              {visit.summary.flags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-danger mb-1">Flags</p>
                  <ul className="space-y-0.5">
                    {visit.summary.flags.map((f,i) => <li key={i} className="text-sm text-danger/70">• {f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Transcript */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {visit.transcript.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'patient' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'lane' && (
                  <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">L</div>
                )}
                <div
                  className={[
                    'rounded-xl px-3 py-2 text-sm max-w-[80%]',
                    msg.role === 'lane'
                      ? 'bg-white border border-navy/10 text-navy'
                      : 'bg-primary/10 text-navy',
                  ].join(' ')}
                >
                  {msg.role === 'patient' && <p className="text-xs font-semibold text-primary mb-0.5">{name}</p>}
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CSV and JSON export ──────────────────────────────────────────────────────
function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function exportJson(visits: Visit[], name: string) {
  downloadFile(JSON.stringify(visits, null, 2), `keepsake-${name.replace(/\s+/g,'-')}.json`, 'application/json')
}

function exportCsv(visits: Visit[], name: string) {
  const rows = [
    ['Date','Mood','Theme','Engagement','Summary','Transcript'].join(','),
    ...visits.map(v => [
      new Date(v.date).toLocaleDateString(),
      v.mood,
      getThemeById(v.theme).name,
      v.engagement ?? '',
      `"${(v.summary?.summary ?? '').replace(/"/g,'""')}"`,
      `"${v.transcript.map(m => `${m.role}: ${m.content}`).join(' | ').replace(/"/g,'""')}"`,
    ].join(',')),
  ]
  downloadFile(rows.join('\n'), `keepsake-${name.replace(/\s+/g,'-')}.csv`, 'text/csv')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VisitLog() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate      = useNavigate()
  const profile       = getProfile(profileId ?? '')
  const visits        = profile ? getVisitsForPatient(profile.id) : []

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-navy/40 mb-4">Profile not found.</p>
        <button onClick={() => navigate('/caretaker')} className="btn-ghost">← Back</button>
      </div>
    )
  }

  const name = profile.preferredName || profile.name

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Visit log — {name}</h1>
        <button onClick={() => navigate('/caretaker')} className="btn-ghost text-base px-4 py-2 min-h-0">
          ← Dashboard
        </button>
      </div>

      {visits.length > 0 && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => exportJson(visits, name)}
            className="btn-ghost text-base px-4 py-2 min-h-0"
          >
            ⬇ Export JSON
          </button>
          <button
            onClick={() => exportCsv(visits, name)}
            className="btn-ghost text-base px-4 py-2 min-h-0"
          >
            ⬇ Export CSV
          </button>
        </div>
      )}

      {visits.length === 0 ? (
        <div className="text-center py-20 text-navy/40">
          <p className="text-5xl mb-4">📋</p>
          <p>No visits recorded yet.</p>
          <button
            onClick={() => navigate(`/checkin/${profile.id}`)}
            className="btn-primary mt-6"
          >
            Start first visit
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map(v => <VisitCard key={v.id} visit={v} name={name} />)}
        </div>
      )}
    </div>
  )
}

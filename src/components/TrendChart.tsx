// Mood and engagement trend charts for the caretaker dashboard
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'
import type { Visit } from '../types'

interface Props {
  visits: Visit[];
  maxPoints?: number;
}

export function MoodTrendChart({ visits, maxPoints = 10 }: Props) {
  const data = visits
    .slice(0, maxPoints)
    .reverse()
    .map(v => ({
      date: new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: v.mood,
    }))

  if (data.length < 2) {
    return <EmptyChart label="Need at least 2 visits to show a mood trend." />
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1A233210" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#1A2332aa' }} />
        <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 12, fill: '#1A2332aa' }} />
        <Tooltip
          formatter={(v: number) => [['😔','😕','😊','😄','😁'][v-1] + ' ' + v, 'Mood']}
          contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }}
        />
        <Line
          type="monotone"
          dataKey="mood"
          stroke="#5E93AC"
          strokeWidth={2.5}
          dot={{ fill: '#5E93AC', r: 5 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function EngagementChart({ visits, maxPoints = 10 }: Props) {
  const data = visits
    .filter(v => v.engagement != null)
    .slice(0, maxPoints)
    .reverse()
    .map(v => ({
      date: new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      engagement: v.engagement,
    }))

  if (data.length < 1) {
    return <EmptyChart label="Engagement data appears after AI visits." />
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1A233210" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#1A2332aa' }} />
        <YAxis domain={[0, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 12, fill: '#1A2332aa' }} />
        <Tooltip
          formatter={(v: number) => [v + '/5', 'Engagement']}
          contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }}
        />
        <Bar dataKey="engagement" fill="#8FB39A" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-[180px] rounded-xl bg-navy/5 text-navy/50 text-sm text-center px-4">
      {label}
    </div>
  )
}

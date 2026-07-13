import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/**
 * A calm single-series trend line (mood or engagement over recent visits).
 * Chart colors validated for contrast/CVD on the card surface; grid and
 * axes stay recessive; identity comes from the card title, so no legend.
 */

export interface TrendPoint {
  label: string // short date, e.g. "Jul 4"
  value: number // 1-5
}

export default function TrendChart({
  data,
  color,
  formatValue,
}: {
  data: TrendPoint[]
  color: string
  /** Turns 1-5 into a friendly word for ticks & tooltip, e.g. "Good 🙂". */
  formatValue: (value: number) => string
}) {
  return (
    <div className="h-56 w-full" aria-hidden={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="#EAE1D3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 14, fill: '#5D6A7E' }}
            axisLine={{ stroke: '#EAE1D3' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 13, fill: '#5D6A7E' }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <Tooltip
            cursor={{ stroke: '#EAE1D3', strokeWidth: 1.5 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const value = payload[0].value as number
              return (
                <div className="rounded-lg border border-cream-deep bg-[#FFFDF9] px-4 py-2.5 text-base shadow-card">
                  <span className="font-semibold">{formatValue(value)}</span>
                  <span className="ml-2 text-ink-faint">{label}</span>
                </div>
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 5, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 7, fill: color, stroke: '#FFFDF9', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

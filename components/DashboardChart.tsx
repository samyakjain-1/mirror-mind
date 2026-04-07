'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  score: number
  riskLevel: string
  dominantPattern?: string
}

function riskColor(level: string) {
  if (level === 'high') return 'var(--risk-high)'
  if (level === 'medium') return 'var(--risk-medium)'
  return 'var(--risk-low)'
}
function riskBg(level: string) {
  if (level === 'high') return 'var(--risk-high-bg)'
  if (level === 'medium') return 'var(--risk-medium-bg)'
  return 'var(--risk-low-bg)'
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ payload: DataPoint }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg px-4 py-3 min-w-[160px]" style={{ fontFamily: 'var(--font-sans)' }}>
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-2xl font-semibold leading-none mb-1 tabular-nums" style={{ color: riskColor(d.riskLevel) }}>
        {d.score}
      </p>
      {d.dominantPattern && <p className="text-xs text-[var(--text-secondary)] capitalize">{d.dominantPattern}</p>}
      <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-[11px] font-medium capitalize" style={{ background: riskBg(d.riskLevel), color: riskColor(d.riskLevel) }}>
        {d.riskLevel} risk
      </span>
    </div>
  )
}

export default function DashboardChart({ data, height }: { data: DataPoint[]; height?: number }) {
  return (
    <div style={{ height: height ?? undefined }} className={height ? '' : 'h-[200px] sm:h-[280px]'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C96442" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#C96442" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={40} stroke="var(--text-muted)" strokeDasharray="4 4"
            label={{ value: 'Moderate', fill: 'var(--text-muted)', fontSize: 11, dx: 4 }}
          />
          <ReferenceLine y={65} stroke="var(--risk-high)" strokeDasharray="4 4" strokeOpacity={0.5}
            label={{ value: 'Elevated', fill: 'var(--risk-high)', fontSize: 11, dx: 4 }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#C96442"
            strokeWidth={2}
            fill="url(#scoreGradient)"
            dot={{ fill: '#fff', stroke: '#C96442', strokeWidth: 2, r: 4 }}
            activeDot={{ fill: '#C96442', stroke: '#fff', strokeWidth: 2, r: 6 }}
            animationDuration={1000}
            animationEasing="ease-out"
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

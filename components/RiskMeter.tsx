'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getColor(score: number): string {
  if (score <= 40) return 'var(--risk-low)'       // green
  if (score <= 65) return 'var(--risk-medium)'    // amber
  return 'var(--risk-high)'                        // red
}

function getLabel(score: number): string {
  if (score <= 40) return 'Low Signal'
  if (score <= 65) return 'Moderate Signal'
  return 'Elevated Signal'
}

// Interpolate between two hex colors at a ratio 0-1
function lerpColor(a: string, b: string, t: number): string {
  const hex = (h: string) => parseInt(h, 16)
  const parse = (c: string) => {
    const m = c.replace('#', '')
    return [hex(m.slice(0, 2)), hex(m.slice(2, 4)), hex(m.slice(4, 6))]
  }

  // Only works with hex colours — fall back to CSS var directly if not hex
  if (!a.startsWith('#') || !b.startsWith('#')) return t < 0.5 ? a : b
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${bl})`
}

// Gradient fill: green → amber (0-40→40-65) → red (65-100)
function gradientColor(score: number): string {
  if (score <= 40) {
    return lerpColor('#4A7C59', '#C4863A', score / 40)
  }
  if (score <= 65) {
    return lerpColor('#C4863A', '#B84040', (score - 40) / 25)
  }
  return '#B84040'
}

// ─── Component ───────────────────────────────────────────────────────────────

interface RiskMeterProps {
  score: number
  /** Delay before the fill animation starts (seconds) */
  delay?: number
}

export default function RiskMeter({ score, delay = 0 }: RiskMeterProps) {
  const clampedScore = Math.max(0, Math.min(100, score))
  const color = getColor(clampedScore)
  const fillColor = gradientColor(clampedScore)
  const label = getLabel(clampedScore)

  // Track rendered width of bar so we can position the score label
  const barRef = useRef<HTMLDivElement>(null)
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    if (!barRef.current) return
    const ro = new ResizeObserver(() => {
      setBarWidth(barRef.current?.offsetWidth ?? 0)
    })
    ro.observe(barRef.current)
    setBarWidth(barRef.current.offsetWidth)
    return () => ro.disconnect()
  }, [])

  const fillPx = (clampedScore / 100) * barWidth

  return (
    <div className="w-full space-y-1" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Score label — slides to fill position */}
      <div className="relative h-6">
        <motion.div
          className="absolute -translate-x-1/2"
          initial={{ left: '0%' }}
          animate={{ left: barWidth ? `${fillPx}px` : `${clampedScore}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        >
          <span
            className="text-sm font-semibold leading-none"
            style={{ color, fontFamily: 'var(--font-serif)' }}
          >
            {clampedScore}
          </span>
        </motion.div>
      </div>

      {/* Bar */}
      <div
        ref={barRef}
        className="relative h-2.5 w-full rounded-full overflow-hidden"
        style={{ background: 'var(--border)' }}
        role="progressbar"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Risk score: ${clampedScore} — ${label}`}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: fillColor }}
          initial={{ width: '0%' }}
          animate={{ width: `${clampedScore}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>

      {/* Label */}
      <p className="text-xs text-[var(--text-muted)]" style={{ color }}>
        {label}
      </p>
    </div>
  )
}

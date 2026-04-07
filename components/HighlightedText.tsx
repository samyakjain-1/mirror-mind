'use client'

import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Highlight } from '@/lib/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  Highlight['category'],
  { underline: string; tooltipBg: string; label: string }
> = {
  hopelessness: {
    underline: '#B84040',
    tooltipBg: '#FAECEC',
    label: 'Hopelessness language',
  },
  isolation: {
    underline: '#3A6EA8',
    tooltipBg: '#EAF0FA',
    label: 'Isolation marker',
  },
  'self-focus': {
    underline: '#C4863A',
    tooltipBg: '#FDF3E7',
    label: 'Self-focus pattern',
  },
  'negative-emotion': {
    underline: '#7B5EA8',
    tooltipBg: '#F0EAFA',
    label: 'Negative emotion',
  },
}

// ─── Segment builder ─────────────────────────────────────────────────────────
// Converts a flat list of highlights into non-overlapping character segments.

type Segment =
  | { kind: 'plain'; text: string }
  | { kind: 'highlight'; text: string; highlight: Highlight }

function buildSegments(text: string, highlights: Highlight[]): Segment[] {
  if (!highlights.length) return [{ kind: 'plain', text }]

  // Sort by start, then resolve overlaps greedily (first one wins)
  const sorted = [...highlights].sort((a, b) => a.startIndex - b.startIndex)

  const merged: Highlight[] = []
  let cursor = 0
  for (const h of sorted) {
    const start = Math.max(h.startIndex, cursor)
    if (start >= h.endIndex) continue   // fully overlapped, skip
    merged.push({ ...h, startIndex: start })
    cursor = h.endIndex
  }

  const segments: Segment[] = []
  let pos = 0
  for (const h of merged) {
    if (h.startIndex > pos) {
      segments.push({ kind: 'plain', text: text.slice(pos, h.startIndex) })
    }
    segments.push({ kind: 'highlight', text: text.slice(h.startIndex, h.endIndex), highlight: h })
    pos = h.endIndex
  }
  if (pos < text.length) {
    segments.push({ kind: 'plain', text: text.slice(pos) })
  }
  return segments
}

// ─── Highlighted span ─────────────────────────────────────────────────────────

function HighlightSpan({
  text,
  highlight,
  tooltipId,
}: {
  text: string
  highlight: Highlight
  tooltipId: string
}) {
  const [visible, setVisible] = useState(false)
  const cfg = CATEGORY_CONFIG[highlight.category]

  return (
    <span className="relative inline">
      <span
        role="mark"
        tabIndex={0}
        aria-describedby={tooltipId}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="relative cursor-default rounded-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{
          textDecoration: `underline 2px ${cfg.underline}`,
          textUnderlineOffset: '3px',
          backgroundColor: visible ? cfg.tooltipBg + 'AA' : 'transparent',
        }}
      >
        {text}
      </span>

      <AnimatePresence>
        {visible && (
          <motion.span
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-md"
            style={{
              backgroundColor: cfg.tooltipBg,
              color: cfg.underline,
              border: `1px solid ${cfg.underline}33`,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {cfg.label}
            {/* Arrow */}
            <span
              className="absolute top-full left-1/2 -translate-x-1/2 -mt-px"
              style={{
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `5px solid ${cfg.tooltipBg}`,
              }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

// ─── Public component ────────────────────────────────────────────────────────

export default function HighlightedText({
  text,
  highlights,
}: {
  text: string
  highlights: Highlight[]
}) {
  const baseId = useId()
  const segments = buildSegments(text, highlights)

  return (
    <span
      className="text-[var(--text-primary)] leading-relaxed"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {segments.map((seg, i) =>
        seg.kind === 'plain' ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <HighlightSpan
            key={i}
            text={seg.text}
            highlight={seg.highlight}
            tooltipId={`${baseId}-tooltip-${i}`}
          />
        )
      )}
    </span>
  )
}

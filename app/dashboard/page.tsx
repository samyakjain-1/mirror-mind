'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Minus,
  PlusCircle, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { demoEntries } from '@/lib/demo-data'
import { TrendSkeleton } from '@/components/AnalyzingSkeleton'
import EmptyState from '@/components/EmptyState'
import DemoController from '@/components/DemoController'
import type { JournalEntry, Highlight, TrendInsight } from '@/lib/types'

const DashboardChart = dynamic(() => import('@/components/DashboardChart'), {
  ssr: false,
  loading: () => <div className="h-[200px] sm:h-[280px] flex items-center justify-center"><span className="text-xs text-[var(--text-muted)]">Loading chart…</span></div>,
})

// ─── Helpers ────────────────────────────────────────────────────────────────

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
function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const HIGHLIGHT_STYLES: Record<Highlight['category'], { bg: string; color: string }> = {
  hopelessness:      { bg: '#FAECEC', color: '#B84040' },
  isolation:         { bg: '#EAF0FA', color: '#3B6CB7' },
  'self-focus':      { bg: '#FDF3E7', color: '#C4863A' },
  'negative-emotion':{ bg: '#F0EAFA', color: '#7B52A8' },
}

// ─── Animated score counter ──────────────────────────────────────────────────

function CountUp({ to, duration = 700 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(to)
  const prev = useRef(to)

  useEffect(() => {
    const start = prev.current
    const end = to
    if (start === end) return
    prev.current = to
    const t0 = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(start + (end - start) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])

  return <>{val}</>
}

// ─── Trend card ──────────────────────────────────────────────────────────────

function TrendCard({ insight, trendKey }: { insight: TrendInsight; trendKey: number }) {
  const isImproving = insight.direction === 'improving'
  const isDeclining = insight.direction === 'declining'
  const Icon = isDeclining ? TrendingUp : isImproving ? TrendingDown : Minus
  const directionColor = isDeclining ? 'var(--risk-high)' : isImproving ? 'var(--risk-low)' : 'var(--risk-medium)'
  const directionBg   = isDeclining ? 'var(--risk-high-bg)' : isImproving ? 'var(--risk-low-bg)' : 'var(--risk-medium-bg)'
  const label = isDeclining ? 'Declining' : isImproving ? 'Improving' : 'Stable'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={trendKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center"
      >
        <div className="flex sm:flex-col items-center gap-3 sm:gap-2 shrink-0">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: directionBg }}>
            <Icon size={28} style={{ color: directionColor }} strokeWidth={2} />
          </div>
          <span className="text-sm font-semibold" style={{ color: directionColor }}>{label}</span>
        </div>
        <div className="hidden sm:block h-12 w-px bg-[var(--border)] shrink-0" />
        <div className="space-y-2 min-w-0">
          <p className="text-[var(--text-primary)] text-sm" style={{ lineHeight: '1.7' }}>{insight.summary}</p>
          <p className="text-[var(--text-secondary)] text-sm italic" style={{ lineHeight: '1.7' }}>
            &ldquo;{insight.keyChange}&rdquo;
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Entry card ──────────────────────────────────────────────────────────────

const EntryCard = memo(function EntryCard({ entry, index, isNew }: { entry: JournalEntry; index: number; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={isNew ? { x: 60, opacity: 0 } : { y: 16, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={isNew
        ? { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
        : { duration: 0.35, delay: index * 0.04, ease: 'easeOut' }
      }
      whileHover={{ scale: 1.01 }}
      className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200 cursor-default"
      style={{ borderLeft: `4px solid ${riskColor(entry.riskLevel)}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-[var(--text-primary)]">
          {formatDate(entry.date)}
        </span>
        <span
          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize badge-bounce tabular-nums"
          style={{ background: riskBg(entry.riskLevel), color: riskColor(entry.riskLevel) }}
        >
          {entry.riskLevel} &middot; <CountUp to={entry.score} />
        </span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: riskColor(entry.riskLevel) }}
          initial={{ width: 0 }}
          animate={{ width: `${entry.score}%` }}
          transition={{ duration: isNew ? 0.8 : 0.6, delay: isNew ? 0.15 : index * 0.04 + 0.1, ease: 'easeOut' }}
        />
      </div>

      {/* Text */}
      <p
        className="text-sm text-[var(--text-secondary)]"
        style={{
          lineHeight: '1.7',
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 3,
          WebkitBoxOrient: 'vertical',
          overflow: expanded ? 'visible' : 'hidden',
        }}
      >
        {entry.text}
      </p>

      {/* Highlights */}
      {entry.highlights.length > 0 && (
        <AnimatePresence initial={false}>
          {(expanded || entry.highlights.length <= 2) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-1.5"
            >
              {entry.highlights.map((h, i) => {
                const s = HIGHLIGHT_STYLES[h.category]
                return (
                  <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: s.bg, color: s.color }}>
                    {h.phrase}
                  </span>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {(entry.text.length > 140 || entry.highlights.length > 2) && (
        <button
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide full analysis' : 'Show full analysis'}
          className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors self-start min-h-[44px]"
        >
          {expanded ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
          {expanded ? 'Hide analysis' : 'Show analysis'}
        </button>
      )}
    </motion.div>
  )
})

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { entries, addEntry, resetEntries } = useStore()
  const [trendInsight, setTrendInsight] = useState<TrendInsight | null>(null)
  const [trendLoading, setTrendLoading] = useState(false)
  const [trendKey, setTrendKey] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set())
  const [isPresentationMode, setIsPresentationMode] = useState(false)

  const suppressTrendRef = useRef(false)
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const chartData = sorted.map(e => ({
    date: formatDate(e.date),
    score: e.score,
    riskLevel: e.riskLevel,
    dominantPattern: (e as JournalEntry & { dominantPattern?: string }).dominantPattern,
  }))

  // ── Presentation mode (press P) ──────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'p' || e.key === 'P') {
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
        setIsPresentationMode(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.setAttribute('data-presentation', String(isPresentationMode))
  }, [isPresentationMode])

  // ── Trend fetch ───────────────────────────────────────────────────────────
  const entryKey = sorted.map(e => e.id).join(',')

  const fetchTrend = useCallback(async (entriesList: JournalEntry[]) => {
    if (entriesList.length === 0 || suppressTrendRef.current) return
    setTrendLoading(true)
    try {
      const res = await fetch('/api/trend-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: entriesList }),
      })
      setTrendInsight(await res.json())
      setTrendKey(k => k + 1)
    } catch {
      setTrendInsight({ summary: 'Your patterns have been consistent over this period.', direction: 'stable', keyChange: 'Language patterns remain relatively unchanged.' })
    } finally {
      setTrendLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!suppressTrendRef.current) {
      fetchTrend(sorted)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryKey])

  // ── Demo controls ─────────────────────────────────────────────────────────
  function stopPlay() {
    if (playTimerRef.current) clearTimeout(playTimerRef.current)
    setIsPlaying(false)
    suppressTrendRef.current = false
  }

  function handleResetToDay1() {
    stopPlay()
    setNewEntryIds(new Set())
    resetEntries([demoEntries[0]])
    setTrendInsight(null)
  }

  function handlePlay() {
    stopPlay()
    setNewEntryIds(new Set())
    resetEntries([])
    setTrendInsight(null)
    suppressTrendRef.current = true
    setIsPlaying(true)

    let i = 0
    function addNext() {
      if (i >= demoEntries.length) {
        setIsPlaying(false)
        suppressTrendRef.current = false
        // Final trend fetch after all entries are in
        fetchTrend(demoEntries)
        return
      }
      const entry = demoEntries[i]
      setNewEntryIds(prev => new Set([...prev, entry.id]))
      addEntry(entry)
      i++
      playTimerRef.current = setTimeout(addNext, 800)
    }
    playTimerRef.current = setTimeout(addNext, 300)
  }

  function handleJumpToDay14() {
    stopPlay()
    setNewEntryIds(new Set())
    resetEntries(demoEntries)
  }

  function handleClearAll() {
    stopPlay()
    setNewEntryIds(new Set())
    resetEntries([])
    setTrendInsight(null)
  }

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => { if (playTimerRef.current) clearTimeout(playTimerRef.current) }, [])

  if (entries.length === 0 && !isPlaying) {
    return (
      <motion.div className="min-h-screen bg-[var(--background)]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <EmptyState />
        <DemoController isPlaying={false} onResetToDay1={handleResetToDay1} onPlay={handlePlay} onStop={stopPlay} onJumpToDay14={handleJumpToDay14} onClearAll={handleClearAll} />
      </motion.div>
    )
  }

  const chartHeight = isPresentationMode ? 380 : undefined

  return (
    <motion.div
      className="min-h-screen bg-[var(--background)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 ${isPresentationMode ? 'max-w-none px-8' : ''}`}>

        {/* ── Presentation mode banner ── */}
        <AnimatePresence>
          {isPresentationMode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between px-4 py-2 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)] text-[var(--accent)] text-sm"
            >
              <span className="font-medium">Presentation Mode — press P to exit</span>
              <button onClick={() => setIsPresentationMode(false)} className="text-xs underline">Exit</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Header ── */}
        <motion.div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div>
            <h1 className={`font-semibold text-[var(--text-primary)] ${isPresentationMode ? 'text-[40px]' : 'text-[28px] sm:text-[32px]'}`}>
              Your Mind Over Time
            </h1>
            <p className="mt-1 text-[var(--text-secondary)] text-base" style={{ lineHeight: '1.7' }}>
              14-day linguistic pattern analysis
            </p>
          </div>
          <Link href="/">
            <motion.span whileHover={{ y: -1 }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium transition-colors hover:bg-[var(--accent-hover)] cursor-pointer min-h-[44px]" style={{ fontFamily: 'var(--font-sans)' }}>
              <PlusCircle size={16} />
              Add New Entry
            </motion.span>
          </Link>
        </motion.div>

        {/* ── Trend insight card ── */}
        {trendLoading ? (
          <TrendSkeleton />
        ) : trendInsight ? (
          <TrendCard insight={trendInsight} trendKey={trendKey} />
        ) : null}

        {/* ── Chart ── */}
        <motion.div
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 pt-6 pb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-4">Risk score over time</p>
          <DashboardChart data={chartData} height={chartHeight} />
        </motion.div>

        {/* ── Entries grid ── */}
        <motion.div layout className={`grid gap-4 entries-panel ${isPresentationMode ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          <AnimatePresence mode="popLayout">
            {sorted.map((entry, i) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                index={i}
                isNew={newEntryIds.has(entry.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* ── Disclaimer ── */}
        <motion.div className="text-center py-6 border-t border-[var(--border)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <p className="text-xs text-[var(--text-muted)] max-w-lg mx-auto" style={{ lineHeight: '1.4' }}>
            MirrorMind analyzes linguistic patterns only. If you&apos;re struggling, please speak with a mental health professional.{' '}
            <a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[var(--accent)] hover:underline">
              Find support <ExternalLink size={10} className="mt-px" />
            </a>
          </p>
        </motion.div>
      </div>

      {/* ── Demo controller ── */}
      <DemoController
        isPlaying={isPlaying}
        onResetToDay1={handleResetToDay1}
        onPlay={handlePlay}
        onStop={stopPlay}
        onJumpToDay14={handleJumpToDay14}
        onClearAll={handleClearAll}
      />
    </motion.div>
  )
}

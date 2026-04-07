'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, ArrowRight, AlertCircle, WifiOff } from 'lucide-react'
import { useStore } from '@/lib/store'
import LoadingSpinner from '@/components/LoadingSpinner'
import AnalyzingSkeleton from '@/components/AnalyzingSkeleton'
import RiskMeter from '@/components/RiskMeter'
import HighlightedText from '@/components/HighlightedText'
import type { JournalEntry, Highlight } from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_TEXT_LENGTH = 20
const MAX_TEXT_LENGTH = 2000

// ─── Category chip colours ───────────────────────────────────────────────────

const CATEGORY_STYLES: Record<Highlight['category'], string> = {
  hopelessness:       'bg-[#FAECEC] text-[#B84040]',
  isolation:          'bg-[#EAF0FA] text-[#3B6CB7]',
  'self-focus':       'bg-[#FDF3E7] text-[#C4863A]',
  'negative-emotion': 'bg-[#F0EAFA] text-[#7B5EA8]',
}

// ─── Logo mark ───────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="19" stroke="var(--accent)" strokeWidth="1.5" />
      <path d="M8 20 Q14 14 20 20 Q26 26 32 20" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M8 24 Q14 18 20 24 Q26 30 32 24" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" fill="none" />
    </svg>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const today = new Date().toISOString().split('T')[0]
  const [text, setText] = useState('')
  const [date, setDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<'network' | 'server' | null>(null)
  const [truncationNotice, setTruncationNotice] = useState(false)
  const [result, setResult] = useState<null | {
    score: number
    riskLevel: string
    highlights: Highlight[]
    insight: string
    dominantPattern: string
    modelUsed: string
    truncated?: boolean
  }>(null)

  // Debounced char count for warning display (300ms)
  const [debouncedLength, setDebouncedLength] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    debounceRef.current && clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedLength(text.length), 300)
    return () => { debounceRef.current && clearTimeout(debounceRef.current) }
  }, [text])

  const { addEntry } = useStore()

  const trimmedLength = text.trim().length
  const tooShort = trimmedLength > 0 && debouncedLength > 0 && trimmedLength < MIN_TEXT_LENGTH
  const tooLong = debouncedLength > MAX_TEXT_LENGTH
  const canAnalyze = trimmedLength >= MIN_TEXT_LENGTH && !loading

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) return
    setLoading(true)
    setError(null)
    setResult(null)
    setTruncationNotice(false)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })

      if (!res.ok) {
        setError('server')
        return
      }

      const data = await res.json()
      if (data.error) { setError('server'); return }

      setResult(data)
      if (data.truncated) setTruncationNotice(true)

      const entry: JournalEntry = {
        id: crypto.randomUUID(),
        date,
        text: text.trim(),
        score: data.score,
        riskLevel: data.riskLevel,
        highlights: data.highlights ?? [],
        insight: data.insight,
        analyzedAt: new Date().toISOString(),
      }
      addEntry(entry)
    } catch {
      // Network offline or fetch failed
      setError('network')
    } finally {
      setLoading(false)
    }
  }, [text, date, canAnalyze, addEntry])

  return (
    <motion.main
      className="flex flex-col lg:flex-row min-h-screen relative overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* ── Floating background circles ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {(
          [
            { size: 340, top: '10%', left: '5%',   anim: 'float1 18s ease-in-out infinite' },
            { size: 280, top: '55%', left: '25%',  anim: 'float2 22s ease-in-out infinite 3s' },
            { size: 380, top: '20%', left: 'auto', right: '5%',  anim: 'float3 20s ease-in-out infinite 6s' },
            { size: 220, top: '70%', left: 'auto', right: '15%', anim: 'float4 16s ease-in-out infinite 1s' },
          ] as Array<{ size: number; top: string; left?: string; right?: string; anim: string }>
        ).map(({ size, top, left, right, anim }, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{ width: size, height: size, top, left, right, background: 'var(--accent)', opacity: 0.04, filter: 'blur(60px)', animation: anim }}
          />
        ))}
      </div>

      {/* ── Left panel ── */}
      <motion.aside
        className="relative z-10 lg:w-[40%] lg:min-h-screen flex flex-col justify-between px-8 py-10 lg:px-12 lg:py-14 border-b lg:border-b-0 lg:border-r border-[var(--border)]"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="space-y-8">
          {/* Brand */}
          <div className="space-y-4">
            <LogoMark />
            <div>
              <h1 className="text-[28px] font-semibold text-[var(--text-primary)]">
                MirrorMind
              </h1>
              <p className="mt-3 text-[16px] text-[var(--text-secondary)] max-w-[280px]" style={{ lineHeight: '1.7' }}>
                Understand your patterns before they become a crisis.
              </p>
            </div>
          </div>

          <div className="h-px bg-[var(--border)]" />

          {/* Research badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] text-sm font-medium"
            style={{ minHeight: '44px' }}
          >
            <FlaskConical size={14} aria-hidden="true" />
            Based on peer-reviewed NLP research
          </div>

          {/* How it works */}
          <div className="space-y-4" role="list" aria-label="How MirrorMind works">
            {[
              { n: '01', label: 'Write freely',   desc: 'No prompts, no judgment.' },
              { n: '02', label: 'AI analysis',    desc: 'Linguistic patterns detected in seconds.' },
              { n: '03', label: 'See your arc',   desc: 'Track how your language shifts over time.' },
            ].map(({ n, label, desc }) => (
              <div key={n} className="flex items-start gap-3" role="listitem">
                <span className="text-xs font-mono text-[var(--text-muted)] mt-0.5 w-6 shrink-0" aria-hidden="true">{n}</span>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                  <p className="text-xs text-[var(--text-muted)]" style={{ lineHeight: '1.4' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer + about */}
        <div className="mt-8 lg:mt-0 space-y-2">
          <p className="text-[12px] italic text-[var(--text-muted)] max-w-[260px]" style={{ lineHeight: '1.4' }}>
            Not a diagnostic tool. A mirror for self-awareness.
          </p>
          <Link href="/about" className="text-[12px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
            The science behind this →
          </Link>
        </div>
      </motion.aside>

      {/* ── Right panel ── */}
      <motion.section
        className="relative z-10 flex-1 flex flex-col justify-center px-6 py-10 lg:px-14 lg:py-14 max-w-2xl mx-auto w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        aria-label="Journal entry form"
      >
        <div className="space-y-6">
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">
            How are you feeling today?
          </h2>

          {/* Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="journal-entry" className="sr-only">
              Journal entry
            </label>
            <textarea
              id="journal-entry"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write freely. There's no right or wrong way to express yourself..."
              aria-label="Journal entry"
              aria-describedby={tooShort ? 'text-too-short' : tooLong ? 'text-too-long' : undefined}
              className="w-full min-h-[160px] px-5 py-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-base resize-none outline-none transition-all duration-150 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)] placeholder:text-[var(--text-muted)]"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', lineHeight: '1.7' }}
            />
            {/* Validation messages */}
            <AnimatePresence mode="wait">
              {tooShort && (
                <motion.p
                  id="text-too-short"
                  key="short"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle size={12} aria-hidden="true" />
                  Please write a bit more for accurate analysis ({MIN_TEXT_LENGTH - trimmedLength} chars to go)
                </motion.p>
              )}
              {tooLong && (
                <motion.p
                  id="text-too-long"
                  key="long"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-[var(--risk-medium)] flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle size={12} aria-hidden="true" />
                  Entry will be trimmed to {MAX_TEXT_LENGTH} characters for analysis ({debouncedLength}/{MAX_TEXT_LENGTH})
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Date picker */}
          <div className="flex items-center gap-3">
            <label htmlFor="entry-date" className="text-sm text-[var(--text-secondary)] shrink-0">
              Entry date
            </label>
            <input
              id="entry-date"
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Entry date"
              className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors min-h-[44px]"
            />
          </div>

          {/* Analyze button */}
          <motion.button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            whileHover={canAnalyze ? { y: -1 } : {}}
            whileTap={canAnalyze ? { y: 0 } : {}}
            aria-label={loading ? 'Analyzing your journal entry' : 'Analyze entry'}
            aria-busy={loading}
            className={`w-full h-[52px] min-h-[52px] rounded-xl bg-[var(--accent)] text-white font-semibold text-base transition-colors duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${loading ? 'analyze-pulse' : ''}`}
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {loading ? (
              <>
                <LoadingSpinner size={18} className="[color:white]" />
                <span>Analyzing patterns…</span>
              </>
            ) : (
              'Analyze Entry'
            )}
          </motion.button>

          {/* Dashboard link */}
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors min-h-[44px]"
              aria-label="View your timeline on the dashboard"
            >
              View your timeline
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* Error states */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-start gap-3"
                role="alert"
              >
                {error === 'network' ? (
                  <WifiOff size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--risk-medium)' }} aria-hidden="true" />
                ) : (
                  <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--risk-medium)' }} aria-hidden="true" />
                )}
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {error === 'network' ? 'Connection unavailable' : 'Analysis unavailable'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5" style={{ lineHeight: '1.4' }}>
                    {error === 'network'
                      ? 'Check your internet connection and try again.'
                      : 'The analysis service returned an error. Please try again in a moment.'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skeleton while loading */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
              >
                <AnalyzingSkeleton />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Truncation notice */}
          <AnimatePresence>
            {truncationNotice && result && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-[var(--text-muted)] text-center"
                role="status"
              >
                Entry was trimmed to {MAX_TEXT_LENGTH} characters for analysis.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Result card */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5"
                role="region"
                aria-label="Analysis results"
              >
                {/* Score row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1" style={{ lineHeight: '1.4' }}>
                      Risk Signal
                    </p>
                    <p
                      className="text-5xl font-semibold leading-none tabular-nums"
                      aria-label={`Risk score: ${result.score} out of 100`}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        color: result.riskLevel === 'high' ? 'var(--risk-high)' : result.riskLevel === 'medium' ? 'var(--risk-medium)' : 'var(--risk-low)',
                      }}
                    >
                      {result.score}
                    </p>
                  </div>
                  <span
                    className="mt-1 px-3 py-1 rounded-full text-xs font-medium capitalize badge-bounce"
                    style={{
                      background: result.riskLevel === 'high' ? 'var(--risk-high-bg)' : result.riskLevel === 'medium' ? 'var(--risk-medium-bg)' : 'var(--risk-low-bg)',
                      color: result.riskLevel === 'high' ? 'var(--risk-high)' : result.riskLevel === 'medium' ? 'var(--risk-medium)' : 'var(--risk-low)',
                    }}
                  >
                    {result.riskLevel} risk
                  </span>
                </div>

                <RiskMeter score={result.score} delay={0.15} />

                <p className="text-sm italic text-[var(--text-secondary)]" style={{ lineHeight: '1.7' }}>
                  &ldquo;{result.insight}&rdquo;
                </p>

                {result.highlights.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider" style={{ lineHeight: '1.4' }}>
                      Your entry with markers
                    </p>
                    <div className="text-sm" style={{ lineHeight: '1.7' }}>
                      <HighlightedText text={text.trim()} highlights={result.highlights} />
                    </div>
                  </div>
                )}

                {result.highlights.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider" style={{ lineHeight: '1.4' }}>
                      Detected patterns
                    </p>
                    <div className="flex flex-wrap gap-2" role="list" aria-label="Detected linguistic patterns">
                      {result.highlights.map((h, i) => (
                        <span
                          key={i}
                          role="listitem"
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_STYLES[h.category]}`}
                        >
                          &ldquo;{h.phrase}&rdquo;
                          <span className="ml-1.5 opacity-60 capitalize">{h.category.replace('-', ' ')}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.dominantPattern && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Dominant pattern:{' '}
                    <span className="text-[var(--text-secondary)] font-medium">{result.dominantPattern}</span>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </motion.main>
  )
}

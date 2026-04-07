'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, SkipForward, RotateCcw, Trash2, Zap, X } from 'lucide-react'

interface DemoControllerProps {
  isPlaying: boolean
  onResetToDay1: () => void
  onPlay: () => void
  onStop: () => void
  onJumpToDay14: () => void
  onClearAll: () => void
}

export default function DemoController({
  isPlaying,
  onResetToDay1,
  onPlay,
  onStop,
  onJumpToDay14,
  onClearAll,
}: DemoControllerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-4 w-56 space-y-2"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <p className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] px-1 pb-1">
              Demo Controls
            </p>

            <DemoButton
              icon={<RotateCcw size={14} />}
              label="Reset to Day 1"
              onClick={() => { onResetToDay1(); setOpen(false) }}
              disabled={isPlaying}
            />

            <DemoButton
              icon={isPlaying ? <Square size={14} /> : <Play size={14} />}
              label={isPlaying ? 'Stop playback' : 'Play Timeline'}
              onClick={() => { isPlaying ? onStop() : onPlay(); setOpen(false) }}
              highlight={!isPlaying}
            />

            <DemoButton
              icon={<SkipForward size={14} />}
              label="Jump to Day 14"
              onClick={() => { onJumpToDay14(); setOpen(false) }}
              disabled={isPlaying}
            />

            <div className="h-px bg-[var(--border)] my-1" />

            <DemoButton
              icon={<Trash2 size={14} />}
              label="Clear All"
              onClick={() => { onClearAll(); setOpen(false) }}
              disabled={isPlaying}
              danger
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating badge */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg transition-colors"
        style={{
          background: isPlaying
            ? 'var(--risk-medium)'
            : 'var(--accent)',
          fontFamily: 'var(--font-sans)',
          minHeight: '44px',
        }}
      >
        {isPlaying ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Playing…
          </>
        ) : (
          <>
            <Zap size={14} />
            Demo Mode
            {open ? <X size={12} className="ml-1 opacity-70" /> : null}
          </>
        )}
      </motion.button>
    </div>
  )
}

function DemoButton({
  icon,
  label,
  onClick,
  disabled = false,
  highlight = false,
  danger = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  highlight?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
      style={{
        background: highlight
          ? 'var(--accent)'
          : danger
            ? 'var(--risk-high-bg)'
            : 'var(--surface-hover)',
        color: highlight
          ? 'white'
          : danger
            ? 'var(--risk-high)'
            : 'var(--text-primary)',
        minHeight: '40px',
      }}
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </button>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'

function JournalIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Book body */}
      <rect x="24" y="20" width="72" height="84" rx="4" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      {/* Spine */}
      <line x1="40" y1="20" x2="40" y2="104" stroke="var(--border)" strokeWidth="1.5" />
      {/* Lines */}
      <line x1="50" y1="40" x2="84" y2="40" stroke="var(--border)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="50" y1="52" x2="80" y2="52" stroke="var(--border)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="50" y1="64" x2="76" y2="64" stroke="var(--border)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="50" y1="76" x2="72" y2="76" stroke="var(--border)" strokeWidth="1.2" strokeLinecap="round" />
      {/* Mirror reflection — wave motif */}
      <path d="M50 88 Q60 82 70 88 Q80 94 90 88" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeOpacity="0.6" />
      <path d="M50 93 Q60 87 70 93 Q80 99 90 93" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" fill="none" strokeOpacity="0.3" />
      {/* Circle accent */}
      <circle cx="88" cy="28" r="12" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.4" />
      <text x="88" y="33" textAnchor="middle" fill="var(--accent)" fontSize="13" fontWeight="600" style={{ fontFamily: 'Georgia, serif' }}>M</text>
    </svg>
  )
}

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <JournalIllustration />

      <h2
        className="mt-6 text-xl font-semibold text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-serif)', lineHeight: '1.2' }}
      >
        Your story starts here
      </h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xs" style={{ lineHeight: '1.7' }}>
        Write your first journal entry and see how your language patterns reveal your inner world.
      </p>

      <Link href="/">
        <motion.span
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold transition-colors hover:bg-[var(--accent-hover)] cursor-pointer"
          style={{ fontFamily: 'var(--font-serif)', minHeight: '44px' }}
        >
          <PlusCircle size={16} />
          Write Your First Entry
        </motion.span>
      </Link>
    </motion.div>
  )
}

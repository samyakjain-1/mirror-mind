'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { JournalEntry } from './types'
import { demoEntries } from './demo-data'

const STORAGE_KEY = 'mirrormind_entries'

interface StoreContextValue {
  entries: JournalEntry[]
  addEntry: (entry: JournalEntry) => void
  clearEntries: () => void
  resetEntries: (newEntries: JournalEntry[]) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>(demoEntries)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setEntries(JSON.parse(stored))
      }
    } catch {
      // ignore parse errors, fall back to demo data
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch {
      // ignore storage errors
    }
  }, [entries, hydrated])

  function addEntry(entry: JournalEntry) {
    setEntries((prev) => {
      const without = prev.filter((e) => e.id !== entry.id)
      return [...without, entry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    })
  }

  function clearEntries() {
    setEntries(demoEntries)
  }

  function resetEntries(newEntries: JournalEntry[]) {
    setEntries(newEntries)
  }

  return (
    <StoreContext.Provider value={{ entries, addEntry, clearEntries, resetEntries }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}

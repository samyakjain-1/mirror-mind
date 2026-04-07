export interface JournalEntry {
  id: string
  date: string           // ISO date string
  text: string
  score: number          // 0-100 depression risk score
  riskLevel: 'low' | 'medium' | 'high'
  highlights: Highlight[]
  insight: string
  analyzedAt: string
}

export interface Highlight {
  phrase: string
  category: 'hopelessness' | 'isolation' | 'self-focus' | 'negative-emotion'
  startIndex: number
  endIndex: number
}

export interface TrendInsight {
  summary: string
  direction: 'improving' | 'stable' | 'declining'
  keyChange: string
}

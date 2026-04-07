import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { JournalEntry, TrendInsight } from '@/lib/types'

const FALLBACK: TrendInsight = {
  summary: 'Your patterns have been consistent over this period.',
  direction: 'stable',
  keyChange: 'Language patterns remain relatively unchanged.',
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timed out after ${ms}ms`)), ms)
    ),
  ])
}

export async function POST(request: NextRequest) {
  try {
    const { entries } = (await request.json()) as { entries: JournalEntry[] }

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(FALLBACK)
    }

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      console.warn('[trend-insight] GEMINI_API_KEY not set — returning fallback')
      return NextResponse.json(FALLBACK)
    }

    const recent = entries
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7)

    console.log(`[trend-insight] analysing ${recent.length} entries`)

    const entrySummary = recent
      .map((e) => `Date: ${e.date} | Score: ${e.score} | Text snippet: "${e.text.slice(0, 100)}"`)
      .join('\n')

    const gemini = new GoogleGenerativeAI(key)
    const model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        'You analyze patterns in mental health journal data. Return only valid JSON, no markdown, no backticks.',
    })

    const prompt = `Here are journal entries over time with depression risk scores (0-100):

${entrySummary}

Return JSON:
{
  "summary": "2 sentences max, warm and non-clinical, describe what has changed",
  "direction": "improving" | "stable" | "declining",
  "keyChange": "one specific observation about language or pattern shift"
}

Rules:
- improving = scores trending down over time
- declining = scores trending up over time
- stable = scores roughly flat
- Never use clinical language or mention depression directly
- Be warm, observational, not alarming`

    let raw: string
    try {
      const result = await withTimeout(model.generateContent(prompt), 12000)
      raw = result.response.text().replace(/```json|```/g, '').trim()
      console.log(`[trend-insight] raw: ${raw.slice(0, 200)}`)
    } catch (err) {
      console.error('[trend-insight] Gemini failed:', (err as Error).message)
      return NextResponse.json(FALLBACK)
    }

    try {
      const parsed = JSON.parse(raw) as TrendInsight
      const direction = ['improving', 'stable', 'declining'].includes(parsed.direction)
        ? parsed.direction
        : 'stable'
      return NextResponse.json({
        summary: parsed.summary ?? FALLBACK.summary,
        direction,
        keyChange: parsed.keyChange ?? FALLBACK.keyChange,
      })
    } catch {
      console.error('[trend-insight] JSON parse failed:', raw.slice(0, 200))
      return NextResponse.json(FALLBACK)
    }
  } catch (err) {
    console.error('[trend-insight] Unhandled error:', err)
    return NextResponse.json(FALLBACK)
  }
}

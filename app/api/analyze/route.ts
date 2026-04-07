import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Highlight } from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────────────────────

type RiskLevel = 'low' | 'medium' | 'high'

interface HFLabel { label: string; score: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function riskFromScore(score: number): RiskLevel {
  if (score < 40) return 'low'
  if (score < 65) return 'medium'
  return 'high'
}

function extractSentimentScore(data: HFLabel[][]): number {
  const labels = data[0]
  const negative = labels.find((l) => l.label === 'negative')?.score ?? 0
  const neutral  = labels.find((l) => l.label === 'neutral')?.score  ?? 0
  return Math.min(negative * 70 + neutral * 20, 100)
}

function ruleBasedScore(text: string): number {
  const words = text.toLowerCase().split(/\s+/)
  const total = words.length
  const fpWords = new Set(['i', 'me', 'my', 'myself', 'mine'])
  const fpScore = Math.min((words.filter((w) => fpWords.has(w)).length / total) * 300, 40)
  const lower = text.toLowerCase()
  const hopelessnessScore = [
    "don't know", "dont know", "what's the point", "no point", "can't", "cant",
    "nothing matters", "what's the use", "give up", "hopeless", "pointless", "meaningless", "worthless",
  ].filter((p) => lower.includes(p)).length * 8
  const isolationScore = [
    "alone", "my room", "nobody", "no one", "canceled", "cancelled",
    "staying in", "isolat", "by myself", "empty",
  ].filter((p) => lower.includes(p)).length * 7
  return Math.min(fpScore + hopelessnessScore + isolationScore + 10, 100)
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

const GEMINI_FALLBACK = {
  highlights: [] as Highlight[],
  insight: 'Your language reflects a period of inner reflection.',
  dominantPattern: 'emotional processing',
}

// ─── HuggingFace ─────────────────────────────────────────────────────────────

const SENTIMENT_MODEL = 'cardiffnlp/twitter-roberta-base-sentiment-latest'

async function callHuggingFace(text: string, retried = false): Promise<{ score: number; modelUsed: string } | null> {
  const key = process.env.HUGGINGFACE_API_KEY
  if (!key) {
    console.warn('[HF] HUGGINGFACE_API_KEY not set — skipping, using rule-based scorer')
    return null
  }

  const url = `https://router.huggingface.co/hf-inference/models/${SENTIMENT_MODEL}`
  let res: Response
  try {
    res = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text }),
      }),
      8000,
      'HuggingFace'
    )
  } catch (err) {
    console.error('[HF] fetch failed:', (err as Error).message)
    return null
  }

  console.log(`[HF] status=${res.status}`)

  if (res.status === 503 && !retried) {
    console.log('[HF] Model loading, retrying in 4s…')
    await new Promise((r) => setTimeout(r, 4000))
    return callHuggingFace(text, true)
  }

  if (!res.ok) return null

  try {
    const data: HFLabel[][] = await res.json()
    const score = extractSentimentScore(data)
    console.log(`[HF] score=${score.toFixed(1)}`)
    return { score, modelUsed: SENTIMENT_MODEL }
  } catch {
    return null
  }
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

async function getGeminiAnalysis(text: string): Promise<typeof GEMINI_FALLBACK> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.warn('[Gemini] GEMINI_API_KEY not set — using template insight')
    return GEMINI_FALLBACK
  }

  const gemini = new GoogleGenerativeAI(key)
  const model = gemini.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction:
      'You are a linguistic analysis assistant for a mental health awareness tool. ' +
      'Analyze text for patterns: first-person pronoun overuse, hopelessness language, isolation themes, negative self-worth. ' +
      'Return ONLY valid JSON with no markdown, no backticks, no explanation.',
  })

  const prompt = `Analyze this journal entry and return JSON with this exact structure:
{
  "highlights": [
    {
      "phrase": "exact phrase from text",
      "category": "hopelessness" | "isolation" | "self-focus" | "negative-emotion",
      "startIndex": number,
      "endIndex": number
    }
  ],
  "insight": "one warm non-clinical sentence max 20 words",
  "dominantPattern": "2-3 word label"
}

Rules:
- 2-4 phrases that appear VERBATIM in the text
- startIndex/endIndex = exact character positions
- insight: warm, human, never say "depression" or "disorder"
- dominantPattern examples: "self-critical thinking", "social withdrawal", "emotional numbness"

Journal entry: "${text}"`

  const raw = await withTimeout(model.generateContent(prompt), 12000, 'Gemini')
    .then((r) => r.response.text().replace(/```json|```/g, '').trim())

  try {
    const parsed = JSON.parse(raw)
    return {
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      insight: parsed.insight ?? GEMINI_FALLBACK.insight,
      dominantPattern: parsed.dominantPattern ?? GEMINI_FALLBACK.dominantPattern,
    }
  } catch {
    console.error('[Gemini] JSON parse failed:', raw.slice(0, 200))
    return GEMINI_FALLBACK
  }
}

// ─── Route ───────────────────────────────────────────────────────────────────

const MAX_TEXT_LENGTH = 2000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawText: unknown = body?.text

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    if (rawText.trim().length < 20) {
      return NextResponse.json({ error: 'Text is too short for analysis' }, { status: 422 })
    }

    // Truncate silently server-side (client warns the user separately)
    const text = rawText.trim().slice(0, MAX_TEXT_LENGTH)
    const truncated = text.length < rawText.trim().length

    // ── Step 1: Score ──
    const hfResult = await callHuggingFace(text)
    let score: number
    let modelUsed: string
    if (hfResult) {
      score = hfResult.score
      modelUsed = hfResult.modelUsed
    } else {
      console.log('[analyze] Falling back to rule-based scorer')
      score = ruleBasedScore(text)
      modelUsed = 'rule-based'
    }
    score = Math.round(score)
    const riskLevel = riskFromScore(score)
    console.log(`[analyze] score=${score} risk=${riskLevel} model=${modelUsed}`)

    // ── Step 2: Highlights + insight ──
    const { highlights, insight, dominantPattern } = await getGeminiAnalysis(text).catch((err) => {
      console.error('[Gemini] Failed:', (err as Error).message)
      return GEMINI_FALLBACK
    })

    return NextResponse.json({ score, riskLevel, highlights, insight, dominantPattern, modelUsed, truncated })
  } catch (err) {
    console.error('[analyze] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

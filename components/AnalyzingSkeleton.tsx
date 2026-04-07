'use client'

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`rounded-lg bg-[var(--border)] skeleton-pulse ${className}`} />
}

export default function AnalyzingSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
      {/* Score row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Pulse className="h-3 w-16" />
          <Pulse className="h-10 w-20" />
        </div>
        <Pulse className="h-6 w-20 rounded-full" />
      </div>

      {/* Bar */}
      <Pulse className="h-2.5 w-full rounded-full" />

      {/* Insight */}
      <div className="space-y-2">
        <Pulse className="h-3.5 w-full" />
        <Pulse className="h-3.5 w-3/4" />
      </div>

      {/* Chips */}
      <div className="flex gap-2">
        <Pulse className="h-6 w-28 rounded-full" />
        <Pulse className="h-6 w-24 rounded-full" />
        <Pulse className="h-6 w-32 rounded-full" />
      </div>
    </div>
  )
}

export function TrendSkeleton() {
  return (
    <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex gap-8 items-center">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <Pulse className="w-14 h-14 rounded-full" />
        <Pulse className="h-3 w-16" />
      </div>
      <div className="h-12 w-px bg-[var(--border)] shrink-0" />
      <div className="space-y-2 flex-1">
        <Pulse className="h-3.5 w-full" />
        <Pulse className="h-3.5 w-4/5" />
        <Pulse className="h-3 w-3/5" />
      </div>
    </div>
  )
}

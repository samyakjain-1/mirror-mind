import Link from 'next/link'
import { ArrowLeft, FlaskConical, Brain, Shield, Database } from 'lucide-react'

export default function AboutPage() {
  return (
    <main
      className="min-h-screen bg-[var(--background)] py-14 px-6"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="max-w-2xl mx-auto space-y-14">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to MirrorMind
        </Link>

        {/* Hero */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] text-xs font-medium">
            <FlaskConical size={12} />
            Research-backed
          </div>
          <h1
            className="text-4xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-serif)', lineHeight: '1.2' }}
          >
            The Science Behind MirrorMind
          </h1>
          <p className="text-[var(--text-secondary)] text-lg" style={{ lineHeight: '1.7' }}>
            MirrorMind is grounded in peer-reviewed computational linguistics research.
            Here is what the science says — and what we are careful not to claim.
          </p>
        </div>

        <Divider />

        {/* Citation */}
        <Section icon={<FlaskConical size={18} />} title="Primary Research Basis">
          <p style={{ lineHeight: '1.7' }}>
            MirrorMind&apos;s detection framework is informed by:
          </p>
          <blockquote className="my-4 pl-4 border-l-2 border-[var(--accent)] text-[var(--text-secondary)] italic text-sm" style={{ lineHeight: '1.7' }}>
            Kim, J., &amp; Römer-Barron, A. (2024). &ldquo;Detecting Depression in Online Discourse:
            A Corpus-Based NLP Approach Across Humanities Contexts.&rdquo;{' '}
            <em>Corpus-Based Studies Across Humanities</em>. University of Warwick.
          </blockquote>
          <p style={{ lineHeight: '1.7' }}>
            The study achieved <strong>96% accuracy</strong> detecting depression markers in Reddit
            posts using machine learning on linguistic features — without relying on explicit
            self-disclosure. Key features included first-person pronoun density,
            hopelessness language, isolation themes, and negative valence phrasing.
          </p>
        </Section>

        <Divider />

        {/* Linguistic markers */}
        <Section icon={<Brain size={18} />} title="The Four Linguistic Markers">
          <p className="mb-5" style={{ lineHeight: '1.7' }}>
            Clinical NLP research has identified four primary language patterns associated
            with depressive episodes. MirrorMind highlights these in your writing:
          </p>
          <div className="space-y-4">
            {[
              {
                label: 'First-Person Pronoun Density',
                color: '#FDF3E7',
                accent: '#C4863A',
                desc: 'Overuse of "I", "me", "my", "myself" correlates with self-focused rumination — a hallmark of depressive cognition. Research shows depressed individuals use first-person singular pronouns significantly more than controls.',
              },
              {
                label: 'Hopelessness Language',
                color: '#FAECEC',
                accent: '#B84040',
                desc: 'Phrases like "what\'s the point", "nothing matters", "I give up" signal cognitive distortions around permanence and future outlook. The Beck Hopelessness Scale has long linked this pattern to depressive severity.',
              },
              {
                label: 'Isolation Markers',
                color: '#EAF0FA',
                accent: '#3A6EA8',
                desc: 'References to being alone, withdrawing from social plans, spending time in isolation, or feeling unseen are behavioural withdrawal signals encoded in language — often preceding clinical episodes.',
              },
              {
                label: 'Negative Emotional Valence',
                color: '#F0EAFA',
                accent: '#7B5EA8',
                desc: 'General negative affect language — heaviness, flatness, inability to feel positive emotion (anhedonia) — detected via sentiment analysis. MirrorMind uses the Cardiff NLP Twitter-RoBERTa model trained on 124M tweets.',
              },
            ].map(({ label, color, accent, desc }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{ background: color, borderLeft: `3px solid ${accent}` }}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: accent }}>{label}</p>
                <p className="text-sm text-[var(--text-secondary)]" style={{ lineHeight: '1.7' }}>{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Divider />

        {/* Model details */}
        <Section icon={<Database size={18} />} title="Model Architecture">
          <div className="space-y-4">
            <ModelCard
              name="cardiffnlp/twitter-roberta-base-sentiment-latest"
              role="Sentiment Scoring"
              desc="RoBERTa fine-tuned on 124M tweets across time. Classifies text as positive, neutral, or negative. MirrorMind maps (negative × 0.7) + (neutral × 0.2) to a 0–100 risk signal — reflecting that emotional flatness (neutral) also warrants attention."
            />
            <ModelCard
              name="Google Gemini 2.5 Flash"
              role="Phrase Extraction & Insight"
              desc="Used for precise linguistic phrase detection and generating warm, non-clinical insights. Identifies verbatim phrases matching hopelessness, isolation, self-focus, or negative-emotion patterns with exact character positions."
            />
            <ModelCard
              name="Rule-Based Fallback"
              role="Offline Scoring"
              desc="When cloud models are unavailable, MirrorMind falls back to a lexical scorer counting first-person density, hopelessness phrases, and isolation vocabulary. Transparent, deterministic, auditable."
            />
          </div>
        </Section>

        <Divider />

        {/* Ethical framework */}
        <Section icon={<Shield size={18} />} title="Ethical Framework">
          <div className="space-y-4" style={{ lineHeight: '1.7' }}>
            <EthicPoint
              title="Not a diagnostic tool"
              desc="MirrorMind cannot and does not diagnose depression or any mental health condition. No clinical assessment can be made from language patterns alone. This is a self-awareness mirror, not a clinical instrument."
            />
            <EthicPoint
              title="No data leaves your device unexpectedly"
              desc="Journal entries are stored in your browser's localStorage. Text is sent to the analysis API only when you explicitly click 'Analyze Entry'. Nothing is retained server-side."
            />
            <EthicPoint
              title="Warm, non-clinical language by design"
              desc="All AI-generated insights are instructed to avoid clinical terminology, never mention 'depression' or 'disorder', and maintain a warm, observational tone. We studied how clinical language can cause harm in digital contexts."
            />
            <EthicPoint
              title="Crisis resources always visible"
              desc="Every page links to the 988 Suicide & Crisis Lifeline. If a user's language escalates to crisis-level markers, the interface surfaces the resource prominently."
            />
            <EthicPoint
              title="Transparent about limitations"
              desc="The 96% accuracy figure from Kim & Römer-Barron was on Reddit data. Real-world journal writing differs in style and context. We present scores as linguistic signals, not ground truth."
            />
          </div>
        </Section>

        <Divider />

        {/* CTA */}
        <div className="text-center space-y-4 pb-4">
          <p className="text-sm text-[var(--text-muted)]" style={{ lineHeight: '1.7' }}>
            MirrorMind was built for the UW Tech Exploration Lab 2026 Digital Health Challenge.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors"
            style={{ fontFamily: 'var(--font-serif)', minHeight: '44px' }}
          >
            Try MirrorMind
          </Link>
        </div>

      </div>
    </main>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-[var(--border)]" />
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="text-[var(--accent)]">{icon}</span>
        <h2
          className="text-xl font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-serif)', lineHeight: '1.2' }}
        >
          {title}
        </h2>
      </div>
      <div className="text-sm text-[var(--text-primary)]">{children}</div>
    </section>
  )
}

function ModelCard({ name, role, desc }: { name: string; role: string; desc: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1.5">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <code className="text-xs font-mono text-[var(--accent)] bg-[var(--accent-light)] px-2 py-0.5 rounded">
          {name}
        </code>
        <span className="text-xs text-[var(--text-muted)] font-medium">{role}</span>
      </div>
      <p className="text-sm text-[var(--text-secondary)]" style={{ lineHeight: '1.7' }}>{desc}</p>
    </div>
  )
}

function EthicPoint({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{title}</p>
        <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
      </div>
    </div>
  )
}

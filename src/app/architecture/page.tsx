import InkRule from '@/components/ui/InkRule'
import RevealSection from '@/components/ui/RevealSection'
import HandDrawnButton from '@/components/ui/HandDrawnButton'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Architecture',
  description:
    'Deep-dive system design write-ups from Kamlesh Chhipa — diagrams and reasoning behind the data pipelines and LLM infrastructure covered in Projects. Coming soon.',
  path: '/architecture',
})

/** Decorative hand-sketched system diagram — a whiteboard doodle in the
 *  site's charcoal language, filling the page while the real deep-dive
 *  diagrams are authored. */
function ArchSketch() {
  const box = 'M 4 10 C 30 6, 70 8, 96 10 C 98 24, 98 40, 96 52 C 66 55, 32 54, 4 52 C 2 38, 2 22, 4 10 Z'
  return (
    <svg
      viewBox="0 0 560 250"
      aria-hidden="true"
      style={{ width: 'min(560px, 100%)', height: 'auto', color: 'var(--graphite)', overflow: 'visible' }}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#rough)">
        {/* client box */}
        <path d={box} transform="translate(10, 20)" />
        {/* api box */}
        <path d={box} transform="translate(230, 20)" />
        {/* db cylinder */}
        <ellipse cx="500" cy="38" rx="42" ry="12" />
        <path d="M 458 38 C 457 55, 457 68, 458 82 C 458 90, 478 96, 500 96 C 522 96, 542 90, 542 82 C 543 68, 543 55, 542 38" />
        {/* queue box (below api) */}
        <path d={box} transform="translate(230, 160) scale(0.9)" />
        {/* workers box (below db) */}
        <path d={box} transform="translate(430, 160) scale(0.9)" />
        {/* arrows */}
        <path d="M 112 48 C 160 44, 185 46, 224 46" />
        <path d="M 216 42 L 226 46 L 216 51" />
        <path d="M 332 46 C 380 42, 415 42, 452 42" />
        <path d="M 444 37 L 454 42 L 444 47" />
        <path d="M 280 78 C 279 105, 279 130, 280 155" strokeDasharray="7 6" />
        <path d="M 275 147 L 280 157 L 285 147" />
        <path d="M 320 190 C 360 192, 390 192, 424 190" strokeDasharray="7 6" />
        <path d="M 416 185 L 426 190 L 416 195" />
        <path d="M 483 155 C 490 130, 494 115, 497 100" strokeDasharray="7 6" />
        <path d="M 490 106 L 498 98 L 500 109" />
      </g>
      <g fill="var(--char)" style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 21 }} filter="url(#rough)">
        <text x="38" y="58">client</text>
        <text x="262" y="58">API</text>
        <text x="485" y="72">data</text>
        <text x="252" y="196">queue</text>
        <text x="448" y="196">workers</text>
      </g>
    </svg>
  )
}

export default function ArchitecturePage() {
  return (
    <div className="page-shell">
      <div className="eyebrow">Architecture</div>
      <h1 className="page-title">How I actually think about systems.</h1>
      <p className="page-lede">
        This page is where the diagrams live — the Trino–Iceberg–ClickHouse pipeline, the
        AI Hyper Cube LLM infrastructure, how a memory-aware job scheduler gets built from
        scratch. It&apos;s under construction.
      </p>

      <InkRule />

      <RevealSection as="section" className="section-block">
        <div className="content-grid cols-2" style={{ alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--graphite)', lineHeight: 1.7, maxWidth: '62ch', marginBottom: 24 }}>
              I&apos;m building this out as a proper deep-dive: high-level design diagrams, the
              trade-offs I actually weighed, and the parts that didn&apos;t work on the first try.
              Until it&apos;s ready, the <strong>Projects</strong> page has the problem/solution/outcome
              version of the same systems.
            </p>
            <HandDrawnButton href="/projects">See the projects instead</HandDrawnButton>
          </div>
          <ArchSketch />
        </div>
      </RevealSection>
    </div>
  )
}

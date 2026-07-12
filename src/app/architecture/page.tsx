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
        <p style={{ color: 'var(--graphite)', lineHeight: 1.7, maxWidth: '62ch', marginBottom: 24 }}>
          I&apos;m building this out as a proper deep-dive: high-level design diagrams, the
          trade-offs I actually weighed, and the parts that didn&apos;t work on the first try.
          Until it&apos;s ready, the <strong>Projects</strong> page has the problem/solution/outcome
          version of the same systems.
        </p>
        <HandDrawnButton href="/projects">See the projects instead</HandDrawnButton>
      </RevealSection>
    </div>
  )
}

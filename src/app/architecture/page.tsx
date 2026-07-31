import InkRule from '@/components/ui/InkRule'
import SectionHeading from '@/components/ui/SectionHeading'
import RevealSection from '@/components/ui/RevealSection'
import HandDrawnButton from '@/components/ui/HandDrawnButton'
import Card from '@/components/ui/Card'
import SketchIcon, { type SketchIconName } from '@/components/ui/SketchIcon'
import { decisions } from '@/content/decisions'
import { DecisionLoopDiagram, decisionDiagram } from '@/components/diagram/ArchitectureDiagrams'
import PageSchema from '@/components/seo/PageSchema'
import { pageMetadata } from '@/lib/seo'

const PAGE_DESCRIPTION =
  'Architecture decision records from Kamlesh Chhipa — the constraints, trade-offs and measured results behind LLM infrastructure and data pipelines at scale.'

export const metadata = pageMetadata({
  title: 'Architecture',
  description:
    PAGE_DESCRIPTION,
  path: '/architecture',
})

/** Scale the decisions below were made at — every figure restates one already
 *  evidenced in src/content/{experience,projects}.ts. */
const scale = [
  { value: '5B+', label: 'tokens / month through LLM infrastructure' },
  { value: '1B+', label: 'events / month on a self-managed pipeline' },
  { value: '100M+', label: 'keyword SERPs processed monthly' },
  { value: '25+', label: 'locales served by one collection system' },
]

const principles: { icon: SketchIconName; title: string; body: string }[] = [
  {
    icon: 'cloud',
    title: 'Unit economics are a design input',
    body: 'At a billion events and five billion tokens a month, the monthly bill is an output of the architecture, not a finance problem discovered later. The two largest wins I have shipped — 62% off AI processing, a five-figure monthly saving on data processing — were both design decisions, not optimisations bolted on afterwards.',
  },
  {
    icon: 'layers',
    title: 'Invariants get enforced, not documented',
    body: 'A rule that lives only in a wiki page is a rule that a new engineer will break on their first sprint. When a booking identifier turned out to repeat across accounts, the fix was not a note — it was an explicit account-scoping rule applied to every query path, including raw SQL.',
  },
  {
    icon: 'pipeline',
    title: 'Assume dirty data and duplicate messages',
    body: 'Collected data is gated on row counts, null rates, and duplicate checks before it reaches production, with alerts when a gate fails. Billing webhooks assume every event arrives twice. Neither assumption is pessimism — both are just what happens at volume.',
  },
  {
    icon: 'server',
    title: 'Deterministic beats clever',
    body: 'A clever system that is hard to reason about fails in ways nobody can debug under pressure. A memory-aware job scheduler and brand-level hash partitioning are both deliberately boring choices that make behaviour predictable at scale.',
  },
]

/** Patterns that recur across the decisions above — each one already shipped
 *  in a system documented on /projects or /experience. */
const patterns = [
  {
    title: 'Hash partitioning to avoid hot partitions',
    body: 'Brand-level MD5-modulo partitioning in the Spark post-processing stage keeps analytics queries evenly distributed as brand count grows.',
  },
  {
    title: 'Memory-aware job scheduling',
    body: 'A custom scheduler that admits distributed jobs based on available memory, rather than letting a query engine discover the limit by failing.',
  },
  {
    title: 'Event-driven collection',
    body: 'FastAPI in front, RabbitMQ between, Redis-backed workers under Argo Workflows behind — so collection throughput scales with workers instead of request handlers.',
  },
  {
    title: 'Quality gates before production',
    body: 'Row-count, null-rate, and duplicate checks run after collection and before the data is visible, with Slack alerts on failure. Nothing that fails a gate reaches a customer.',
  },
  {
    title: 'Caching measured by outcome',
    body: 'Varnish in-memory caching then a CloudFront CDN migration, tracked by a single number: good-LCP URLs from 55.73% to 83.85%.',
  },
  {
    title: 'Absorb upstream changes, don’t inherit them',
    body: 'When Google deprecated num=100, an automated AI Overview stitching system absorbed the change and cut collection cost ~60% across 25+ locales.',
  },
]

export default function ArchitecturePage() {
  return (
    <div className="page-shell">
      <PageSchema path="/architecture" type="WebPage" name="Architecture" description={PAGE_DESCRIPTION} />
      <RevealSection className="content-grid cols-2 about-hero">
        <div>
          <div className="eyebrow">Architecture</div>
          <h1 className="page-title">How I actually think about systems.</h1>
          <p className="page-lede">
            Every system below already shipped. This page is the reasoning underneath it — the
            constraint that forced the decision, the options that were genuinely on the table,
            what I gave up to pick one, and the number that proved it worked.
          </p>
        </div>
        <DecisionLoopDiagram />
      </RevealSection>

      <InkRule />

      <RevealSection as="section" className="section-block">
        <div className="content-grid cols-4">
          {scale.map((s) => (
            <div key={s.label}>
              <div className="page-title" style={{ fontSize: 'clamp(32px,3.4vw,50px)', marginBottom: 4 }}>
                {s.value}
              </div>
              <p style={{ color: 'var(--graphite)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="Principles">What I optimise for</SectionHeading>
        <div className="content-grid cols-2">
          {principles.map((p) => (
            <div key={p.title}>
              <SketchIcon name={p.icon} className="capability-icon" />
              <h3
                style={{
                  fontFamily: 'var(--font-caveat)',
                  fontSize: 24,
                  color: 'var(--char-deep)',
                  marginBottom: 8,
                }}
              >
                {p.title}
              </h3>
              <p className="prose">{p.body}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="Decision records">
          The trade-offs, written down
        </SectionHeading>
        <p className="prose" style={{ maxWidth: '72ch', marginBottom: 'clamp(24px,4vh,40px)' }}>
          A decision with no cost attached isn’t a decision — it’s a preference. Each record below
          names what was given up, not just what was gained.
        </p>
      </RevealSection>

      {decisions.map((d, i) => (
        <RevealSection key={d.slug} id={d.slug} as="section" className="section-block">
          <Card>
            <p className="card-meta" style={{ marginBottom: 6 }}>
              ADR {String(i + 1).padStart(2, '0')} · {d.context}
            </p>
            <h3>{d.title}</h3>

            <h4 className="adr-label">The constraint</h4>
            <p className="prose">{d.problem}</p>

            <h4 className="adr-label">Options on the table</h4>
            <div className="content-grid cols-2">
              {d.options.map((o) => (
                <div key={o.label} className={`adr-option${o.chosen ? ' is-chosen' : ''}`}>
                  <p className="adr-option-label">
                    {o.label}
                    {o.chosen && <span className="adr-chosen-tag">chosen</span>}
                  </p>
                  <p className="adr-option-note">{o.note}</p>
                </div>
              ))}
            </div>

            <h4 className="adr-label">The decision</h4>
            <p className="prose">{d.decision}</p>

            <h4 className="adr-label">What it cost</h4>
            <p className="prose adr-tradeoff">{d.tradeoff}</p>

            {decisionDiagram(d.slug)}

            <h4 className="adr-label">What it moved</h4>
            <ul>
              {d.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </Card>
          {i < decisions.length - 1 && <InkRule variant={((i + 1) % 3) as 0 | 1 | 2} />}
        </RevealSection>
      ))}

      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="Recurring patterns">Things I reach for again</SectionHeading>
        <div className="content-grid cols-3">
          {patterns.map((p) => (
            <div key={p.title} className="pattern-item">
              <h3
                style={{
                  fontFamily: 'var(--font-caveat)',
                  fontSize: 21,
                  color: 'var(--char-deep)',
                  marginBottom: 6,
                }}
              >
                {p.title}
              </h3>
              <p className="prose" style={{ fontSize: 'clamp(15.5px, 1.1vw, 17px)' }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="The systems themselves">Where this actually ran</SectionHeading>
        <p className="prose" style={{ maxWidth: '68ch', marginBottom: 28 }}>
          Every decision on this page came out of a system with a problem, a solution, and a
          measured result. Those are written up in full on the Projects page.
        </p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <HandDrawnButton href="/projects">Read the case studies</HandDrawnButton>
          <a className="link-plain" href="/experience">See the full experience</a>
        </div>
      </RevealSection>
    </div>
  )
}

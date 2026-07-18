import Link from 'next/link'
import Card from '@/components/ui/Card'
import InkRule from '@/components/ui/InkRule'
import SectionHeading from '@/components/ui/SectionHeading'
import RevealSection from '@/components/ui/RevealSection'
import HandDrawnButton from '@/components/ui/HandDrawnButton'
import SketchIcon, { type SketchIconName } from '@/components/ui/SketchIcon'
import { projects } from '@/content/projects'
import { experience } from '@/content/experience'

/**
 * The scrolling story below the Home hero: proof-by-numbers → what I do →
 * featured work → where I've been → ask. All content is pulled from the
 * typed data files in src/content — nothing here is hand-duplicated copy.
 */

const stats = [
  { value: '5B+', label: 'tokens/month through LLM infrastructure I architect' },
  { value: '62%', label: 'AI processing cost cut by moving inference in-house' },
  { value: '0→1', label: 'SaaS platform: empty repo to paying customers, alone' },
  { value: '4+', label: 'years shipping production systems end-to-end' },
]

const capabilities: { icon: SketchIconName; title: string; body: string }[] = [
  {
    icon: 'server',
    title: 'Backend & Data Platforms',
    body: 'Python, Django, FastAPI — and the data layer underneath: Trino, Iceberg, ClickHouse, BigQuery, Spark. Systems that stay deterministic at a billion events a month.',
  },
  {
    icon: 'spark',
    title: 'AI Infrastructure',
    body: 'Production LLM pipelines, not API wrappers — self-hosted vLLM inference, prompt-scoped extraction, and the cost engineering that makes 5B tokens/month affordable.',
  },
  {
    icon: 'layers',
    title: 'Full-Stack Product',
    body: 'When it matters, I own the whole thing: Next.js frontends, Stripe billing, RBAC, GCP infrastructure, CI/CD — from architecture decision to the metric that proves it shipped.',
  },
]

const featured = projects.slice(0, 3)

export default function HomeSections() {
  return (
    <div className="home-sections">
      {/* ---- Proof by numbers ---- */}
      <RevealSection as="section">
        <InkRule variant={1} />
        <div className="stat-band">
          {stats.map((s) => (
            <div key={s.value}>
              <div className="stat-value">{s.value}</div>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>
        <InkRule variant={2} />
      </RevealSection>

      {/* ---- What I do ---- */}
      <RevealSection as="section" className="section-block" >
        <SectionHeading eyebrow="What I do">Three things, done properly.</SectionHeading>
        <div className="content-grid cols-3">
          {capabilities.map((c) => (
            <Card key={c.title}>
              <SketchIcon name={c.icon} className="capability-icon" />
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </Card>
          ))}
        </div>
      </RevealSection>

      {/* ---- Featured work ---- */}
      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="Featured work">The systems behind the numbers.</SectionHeading>
        <div className="content-grid cols-3">
          {featured.map((p) => (
            <Card key={p.slug}>
              <p className="card-meta" style={{ marginBottom: 8 }}>{p.period}</p>
              <h3>{p.title}</h3>
              <p>{p.summary}</p>
              <div className="stack-tags">
                {p.stack.slice(0, 5).map((s) => (
                  <span key={s} className="stack-tag">{s}</span>
                ))}
              </div>
              <Link className="featured-link" href={`/projects#${p.slug}`}>
                Read the case study
              </Link>
            </Card>
          ))}
        </div>
      </RevealSection>

      {/* ---- Experience strip ---- */}
      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="Where I've been">A short history.</SectionHeading>
        {experience.map((e) => (
          <div key={e.slug} className="exp-strip-row">
            <div>
              <span className="exp-strip-role">{e.role}</span>
              {' '}
              <span className="exp-strip-co">· {e.company}</span>
            </div>
            <span className="exp-strip-dates">
              {e.range.start} – {e.range.end}
            </span>
          </div>
        ))}
        <div style={{ marginTop: 24 }}>
          <Link className="featured-link" href="/experience">
            Full experience, with the numbers
          </Link>
        </div>
      </RevealSection>

      {/* ---- Final CTA ---- */}
      <RevealSection as="section" className="home-cta">
        <InkRule variant={0} />
        <h2 className="page-title" style={{ marginTop: 'clamp(32px, 6vh, 64px)' }}>
          Building something that
          <br />
          needs to actually work?
        </h2>
        <p className="page-lede" style={{ maxWidth: '48ch' }}>
          I&apos;m open to senior backend, platform, and full-stack roles — and to
          founding-engineer engagements where the product doesn&apos;t exist yet.
        </p>
        <div className="cta-buttons">
          <HandDrawnButton href="/contact">Start a conversation</HandDrawnButton>
          <a className="link-plain" href="/kamlesh-chhipa-resume.pdf" download>
            Download résumé
          </a>
        </div>
      </RevealSection>
    </div>
  )
}

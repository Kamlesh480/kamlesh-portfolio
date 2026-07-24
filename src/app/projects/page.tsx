import InkRule from '@/components/ui/InkRule'
import RevealSection from '@/components/ui/RevealSection'
import Card from '@/components/ui/Card'
import { projects } from '@/content/projects'
import { projectDiagram } from '@/components/diagram/ProjectDiagrams'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Projects',
  description:
    'Case studies from Kamlesh Chhipa’s work — LLM processing infrastructure at 5B+ tokens/month, a Trino–Iceberg–ClickHouse pipeline, and the system behind this site.',
  path: '/projects',
})

export default function ProjectsPage() {
  return (
    <div className="page-shell">
      <div className="eyebrow">Projects</div>
      <h1 className="page-title">Systems, not just tech stacks.</h1>
      <p className="page-lede">
        Each of these started as a real constraint — cost, throughput, or scale — not a
        greenfield exercise. Here&apos;s the problem, the solution, and what it moved.
      </p>

      <InkRule />

      {projects.map((p, i) => (
        <RevealSection key={p.slug} id={p.slug} as="section" className="section-block">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
              <h3>{p.title}</h3>
              {p.period && <span className="card-meta" style={{ marginBottom: 0 }}>{p.period}</span>}
            </div>
            <p className="card-meta">{p.role}</p>

            <p style={{ marginBottom: 14 }}>{p.summary}</p>

            {projectDiagram(p.slug)}

            <div className="content-grid cols-2" style={{ marginTop: 18, marginBottom: 6 }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-caveat)', fontSize: 18, color: 'var(--char-deep)', marginBottom: 6 }}>
                  The problem
                </h4>
                <p style={{ fontSize: '0.96rem' }}>{p.problem}</p>
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-caveat)', fontSize: 18, color: 'var(--char-deep)', marginBottom: 6 }}>
                  The solution
                </h4>
                <p style={{ fontSize: '0.96rem' }}>{p.solution}</p>
              </div>
            </div>

            <h4 style={{ fontFamily: 'var(--font-caveat)', fontSize: 18, color: 'var(--char-deep)', marginTop: 18, marginBottom: 6 }}>
              Outcomes
            </h4>
            <ul>
              {p.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>

            {p.challenges && p.challenges.length > 0 && (
              <>
                <h4 style={{ fontFamily: 'var(--font-caveat)', fontSize: 18, color: 'var(--char-deep)', marginTop: 18, marginBottom: 6 }}>
                  Engineering challenges
                </h4>
                {p.challenges.map((c) => (
                  <p key={c.title} style={{ marginBottom: 10 }}>
                    <strong style={{ color: 'var(--char)' }}>{c.title}.</strong> {c.description}
                  </p>
                ))}
              </>
            )}

            <div className="stack-tags">
              {p.stack.map((s) => (
                <span key={s} className="stack-tag">{s}</span>
              ))}
            </div>
          </Card>
          {i < projects.length - 1 && <InkRule variant={((i + 1) % 3) as 0 | 1 | 2} />}
        </RevealSection>
      ))}
    </div>
  )
}

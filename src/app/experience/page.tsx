import InkRule from '@/components/ui/InkRule'
import RevealSection from '@/components/ui/RevealSection'
import Card from '@/components/ui/Card'
import HandDrawnButton from '@/components/ui/HandDrawnButton'
import { experience } from '@/content/experience'
import { experienceDiagram } from '@/components/diagram/ExperienceDiagrams'
import PageSchema from '@/components/seo/PageSchema'
import { pageMetadata } from '@/lib/seo'

const PAGE_DESCRIPTION =
  'Kamlesh Chhipa’s work history — BrightEdge, Hevo Data, and DUIT Technologies — with the systems built, scale reached, and business impact delivered at each.'

export const metadata = pageMetadata({
  title: 'Experience',
  description:
    PAGE_DESCRIPTION,
  path: '/experience',
})

export default function ExperiencePage() {
  return (
    <div className="page-shell">
      <PageSchema path="/experience" type="WebPage" name="Experience" description={PAGE_DESCRIPTION} />
      <div className="eyebrow">Experience</div>
      <h1 className="page-title">What I built, where, and why it mattered.</h1>
      <p className="page-lede">
        Three roles, one continuous thread: taking on systems that are expensive, slow, or
        fragile at scale, and making them none of those things.
      </p>

      <InkRule />

      {experience.map((entry, i) => (
        <RevealSection key={entry.slug} as="section" className="section-block">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
              <h2>{entry.role} · {entry.company}</h2>
              {entry.range && (
                <span className="card-meta" style={{ marginBottom: 0 }}>
                  {entry.range.start} – {entry.range.end}
                </span>
              )}
            </div>
            <p className="card-meta">{entry.location}</p>
            <p>{entry.summary}</p>
            <ul>
              {entry.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            {experienceDiagram(entry.slug)}
            <div className="stack-tags">
              {entry.stack.map((s) => (
                <span key={s} className="stack-tag">{s}</span>
              ))}
            </div>
          </Card>
          {i < experience.length - 1 && <InkRule variant={((i + 1) % 3) as 0 | 1 | 2} />}
        </RevealSection>
      ))}

      <RevealSection as="section" className="section-block">
        <p style={{ color: 'var(--graphite)', marginBottom: 24 }}>
          Want the systems-level detail behind these numbers?
        </p>
        <HandDrawnButton href="/projects">See the projects behind this</HandDrawnButton>
      </RevealSection>
    </div>
  )
}

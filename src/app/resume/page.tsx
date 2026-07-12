import InkRule from '@/components/ui/InkRule'
import SectionHeading from '@/components/ui/SectionHeading'
import RevealSection from '@/components/ui/RevealSection'
import HandDrawnButton from '@/components/ui/HandDrawnButton'
import { experience } from '@/content/experience'
import { skillGroups } from '@/content/skills'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Resume',
  description:
    'Download Kamlesh Chhipa’s résumé (PDF) or read the summary — 4+ years backend and full-stack engineering, currently building LLM infrastructure at BrightEdge.',
  path: '/resume',
})

export default function ResumePage() {
  return (
    <div className="page-shell">
      <div className="eyebrow">Resume</div>
      <h1 className="page-title">The short version, and the PDF.</h1>
      <p className="page-lede">
        Backend Software Engineer (SDE-II) with 4+ years building large-scale data platforms
        and LLM-driven systems. Below is a quick summary — the full résumé is one click away.
      </p>

      <div style={{ marginBottom: 'clamp(32px,5vh,56px)' }}>
        <HandDrawnButton href="/kamlesh-chhipa-resume.pdf" download>
          Download résumé (PDF)
        </HandDrawnButton>
      </div>

      <InkRule />

      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="Experience, at a glance">Roles</SectionHeading>
        {experience.map((entry) => (
          <div key={entry.slug} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <strong style={{ fontFamily: 'var(--font-caveat)', fontSize: 20, color: 'var(--char-deep)' }}>
                {entry.role} · {entry.company}
              </strong>
              <span className="card-meta" style={{ marginBottom: 0 }}>
                {entry.range.start} – {entry.range.end}
              </span>
            </div>
            <p style={{ color: 'var(--graphite)', marginTop: 4 }}>{entry.summary}</p>
          </div>
        ))}
      </RevealSection>

      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="Skills, at a glance">Capabilities</SectionHeading>
        <div className="content-grid cols-2">
          {skillGroups.map((g) => (
            <div key={g.category}>
              <strong style={{ fontFamily: 'var(--font-caveat)', fontSize: 18, color: 'var(--char-deep)' }}>
                {g.label}
              </strong>
              <p style={{ color: 'var(--graphite)', marginTop: 4 }}>{g.skills.join(', ')}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection as="section" className="section-block">
        <p style={{ color: 'var(--graphite-s)', fontStyle: 'italic' }}>
          Want the deeper version of any of this? See{' '}
          <a className="link-plain" href="/experience" style={{ fontStyle: 'italic' }}>Experience</a>{' '}
          or{' '}
          <a className="link-plain" href="/projects" style={{ fontStyle: 'italic' }}>Projects</a>.
        </p>
      </RevealSection>
    </div>
  )
}

import InkRule from '@/components/ui/InkRule'
import SectionHeading from '@/components/ui/SectionHeading'
import RevealSection from '@/components/ui/RevealSection'
import Card from '@/components/ui/Card'
import SketchIcon, { type SketchIconName } from '@/components/ui/SketchIcon'
import { skillGroups } from '@/content/skills'
import type { SkillCategory } from '@/content/types'
import PageSchema from '@/components/seo/PageSchema'
import { pageMetadata } from '@/lib/seo'

const categoryIcons: Record<SkillCategory, SketchIconName> = {
  backend: 'server',
  'data-ai': 'spark',
  frontend: 'layers',
  'cloud-devops': 'cloud',
}

const PAGE_DESCRIPTION =
  'Kamlesh Chhipa’s skills grouped by use: backend (Python, FastAPI, Django), data & AI infra (Trino, ClickHouse, vLLM), frontend (React, Next.js), cloud & DevOps.'

export const metadata = pageMetadata({
  title: 'Skills & Expertise',
  description:
    PAGE_DESCRIPTION,
  path: '/skills',
})

export default function SkillsPage() {
  return (
    <div className="page-shell">
      <PageSchema path="/skills" type="WebPage" name="Skills & Expertise" description={PAGE_DESCRIPTION} />
      <div className="eyebrow">Skills &amp; Expertise</div>
      <h1 className="page-title">A capability map, not a keyword list.</h1>
      <p className="page-lede">
        Organized the way I actually use them — grounded in shipped work, not a resume
        keyword sweep. Four categories, each backed by production experience.
      </p>

      <InkRule />

      <div className="content-grid cols-2">
        {skillGroups.map((group) => (
          <RevealSection key={group.category} as="section" className="section-block">
            <Card>
              <SketchIcon name={categoryIcons[group.category]} className="capability-icon" />
              <SectionHeading level={2}>{group.label}</SectionHeading>
              <p style={{ marginBottom: 16 }}>{group.description}</p>
              <div className="stack-tags">
                {group.skills.map((s) => (
                  <span key={s} className="stack-tag">{s}</span>
                ))}
              </div>
            </Card>
          </RevealSection>
        ))}
      </div>
    </div>
  )
}

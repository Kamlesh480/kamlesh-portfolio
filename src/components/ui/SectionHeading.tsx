interface SectionHeadingProps {
  eyebrow?: string
  children: React.ReactNode
  level?: 2 | 3
  id?: string
}

/**
 * The eyebrow-label + hand-lettered heading pattern used to introduce a
 * section on every non-Home page. Renders a real <h2>/<h3> — never a
 * styled non-semantic wrapper — so page structure stays crawlable.
 */
export default function SectionHeading({ eyebrow, children, level = 2, id }: SectionHeadingProps) {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <div className="section-heading-wrap">
      {eyebrow && <div className="eyebrow section-eyebrow">{eyebrow}</div>}
      <Heading id={id} className={level === 2 ? 'section-heading' : 'section-heading section-heading-sm'}>
        {children}
      </Heading>
    </div>
  )
}

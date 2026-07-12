import InkRule from '@/components/ui/InkRule'
import RevealSection from '@/components/ui/RevealSection'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Engineering Notes',
  description:
    'Engineering write-ups from Kamlesh Chhipa on distributed data systems, LLM infrastructure, and performance — coming soon.',
  path: '/blog',
})

export default function BlogPage() {
  return (
    <div className="page-shell">
      <div className="eyebrow">Engineering Notes</div>
      <h1 className="page-title">Writing, coming soon.</h1>
      <p className="page-lede">
        Notes on the systems I&apos;ve been building — data pipelines, LLM infrastructure,
        and the performance work in between. Nothing published yet, but this page is
        reserved and will fill in as there&apos;s something worth writing.
      </p>

      <InkRule />

      <RevealSection as="section" className="section-block">
        <p style={{ color: 'var(--graphite-s)', fontStyle: 'italic' }}>
          ✦ Check back soon, or see the{' '}
          <a className="link-plain" href="/projects" style={{ fontStyle: 'italic' }}>
            Projects
          </a>{' '}
          page for what I&apos;ve shipped in the meantime.
        </p>
      </RevealSection>
    </div>
  )
}

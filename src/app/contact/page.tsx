import InkRule from '@/components/ui/InkRule'
import RevealSection from '@/components/ui/RevealSection'
import HandDrawnButton from '@/components/ui/HandDrawnButton'
import ContactForm from './ContactForm'
import PageSchema from '@/components/seo/PageSchema'
import { pageMetadata } from '@/lib/seo'

const PAGE_DESCRIPTION =
  'Get in touch with Kamlesh Chhipa: open to Senior Backend, Platform, and Full-Stack engineering roles in product-led, AI-driven teams.'

export const metadata = pageMetadata({
  title: 'Contact',
  description:
    PAGE_DESCRIPTION,
  path: '/contact',
})

const EMAIL = 'kamleshchhipa480@gmail.com'
const LINKEDIN = 'https://www.linkedin.com/in/kamlesh-chhipa/'
const GITHUB = 'https://github.com/Kamlesh480'

export default function ContactPage() {
  return (
    <div className="page-shell">
      <PageSchema path="/contact" type="ContactPage" name="Contact" description={PAGE_DESCRIPTION} />
      <div className="eyebrow">Contact</div>
      <h1 className="page-title">Let&apos;s talk about what you&apos;re building.</h1>
      <p className="page-lede">
        Open to Senior Backend / Platform / Full-Stack roles, and always happy to hear about
        a hard data or infrastructure problem, even if it&apos;s just to talk shop.
      </p>

      <InkRule />

      <RevealSection as="section" className="section-block">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <HandDrawnButton href={`mailto:${EMAIL}`} external>
            {EMAIL}
          </HandDrawnButton>
          <a className="link-plain" href={LINKEDIN} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a className="link-plain" href={GITHUB} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a className="link-plain" href="/kamlesh-chhipa-resume.pdf" download>
            Download résumé
          </a>
        </div>
        <p style={{ color: 'var(--graphite-s)', fontStyle: 'italic', maxWidth: '50ch' }}>
          These links work even with JavaScript off: no form required.
        </p>
      </RevealSection>

      <RevealSection as="section" className="section-block">
        <ContactForm email={EMAIL} />
      </RevealSection>
    </div>
  )
}

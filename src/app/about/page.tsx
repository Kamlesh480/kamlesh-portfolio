import InkRule from '@/components/ui/InkRule'
import SectionHeading from '@/components/ui/SectionHeading'
import RevealSection from '@/components/ui/RevealSection'
import HandDrawnButton from '@/components/ui/HandDrawnButton'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'About',
  description:
    'Kamlesh Chhipa — from ETL scripts to founding engineer on a production healthcare SaaS platform, and the philosophy behind how he builds.',
  path: '/about',
})

const stats = [
  { value: '4+', label: 'years building production systems' },
  { value: '5B+', label: 'tokens/month in LLM infra owned' },
  { value: '0→1', label: 'a product taken from empty repo to paying customers' },
]

export default function AboutPage() {
  return (
    <div className="page-shell">
      <div className="eyebrow">About</div>
      <h1 className="page-title">
        From ETL scripts to founding
        <br />
        engineer on a live SaaS product.
      </h1>
      <p className="page-lede">
        I&apos;m Kamlesh — a backend-first engineer based in Bengaluru who&apos;s just as
        comfortable owning an entire product end-to-end. I specialize in Python-based backend
        engineering, distributed data pipelines, and production AI infrastructure — and as
        founding engineer on Lumen, I took a healthcare SaaS platform from an empty
        repository to real paying customers, alone, before hiring the team that runs it today.
      </p>

      <InkRule />

      <RevealSection as="section" className="section-block">
        <div className="content-grid cols-3" style={{ marginBottom: 'clamp(40px,6vh,72px)' }}>
          {stats.map((s) => (
            <div key={s.label}>
              <div className="page-title" style={{ fontSize: 'clamp(36px,4vw,56px)', marginBottom: 4 }}>
                {s.value}
              </div>
              <p style={{ color: 'var(--graphite)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="The journey">My path here</SectionHeading>
        <p style={{ color: 'var(--graphite)', lineHeight: 1.7, maxWidth: '68ch', marginBottom: 18 }}>
          I started at DUIT Technologies writing Python ETL scripts and evaluating machine
          learning APIs — unglamorous work that taught me the thing that&apos;s stuck with me
          since: most of engineering is making messy, real-world data behave. From there I
          spent over three years at Hevo Data as a full-stack engineer, where I learned that
          the line between &quot;backend&quot; and &quot;frontend&quot; matters far less than the line between
          &quot;shipped and measured&quot; and &quot;not.&quot; I owned APIs, migrated a Django site to Next.js,
          ran A/B tests, and watched Core Web Vitals move because of decisions I made.
        </p>
        <p style={{ color: 'var(--graphite)', lineHeight: 1.7, maxWidth: '68ch', marginBottom: 18 }}>
          Now at BrightEdge, I architect the LLM infrastructure that processes over 5 billion
          tokens a month — the kind of scale where a naive design doesn&apos;t just run slowly, it
          becomes unaffordable. Moving inference onto a self-hosted GPU platform and cutting
          our AI processing bill 62% is one of the projects I&apos;m proudest of, not because of
          the percentage, but because it&apos;s exactly the kind of problem I want more of: real
          constraints, real budget, real consequences for getting the architecture wrong.
        </p>
        <p style={{ color: 'var(--graphite)', lineHeight: 1.7, maxWidth: '68ch' }}>
          Alongside that, I&apos;m the founding engineer on Lumen — a healthcare claims platform
          that didn&apos;t exist when I joined. No codebase, no architecture, no team. I built the
          whole thing: frontend, backend, infrastructure, billing, the data pipeline, all of
          it — then hired and onboarded the engineers who&apos;ve joined since. It&apos;s the clearest
          proof I have that I can take a product from nothing to production and keep it
          running once real customers depend on it.
        </p>
      </RevealSection>

      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="Standout project">Building Lumen from zero</SectionHeading>
        <p style={{ color: 'var(--graphite)', lineHeight: 1.7, maxWidth: '68ch', marginBottom: 24 }}>
          If you want the concrete version of &quot;can this person own a whole product&quot; —
          this is it. Dual-database architecture, a full Stripe billing lifecycle, RBAC,
          an automated data pipeline with QA gating, and a team I hired and still mentor.
          Built from a blank repository to a platform real healthcare organizations use daily.
        </p>
        <HandDrawnButton href="/projects#lumen">Read the full case study</HandDrawnButton>
      </RevealSection>

      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="How I work">What I actually care about</SectionHeading>
        <div className="content-grid cols-2">
          <div>
            <h3 style={{ fontFamily: 'var(--font-caveat)', fontSize: 24, color: 'var(--char-deep)', marginBottom: 8 }}>
              Deterministic over clever
            </h3>
            <p style={{ color: 'var(--graphite)', lineHeight: 1.65 }}>
              At the scale I work at — billions of tokens, billions of events — a clever
              system that&apos;s hard to reason about will eventually fail in a way nobody can
              debug at 2am. I&apos;d rather build something boring that&apos;s always right.
            </p>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-caveat)', fontSize: 24, color: 'var(--char-deep)', marginBottom: 8 }}>
              Cost is a design constraint
            </h3>
            <p style={{ color: 'var(--graphite)', lineHeight: 1.65 }}>
              Every infrastructure decision I&apos;ve made that mattered — Trino over BigQuery
              UDFs, self-hosted vLLM over hosted APIs — came from treating monthly cost as a
              real architectural constraint, not an afterthought for finance to worry about.
            </p>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-caveat)', fontSize: 24, color: 'var(--char-deep)', marginBottom: 8 }}>
              Own it end-to-end
            </h3>
            <p style={{ color: 'var(--graphite)', lineHeight: 1.65 }}>
              I&apos;d rather ship a feature from API to UI to the metric that proves it worked
              than hand off at the API boundary. It&apos;s why Lumen exists as a single product I
              built top to bottom, and why I built every interaction on this site myself.
            </p>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-caveat)', fontSize: 24, color: 'var(--char-deep)', marginBottom: 8 }}>
              Comfortable being the first hire
            </h3>
            <p style={{ color: 'var(--graphite)', lineHeight: 1.65 }}>
              Being founding engineer means there&apos;s no one to ask when the architecture
              doesn&apos;t exist yet. I don&apos;t just tolerate that — building Lumen from an empty
              repo to production customers is the work I&apos;m most proud of.
            </p>
          </div>
        </div>
      </RevealSection>

      <RevealSection as="section" className="section-block">
        <SectionHeading eyebrow="What's next">Open to the right problem</SectionHeading>
        <p style={{ color: 'var(--graphite)', lineHeight: 1.7, maxWidth: '62ch', marginBottom: 28 }}>
          I&apos;m open to SDE-2 / SDE-3 backend, platform, or full-stack roles in product-led,
          AI-driven teams — and to founding/lead engineering engagements for startups and
          founders who need someone who can take a product from idea to production alone.
        </p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <HandDrawnButton href="/experience">See the full experience</HandDrawnButton>
          <a className="link-plain" href="/contact">Get in touch</a>
        </div>
      </RevealSection>
    </div>
  )
}

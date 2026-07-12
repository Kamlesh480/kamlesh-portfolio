import type { Metadata, Viewport } from 'next'
import { Caveat, Cormorant_Garamond } from 'next/font/google'
import SiteChrome from '@/components/chrome/SiteChrome'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import JsonLd from '@/components/seo/JsonLd'
import { SITE_URL, SITE_NAME, baseOpenGraph, baseTwitter } from '@/lib/seo'
import './globals.css'

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-caveat',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Kamlesh Chhipa — Senior Software Engineer & AI Infra Engineer',
    template: '%s | Kamlesh Chhipa',
  },
  description:
    'Kamlesh Chhipa is a backend and full-stack software engineer with 4+ years building large-scale data platforms and production LLM infrastructure. Based in Bengaluru, India.',
  openGraph: {
    ...baseOpenGraph,
    title: 'Kamlesh Chhipa — Senior Software Engineer & AI Infra Engineer',
    description:
      'Backend and full-stack engineer with 4+ years building large-scale data platforms and production LLM infrastructure.',
    url: SITE_URL,
  },
  twitter: baseTwitter,
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  themeColor: '#161410',
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: SITE_NAME,
  jobTitle: 'Software Development Engineer 2 (Backend & AI Infrastructure)',
  url: SITE_URL,
  image: `${SITE_URL}/og-image.png`,
  worksFor: { '@type': 'Organization', name: 'BrightEdge' },
  address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressCountry: 'IN' },
  sameAs: ['https://www.linkedin.com/in/kamleshchhipa', 'https://github.com/Kamlesh480'],
  knowsAbout: [
    'Python', 'FastAPI', 'Django', 'Backend Engineering', 'Distributed Systems',
    'Data Pipelines', 'Trino', 'Apache Iceberg', 'ClickHouse', 'Apache Spark', 'BigQuery',
    'LLM Infrastructure', 'AI Engineering', 'vLLM', 'React', 'Next.js', 'TypeScript',
    'Kubernetes', 'Docker', 'AWS', 'Google Cloud Platform', 'System Design',
  ],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${cormorant.variable}`}>
      <body>
        <JsonLd data={personJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <SiteChrome />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}

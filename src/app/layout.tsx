import type { Metadata, Viewport } from 'next'
import { Caveat, Cormorant_Garamond } from 'next/font/google'
import SiteChrome from '@/components/chrome/SiteChrome'
import SiteHeader from '@/components/layout/SiteHeader'
import AnnouncementBar from '@/components/chrome/AnnouncementBar'
import SiteFooter from '@/components/layout/SiteFooter'
import JsonLd from '@/components/seo/JsonLd'
import { graph, personNode, websiteNode } from '@/lib/schema'
import { SITE_URL, baseOpenGraph, baseTwitter } from '@/lib/seo'
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
    'Backend and full-stack engineer in Bengaluru with 4+ years building large-scale data platforms and production LLM infrastructure.',
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
  // Match the paper background so mobile browser chrome reads as part of the
  // light page — a charcoal themeColor here made the whole site feel like a
  // dark theme on phones even though the page itself is paper-light.
  themeColor: '#f6f3ec',
}

/* Site-wide entity graph. Person and WebSite carry stable @ids that every
   page-level node (WebPage, BreadcrumbList, Article) references, so a crawler
   reads one connected graph instead of repeated, unrelated blobs.
   See src/lib/schema.ts. */
const siteJsonLd = graph([personNode(), websiteNode()])

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${cormorant.variable}`}>
      <body>
        <JsonLd data={siteJsonLd} />
        <SiteChrome />
        {/* Banner + nav travel together as one sticky unit. SiteChrome stays
            OUTSIDE it — it must remain a direct child of <body>. */}
        <div className="site-top">
          <AnnouncementBar />
          <SiteHeader />
        </div>
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}

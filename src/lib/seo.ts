import type { Metadata } from 'next'

type OpenGraph = NonNullable<Metadata['openGraph']>
type Twitter = NonNullable<Metadata['twitter']>

/**
 * Single indirection point for the site's canonical URL. No real domain has
 * been purchased yet — every SEO file imports SITE_URL from here, so buying
 * one later is a single env var change, not a code change.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kamlesh-chhipa.example'

export const SITE_NAME = 'Kamlesh Chhipa'

/**
 * Shared Open Graph/Twitter defaults. App Router metadata merges shallowly
 * per top-level key — a page that sets its own `openGraph` REPLACES the
 * parent's entirely rather than deep-merging, so every page-level override
 * must spread these in rather than only setting `title`/`description`.
 */
export const baseOpenGraph: OpenGraph = {
  siteName: SITE_NAME,
  locale: 'en_US',
  type: 'website',
  images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: SITE_NAME }],
}

export const baseTwitter: Twitter = {
  card: 'summary_large_image',
}

/**
 * Builds a page's `metadata` export. Spreads baseOpenGraph in (rather than
 * letting the page set a bare `openGraph: {title, description}`) because
 * App Router metadata merges shallowly per top-level key — a child's
 * `openGraph` object REPLACES the parent's entirely, so skipping the spread
 * would silently drop siteName/images on every page that used this helper.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): import('next').Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...baseOpenGraph,
      title,
      description,
      url: `${SITE_URL}${path}`,
    },
    twitter: baseTwitter,
  }
}

import type { Metadata } from 'next'

type OpenGraph = NonNullable<Metadata['openGraph']>
type Twitter = NonNullable<Metadata['twitter']>

const FALLBACK_SITE_URL = 'https://kamlesh-chhipa.example'

/**
 * Resolves the configured site URL defensively. Two failure modes matter
 * here, not just "unset":
 *  - Empty string: a `??` fallback does NOT catch this (`??` only triggers on
 *    null/undefined) — an env var present-but-blank (e.g. saved with an empty
 *    value in a hosting dashboard) silently produces SITE_URL = '', and
 *    `new URL('')` in layout.tsx throws `ERR_INVALID_URL` at build time,
 *    taking down every single page. This happened in production.
 *  - Malformed value (e.g. missing the `https://` scheme): would also throw
 *    from `new URL()` downstream. Validated here instead, once, so the
 *    failure is a clear fallback rather than a cryptic build crash.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return FALLBACK_SITE_URL
  try {
    // Normalize away any trailing slash so `${SITE_URL}${path}` never
    // produces a double slash.
    return new URL(raw).origin
  } catch {
    console.warn(
      `[seo] NEXT_PUBLIC_SITE_URL is set but not a valid URL: "${raw}" — falling back to ${FALLBACK_SITE_URL}`
    )
    return FALLBACK_SITE_URL
  }
}

/**
 * Single indirection point for the site's canonical URL. Every SEO file
 * imports SITE_URL from here, so changing the domain is a single env var
 * change, not a code change.
 */
export const SITE_URL = resolveSiteUrl()

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

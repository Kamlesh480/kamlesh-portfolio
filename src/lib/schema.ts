import { SITE_URL } from './seo'
import { routes } from './routes'

/**
 * Structured data (schema.org JSON-LD) for the whole site.
 *
 * Emitted as a single `@graph` per page rather than several standalone blocks,
 * with stable `@id`s so nodes can REFERENCE each other instead of repeating
 * themselves. That's what lets a crawler understand "this WebPage is part of
 * this WebSite, and is about this Person" as one connected entity graph — the
 * same approach the mainstream SEO plugins use, and what Google's own docs
 * assume when they talk about entity understanding.
 *
 * Add a page: drop `<PageSchema path="/x" />` into it. Breadcrumb labels come
 * from `routes.ts`, so nav, sitemap, and structured data can never disagree.
 */

const SITE_NAME = 'Kamlesh Chhipa'

/* Stable node ids — a fragment on a canonical URL, per the usual convention. */
export const ID = {
  person: `${SITE_URL}/#person`,
  website: `${SITE_URL}/#website`,
  webpage: (path: string) => `${SITE_URL}${path === '/' ? '/' : path}#webpage`,
  breadcrumb: (path: string) => `${SITE_URL}${path === '/' ? '/' : path}#breadcrumb`,
  article: (path: string) => `${SITE_URL}${path}#article`,
}

const abs = (path: string) => `${SITE_URL}${path === '/' ? '' : path}` || SITE_URL

/* ---- entity nodes (site-wide, emitted once in the root layout) ---------- */

export function personNode() {
  return {
    '@type': 'Person',
    '@id': ID.person,
    name: SITE_NAME,
    jobTitle: 'Software Development Engineer 2 (Backend & AI Infrastructure)',
    description:
      'Backend and full-stack engineer building large-scale data platforms and production LLM infrastructure.',
    url: SITE_URL,
    image: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png`, caption: SITE_NAME },
    worksFor: { '@type': 'Organization', name: 'BrightEdge' },
    address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressCountry: 'IN' },
    sameAs: ['https://www.linkedin.com/in/kamlesh-chhipa/', 'https://github.com/Kamlesh480'],
    knowsAbout: [
      'Python', 'FastAPI', 'Django', 'Backend Engineering', 'Distributed Systems',
      'Data Pipelines', 'Trino', 'Apache Iceberg', 'ClickHouse', 'Apache Spark', 'BigQuery',
      'LLM Infrastructure', 'AI Engineering', 'vLLM', 'React', 'Next.js', 'TypeScript',
      'Kubernetes', 'Docker', 'AWS', 'Google Cloud Platform', 'System Design',
    ],
  }
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': ID.website,
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Portfolio and engineering notes of Kamlesh Chhipa — backend, data platform, and AI infrastructure engineering.',
    inLanguage: 'en',
    publisher: { '@id': ID.person },
  }
}

/* ---- per-page nodes ----------------------------------------------------- */

/** Human label for a path, from routes.ts so nav and schema stay in lockstep. */
function labelFor(path: string): string {
  return routes.find((r) => r.path === path)?.label ?? 'Home'
}

export type Crumb = { name: string; path: string }

/**
 * Home is always the first crumb and is NOT repeated as the last one.
 * Google requires the trail to reflect the page's real position.
 */
export function breadcrumbNode(path: string, extra?: Crumb[]) {
  const crumbs: Crumb[] = [{ name: 'Home', path: '/' }]
  if (path !== '/') crumbs.push({ name: labelFor(path), path })
  if (extra) crumbs.push(...extra)

  return {
    '@type': 'BreadcrumbList',
    '@id': ID.breadcrumb(extra?.length ? extra[extra.length - 1].path : path),
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  }
}

/** More specific WebPage subtypes give crawlers a stronger signal than plain WebPage. */
export type PageType =
  | 'WebPage'
  | 'AboutPage'
  | 'ContactPage'
  | 'CollectionPage'
  | 'ProfilePage'

export function webPageNode({
  path,
  name,
  description,
  type = 'WebPage',
  breadcrumbId,
}: {
  path: string
  name: string
  description?: string
  type?: PageType
  breadcrumbId?: string
}) {
  return {
    '@type': type,
    '@id': ID.webpage(path),
    url: abs(path),
    name,
    ...(description ? { description } : {}),
    isPartOf: { '@id': ID.website },
    about: { '@id': ID.person },
    inLanguage: 'en',
    ...(breadcrumbId ? { breadcrumb: { '@id': breadcrumbId } } : {}),
  }
}

/** Article node for a blog post, linked to its page and author. */
export function articleNode(post: {
  slug: string
  title: string
  description: string
  date: string
  updated?: string
  tags: string[]
  category: string
  wordCount: number
}) {
  const path = `/blog/${post.slug}`
  return {
    '@type': 'TechArticle',
    '@id': ID.article(path),
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { '@id': ID.person },
    publisher: { '@id': ID.person },
    isPartOf: { '@id': ID.webpage(path) },
    mainEntityOfPage: { '@id': ID.webpage(path) },
    keywords: post.tags.join(', '),
    articleSection: post.category,
    wordCount: post.wordCount,
    inLanguage: 'en',
  }
}

/** ItemList for listing pages, so the collection's members are explicit. */
export function itemListNode(items: { name: string; path: string }[], name: string) {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: abs(it.path),
    })),
  }
}

/** Wrap nodes into the single @graph document emitted per page. */
export function graph(nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes }
}

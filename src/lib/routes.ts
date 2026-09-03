export type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

/** Footer column a route belongs to. Adding a route to a column is the ONLY
 *  step needed to get it into the footer — SiteFooter renders from this. */
export type FooterGroup = 'work' | 'writing' | 'about'

export interface SiteRoute {
  path: string
  label: string
  /** Shown in the primary hand-drawn header nav (limited slots by design). */
  inHeader: boolean
  /** Shown in the footer's sitemap columns. */
  inFooter: boolean
  /** Shorter label for the header nav, where horizontal space is tight.
   *  Falls back to `label`. */
  navLabel?: string
  /** Which footer column. Omit and the route is left out of the columns. */
  group?: FooterGroup
  changeFrequency: ChangeFrequency
  priority: number
}

/** Column order and headings. */
export const footerGroups: { id: FooterGroup; label: string }[] = [
  { id: 'work', label: 'The work' },
  { id: 'writing', label: 'Writing' },
  { id: 'about', label: 'About' },
]

/**
 * Single source of truth for every route on the site — consumed by
 * SiteHeader, SiteFooter, sitemap.ts, and breadcrumbs. Keeping one array
 * means the nav, the footer sitemap, and the generated sitemap.xml can
 * never drift out of sync with each other.
 */
export const routes: SiteRoute[] = [
  { path: '/', label: 'Home', inHeader: false, inFooter: true, group: 'about', changeFrequency: 'monthly', priority: 1.0 },
  { path: '/about', label: 'About', inHeader: true, inFooter: true, group: 'about', changeFrequency: 'yearly', priority: 0.7 },
  { path: '/experience', label: 'Experience', inHeader: true, inFooter: true, group: 'work', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/projects', label: 'Projects', inHeader: true, inFooter: true, group: 'work', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/skills', label: 'Skills', inHeader: true, inFooter: true, group: 'work', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', label: 'Contact', inHeader: true, inFooter: true, group: 'about', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/architecture', label: 'Architecture', inHeader: false, inFooter: true, group: 'work', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/blog', label: 'Engineering Notes', navLabel: 'Blog', inHeader: true, inFooter: true, group: 'writing', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/resume', label: 'Resume', inHeader: false, inFooter: true, group: 'about', changeFrequency: 'yearly', priority: 0.7 },
]

export const headerRoutes = routes.filter((r) => r.inHeader)
export const footerRoutes = routes.filter((r) => r.inFooter)
/** Routes for one footer column, in declaration order. */
export const routesInGroup = (g: FooterGroup) =>
  routes.filter((r) => r.inFooter && r.group === g)

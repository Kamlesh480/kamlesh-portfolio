export type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

export interface SiteRoute {
  path: string
  label: string
  /** Shown in the primary hand-drawn header nav (limited slots by design). */
  inHeader: boolean
  /** Shown in the footer's full sitemap list. */
  inFooter: boolean
  changeFrequency: ChangeFrequency
  priority: number
}

/**
 * Single source of truth for every route on the site — consumed by
 * SiteHeader, SiteFooter, sitemap.ts, and breadcrumbs. Keeping one array
 * means the nav, the footer sitemap, and the generated sitemap.xml can
 * never drift out of sync with each other.
 */
export const routes: SiteRoute[] = [
  { path: '/', label: 'Home', inHeader: false, inFooter: true, changeFrequency: 'monthly', priority: 1.0 },
  { path: '/about', label: 'About', inHeader: true, inFooter: true, changeFrequency: 'yearly', priority: 0.7 },
  { path: '/experience', label: 'Experience', inHeader: true, inFooter: true, changeFrequency: 'monthly', priority: 0.8 },
  { path: '/projects', label: 'Projects', inHeader: true, inFooter: true, changeFrequency: 'monthly', priority: 0.8 },
  { path: '/skills', label: 'Skills', inHeader: true, inFooter: true, changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', label: 'Contact', inHeader: true, inFooter: true, changeFrequency: 'yearly', priority: 0.5 },
  { path: '/architecture', label: 'Architecture', inHeader: false, inFooter: true, changeFrequency: 'monthly', priority: 0.7 },
  { path: '/blog', label: 'Engineering Notes', inHeader: false, inFooter: true, changeFrequency: 'weekly', priority: 0.6 },
  { path: '/resume', label: 'Resume', inHeader: false, inFooter: true, changeFrequency: 'yearly', priority: 0.7 },
]

export const headerRoutes = routes.filter((r) => r.inHeader)
export const footerRoutes = routes.filter((r) => r.inFooter)

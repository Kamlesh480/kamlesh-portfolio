import type { MetadataRoute } from 'next'
import { routes } from '@/lib/routes'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  // Deliberately no `lastModified` — a fabricated static date provides no
  // real signal. Add it once there's a real data source (e.g. blog
  // frontmatter dates) driving it.
  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}

import type { MetadataRoute } from 'next'
import { routes } from '@/lib/routes'
import { SITE_URL } from '@/lib/seo'
import { getAllPosts } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  // Static routes still carry no `lastModified` — a fabricated date is no signal.
  const staticRoutes = routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // Blog posts DO have a real source of truth (frontmatter), so they get a
  // genuine lastModified. Drafts are already excluded by getAllPosts().
  const postRoutes = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(`${post.updated ?? post.date}T00:00:00Z`),
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...postRoutes]
}

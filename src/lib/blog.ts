import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { BlogFrontmatter, BlogPost } from '@/content/types'

/**
 * Reads and indexes the markdown posts in `src/content/blog/`.
 *
 * Server-only: this touches the filesystem, so it must never be imported into a
 * Client Component. Every consumer prerenders at build time (the whole site is
 * static), so no `.md` file is ever read at request time in production.
 *
 * Adding a post = dropping one `.md` file in that directory. Nothing here or in
 * the page templates needs editing — see `src/content/blog/README.md`.
 */

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog')
const WORDS_PER_MINUTE = 210

/** Show drafts while developing, never in a production build. */
const SHOW_DRAFTS = process.env.NODE_ENV === 'development'

function readingTimeOf(body: string): number {
  // Strip fenced code, inline code, and container markers so a long code sample
  // doesn't inflate the estimate the way a raw word count would.
  const prose = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/^:::.*$/gm, ' ')
  const words = prose.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

function parseFile(filename: string): BlogPost | null {
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8')
  const { data, content } = matter(raw)
  const fm = data as Partial<BlogFrontmatter>
  // Frontmatter `slug` wins so the URL can be keyword-targeted and permanent
  // while the filename stays whatever is convenient to organise by.
  const slug = fm.slug?.trim() || filename.replace(/\.md$/, '')

  // Fail loudly at build time rather than rendering a half-broken post.
  const missing = (['title', 'description', 'date', 'category'] as const).filter((k) => !fm[k])
  if (missing.length) {
    throw new Error(
      `Blog post "${filename}" is missing required frontmatter: ${missing.join(', ')}. ` +
        `See src/content/blog/README.md for the required fields.`
    )
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      `Blog post "${filename}" has an invalid slug "${slug}". Use lowercase words ` +
        `separated by single hyphens (a-z, 0-9), e.g. "scaling-serp-keyword-collection-pipeline".`
    )
  }

  // Nudge, not an error — a slug is a permanent, keyword-bearing URL, and
  // internal codenames ("acme-collector-v2") rank for nothing and leak employer names.
  if (SHOW_DRAFTS) {
    const looksLikeCodename = /(^|-)v\d+($|-)/.test(slug) || slug.split('-').length < 3
    if (looksLikeCodename) {
      console.warn(
        `[blog] Slug "${slug}" looks like an internal codename or is very short. ` +
          `URLs rank on keywords — prefer 3–6 descriptive words from the article's topic. ` +
          `Set \`slug:\` in frontmatter to control it independently of the filename.`
      )
    }
  }

  if (fm.draft && !SHOW_DRAFTS) return null

  return {
    slug,
    title: fm.title!,
    seoTitle: fm.seoTitle,
    description: fm.description!,
    date: fm.date!,
    updated: fm.updated,
    category: fm.category!,
    tags: fm.tags ?? [],
    featured: fm.featured ?? false,
    draft: fm.draft ?? false,
    coverTitle: fm.coverTitle,
    cover: fm.cover,
    body: content,
    readingTime: readingTimeOf(content),
  }
}

/** Every publishable post, newest first. */
export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs
    .readdirSync(BLOG_DIR)
    .filter(
      (f) =>
        f.endsWith('.md') &&
        // Docs and scratch files live alongside posts — a leading underscore or
        // an all-caps name (README, NOTES) is never a post.
        !f.startsWith('_') &&
        !/^[A-Z]+\.md$/.test(f)
    )
    .map(parseFile)
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

/** The pinned post, or the newest one if nothing is pinned. */
export function getFeaturedPost(posts = getAllPosts()): BlogPost | undefined {
  return posts.find((p) => p.featured) ?? posts[0]
}

export function getCategories(posts = getAllPosts()): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const p of posts) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function getTags(posts = getAllPosts()): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/** Case/spacing-insensitive match, so `?tag=Data Pipelines` works from a URL. */
const norm = (s: string) => s.toLowerCase().trim()

export function filterPosts(
  posts: BlogPost[],
  { category, tag }: { category?: string; tag?: string }
): BlogPost[] {
  return posts.filter(
    (p) =>
      (!category || norm(p.category) === norm(category)) &&
      (!tag || p.tags.some((t) => norm(t) === norm(tag)))
  )
}

/**
 * Related posts, most-shared-tags first, then same category, then recency.
 * Never returns the post itself.
 */
export function getRelatedPosts(post: BlogPost, limit = 3, posts = getAllPosts()): BlogPost[] {
  return posts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      post: p,
      score:
        p.tags.filter((t) => post.tags.some((x) => norm(x) === norm(t))).length * 2 +
        (norm(p.category) === norm(post.category) ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || (a.post.date < b.post.date ? 1 : -1))
    .slice(0, limit)
    .map((x) => x.post)
}

/** Chronological neighbours for prev/next navigation (newest-first array). */
export function getAdjacentPosts(slug: string, posts = getAllPosts()) {
  const i = posts.findIndex((p) => p.slug === slug)
  if (i === -1) return { previous: undefined, next: undefined }
  return {
    // "previous" reads as older, "next" as newer.
    previous: posts[i + 1],
    next: posts[i - 1],
  }
}

/** Minimal payload the client-side search box filters over. */
export function getSearchIndex(posts = getAllPosts()) {
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    tags: p.tags,
    date: p.date,
    readingTime: p.readingTime,
  }))
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

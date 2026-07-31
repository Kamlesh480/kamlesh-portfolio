'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type IndexedPost = {
  slug: string
  title: string
  description: string
  category: string
  tags: string[]
  date: string
  readingTime: number
}

/**
 * Instant client-side search over a prebuilt index.
 *
 * Category/tag filtering deliberately lives in the URL (server-rendered, so
 * those views are shareable and crawlable); only free-text search is here,
 * because a round trip per keystroke would feel broken. The index is metadata
 * only — a few hundred bytes per post, not article bodies.
 *
 * Renders nothing until the user types, so the server-rendered grid below stays
 * the default view and the page works fully without JS.
 */
export default function BlogSearch({ posts }: { posts: IndexedPost[] }) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()

  const results = useMemo(() => {
    if (query.length < 2) return null
    const terms = query.split(/\s+/)
    return posts.filter((p) => {
      const haystack = `${p.title} ${p.description} ${p.category} ${p.tags.join(' ')}`.toLowerCase()
      return terms.every((t) => haystack.includes(t))
    })
  }, [query, posts])

  return (
    <div className="blog-search">
      <label className="sr-only" htmlFor="blog-search-input">
        Search articles
      </label>
      <input
        id="blog-search-input"
        type="search"
        className="blog-search-input"
        placeholder="Search notes — try “pipeline”, “python”, “cost”…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
      />

      {results && (
        <div className="blog-search-results" role="status" aria-live="polite">
          {results.length === 0 ? (
            <p className="blog-search-empty">
              No notes match “{q}”. Try a broader term, or clear the search to see everything.
            </p>
          ) : (
            <>
              <p className="blog-search-count">
                {results.length} {results.length === 1 ? 'note' : 'notes'} matching “{q}”
              </p>
              <ul className="blog-search-list">
                {results.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`}>
                      <span className="blog-search-title">{p.title}</span>
                      <span className="blog-search-desc">{p.description}</span>
                      <span className="blog-search-meta">
                        {p.category} · {p.readingTime} min read
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

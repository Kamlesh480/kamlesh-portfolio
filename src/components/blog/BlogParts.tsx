import Link from 'next/link'
import type { BlogPost, TocEntry } from '@/content/types'
import type { BodySegment } from '@/lib/markdown'
import { formatDate } from '@/lib/blog'
import { projectDiagram } from '@/components/diagram/ProjectDiagrams'
import { experienceDiagram } from '@/components/diagram/ExperienceDiagrams'
import { decisionDiagram } from '@/components/diagram/ArchitectureDiagrams'
import { blogDiagram } from '@/components/diagram/BlogDiagrams'
import PostCover from './PostCover'

/**
 * Server-rendered building blocks for the blog. Everything here is a Server
 * Component — the only client JS on an article is BlogChrome.
 */

/** `:::diagram <slug>` resolves against every diagram set on the site, so a
 *  post can reuse the exact figure already published on /projects,
 *  /experience, or /architecture instead of duplicating it. */
export function resolveDiagram(slug: string) {
  return projectDiagram(slug) ?? experienceDiagram(slug) ?? decisionDiagram(slug) ?? blogDiagram(slug)
}

export function BlogBody({ segments }: { segments: BodySegment[] }) {
  return (
    <div id="post-body" className="post-body">
      {segments.map((seg, i) =>
        seg.kind === 'diagram' ? (
          <div key={i}>{resolveDiagram(seg.slug)}</div>
        ) : (
          // Content is authored by us and rendered at build time — see the
          // note in src/lib/markdown.ts before reusing this pattern.
          <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />
        )
      )}
    </div>
  )
}

/* ---- badges ------------------------------------------------------------- */

export function CategoryBadge({ name, asLink = true }: { name: string; asLink?: boolean }) {
  if (!asLink) return <span className="cat-badge">{name}</span>
  return (
    <Link className="cat-badge" href={`/blog?category=${encodeURIComponent(name)}`}>
      {name}
    </Link>
  )
}

export function TagBadge({ name }: { name: string }) {
  return (
    <Link className="tag-badge" href={`/blog?tag=${encodeURIComponent(name)}`}>
      #{name}
    </Link>
  )
}

export function PostMeta({ post, showUpdated }: { post: BlogPost; showUpdated?: boolean }) {
  return (
    <p className="post-meta">
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden="true"> · </span>
      <span>{post.readingTime} min read</span>
      {showUpdated && post.updated && (
        <>
          <span aria-hidden="true"> · </span>
          <span className="post-updated">Updated {formatDate(post.updated)}</span>
        </>
      )}
    </p>
  )
}

/* ---- cards -------------------------------------------------------------- */

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="blog-card">
      <Link href={`/blog/${post.slug}`} className="blog-card-cover" aria-hidden="true" tabIndex={-1}>
        <PostCover post={post} variant="card" />
      </Link>
      <div className="blog-card-body">
        <CategoryBadge name={post.category} />
        <h3>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="blog-card-excerpt">{post.description}</p>
        <PostMeta post={post} />
      </div>
    </article>
  )
}

export function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <article className="featured-card">
      <Link href={`/blog/${post.slug}`} className="featured-card-cover" aria-hidden="true" tabIndex={-1}>
        <PostCover post={post} variant="featured" />
      </Link>
      <div className="featured-card-body">
        <p className="eyebrow">Featured</p>
        <h2>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="featured-card-excerpt">{post.description}</p>
        <div className="tag-row">
          {post.tags.slice(0, 4).map((t) => (
            <TagBadge key={t} name={t} />
          ))}
        </div>
        <PostMeta post={post} />
        <Link className="featured-link" href={`/blog/${post.slug}`}>
          Read the write-up
        </Link>
      </div>
    </article>
  )
}

/* ---- article furniture -------------------------------------------------- */

export function TableOfContents({ toc }: { toc: TocEntry[] }) {
  if (toc.length < 2) return null
  return (
    <nav className="toc" aria-label="Table of contents">
      <p className="toc-title">On this page</p>
      <ol>
        {toc.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'toc-sub' : undefined}>
            <a className="toc-link" href={`#${h.id}`}>
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function ShareRow({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  return (
    <div className="share-row">
      <span className="share-label">Share</span>
      <a href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`} target="_blank" rel="noopener noreferrer">
        X
      </a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer">
        LinkedIn
      </a>
      <a href={`mailto:?subject=${t}&body=${u}`}>Email</a>
      {/* Enhanced by BlogChrome; without JS it simply isn't interactive. */}
      <button className="copy-link" type="button">
        <span className="copy-link-label">Copy link</span>
      </button>
    </div>
  )
}

export function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null
  // A fixed 3-column grid strands two empty columns when only one or two
  // related notes exist — which is the normal case on a young blog. The grid
  // adapts instead, and a lone note becomes a wide horizontal card.
  return (
    <section className="section-block" aria-labelledby="related-heading">
      <h2 id="related-heading" className="blog-section-title">
        Related notes
      </h2>
      <div className={`related-grid related-grid--${Math.min(posts.length, 3)}`}>
        {posts.map((p) => (
          <BlogCard key={p.slug} post={p} />
        ))}
      </div>
    </section>
  )
}

export function PrevNextNav({
  previous,
  next,
}: {
  previous?: BlogPost
  next?: BlogPost
}) {
  if (!previous && !next) return null
  return (
    <nav className="prev-next" aria-label="More articles">
      {previous ? (
        <Link href={`/blog/${previous.slug}`} className="prev-next-item">
          <span className="prev-next-dir">← Older</span>
          <span className="prev-next-title">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={`/blog/${next.slug}`} className="prev-next-item is-next">
          <span className="prev-next-dir">Newer →</span>
          <span className="prev-next-title">{next.title}</span>
        </Link>
      )}
    </nav>
  )
}

export function AuthorCard() {
  return (
    <aside className="author-card">
      <div>
        <p className="author-name">Kamlesh Chhipa</p>
        <p className="author-bio">
          Backend and full-stack engineer working on large-scale data platforms and production
          LLM infrastructure. These notes are the write-ups behind the systems on{' '}
          <Link className="link-plain" href="/projects">
            Projects
          </Link>
          .
        </p>
        <div className="author-links">
          <Link className="link-plain" href="/about">
            About
          </Link>
          <Link className="link-plain" href="/contact">
            Get in touch
          </Link>
        </div>
      </div>
    </aside>
  )
}

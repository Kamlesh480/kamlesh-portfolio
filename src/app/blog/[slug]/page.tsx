import { notFound } from 'next/navigation'
import Link from 'next/link'
import InkRule from '@/components/ui/InkRule'
import BlogChrome from '@/components/blog/BlogChrome'
import PostCover from '@/components/blog/PostCover'
import {
  BlogBody,
  CategoryBadge,
  TagBadge,
  TableOfContents,
  ShareRow,
  RelatedPosts,
  PrevNextNav,
  AuthorCard,
} from '@/components/blog/BlogParts'
import { getAllPosts, getPostBySlug, getRelatedPosts, getAdjacentPosts, formatDate } from '@/lib/blog'
import { renderPostBody } from '@/lib/markdown'
import PageSchema from '@/components/seo/PageSchema'
import { articleNode } from '@/lib/schema'
import { pageMetadata, SITE_URL } from '@/lib/seo'

/**
 * The one template every article uses. Adding a post never touches this file —
 * drop a `.md` in src/content/blog/ and it gets a route, metadata, cover,
 * table of contents, Article schema, and sitemap entry automatically.
 */

/** Prerender every post at build time — no runtime filesystem access. */
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

/** A slug that isn't in generateStaticParams should 404, not render on demand. */
export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return pageMetadata({ title: 'Not found', description: 'This note does not exist.', path: `/blog/${slug}` })

  const base = pageMetadata({
    title: post.seoTitle ?? post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
  })

  // `baseOpenGraph` pins the site-wide og-image.png. Any explicit `images` here
  // would OVERRIDE the generated per-post card from opengraph-image.tsx, so it
  // is stripped deliberately — Next then injects the generated one.
  const { images: _ogImages, ...og } = base.openGraph ?? {}
  const { images: _twImages, ...tw } = base.twitter ?? {}
  void _ogImages
  void _twImages

  return {
    ...base,
    openGraph: {
      ...og,
      type: 'article' as const,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: ['Kamlesh Chhipa'],
      tags: post.tags,
    },
    twitter: tw,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const { segments, toc } = await renderPostBody(post.body)
  const related = getRelatedPosts(post)
  const { previous, next } = getAdjacentPosts(post.slug)
  const url = `${SITE_URL}/blog/${post.slug}`

  return (
    <>
      <div className="read-progress-track" aria-hidden="true">
        <div id="read-progress" className="read-progress-bar" />
      </div>

      <article className="page-shell post-shell">
        <PageSchema
          path="/blog"
          name={post.title}
          description={post.description}
          extraCrumbs={[{ name: post.title, path: `/blog/${post.slug}` }]}
          nodes={[
            articleNode({
              slug: post.slug,
              title: post.title,
              description: post.description,
              date: post.date,
              updated: post.updated,
              tags: post.tags,
              category: post.category,
              wordCount: post.body.split(/\s+/).filter(Boolean).length,
            }),
          ]}
        />

        <nav className="post-breadcrumb" aria-label="Breadcrumb">
          <Link className="link-plain" href="/blog">
            ← Engineering Notes
          </Link>
        </nav>

        {/* Title block and cover share one row — the header alone left the
            entire right half of the fold empty. Stacks below 980px. */}
        <div className="post-hero">
        <header className="post-header">
          <CategoryBadge name={post.category} />
          <h1 className="page-title post-title">{post.title}</h1>
          <p className="page-lede post-description">{post.description}</p>

          <div className="post-byline">
            <span className="post-author">Kamlesh Chhipa</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingTime} min read</span>
            {post.updated && (
              <>
                <span aria-hidden="true">·</span>
                <span className="post-updated">Updated {formatDate(post.updated)}</span>
              </>
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="tag-row">
              {post.tags.map((t) => (
                <TagBadge key={t} name={t} />
              ))}
            </div>
          )}

          <ShareRow url={url} title={post.title} />
        </header>

        <PostCover post={post} variant="hero" />
        </div>

        <InkRule />

        <div className="post-layout">
          <aside className="post-aside">
            <TableOfContents toc={toc} />
          </aside>
          <div className="post-main">
            <BlogBody segments={segments} />
          </div>
        </div>

        <InkRule variant={1} />

        {/* Share + author stay in the reading column (they belong to the
            article); prev/next and related notes are discovery UI and span the
            full shell, otherwise they sit in a narrow strip with the whole
            right-hand side empty. */}
        <footer className="post-footer">
          <div className="post-footer-narrow">
            <ShareRow url={url} title={post.title} />
            <AuthorCard />
          </div>
          <PrevNextNav previous={previous} next={next} />
          <RelatedPosts posts={related} />
        </footer>
      </article>

      <BlogChrome />
    </>
  )
}

import Link from 'next/link'
import InkRule from '@/components/ui/InkRule'
import RevealSection from '@/components/ui/RevealSection'
import HandDrawnButton from '@/components/ui/HandDrawnButton'
import BlogSearch from '@/components/blog/BlogSearch'
import { BlogCard, FeaturedCard } from '@/components/blog/BlogParts'
import {
  getAllPosts,
  getFeaturedPost,
  getCategories,
  getTags,
  filterPosts,
  getSearchIndex,
} from '@/lib/blog'
import PageSchema from '@/components/seo/PageSchema'
import { pageMetadata } from '@/lib/seo'

const PAGE_DESCRIPTION =
  'Engineering write-ups from Kamlesh Chhipa on distributed data systems, LLM infrastructure, and performance work: with the numbers behind each decision.'

export const metadata = pageMetadata({
  title: 'Engineering Notes',
  description:
    PAGE_DESCRIPTION,
  path: '/blog',
})

/** Filters arrive as URL params so filtered views are shareable and crawlable;
 *  only free-text search runs on the client. */
export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>
}) {
  const { category, tag } = await searchParams
  const all = getAllPosts()
  const isFiltered = Boolean(category || tag)
  const posts = filterPosts(all, { category, tag })
  const featured = isFiltered ? undefined : getFeaturedPost(all)
  const rest = featured ? posts.filter((p) => p.slug !== featured.slug) : posts

  const categories = getCategories(all)
  const tags = getTags(all)

  return (
    <div className="page-shell">
      <PageSchema
        path="/blog"
        type="CollectionPage"
        name="Engineering Notes"
        description={PAGE_DESCRIPTION}
        itemsName="Engineering notes"
        items={all.map((p) => ({ name: p.title, path: `/blog/${p.slug}` }))}
      />
      <div className="eyebrow">Engineering Notes</div>
      <h1 className="page-title">Notes from the build.</h1>
      <p className="page-lede">
        Write-ups on the systems I&apos;ve been building: data pipelines, LLM infrastructure,
        and the performance work in between. Long-form where it earns it, with the numbers that
        made the decision.
      </p>

      {all.length > 0 && (
        <RevealSection className="section-block">
          <BlogSearch posts={getSearchIndex(all)} />
        </RevealSection>
      )}

      <InkRule />

      {all.length === 0 ? (
        /* Empty state — the page stays coherent before the first post ships. */
        <RevealSection as="section" className="section-block blog-empty">
          <h2 className="blog-section-title">Nothing published yet</h2>
          <p className="prose" style={{ maxWidth: '60ch', marginBottom: 24 }}>
            The first write-up is in progress. In the meantime, the systems these notes will
            cover are documented on the Projects and Architecture pages.
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <HandDrawnButton href="/projects">See the projects</HandDrawnButton>
            <Link className="link-plain" href="/architecture">
              Read the decision records
            </Link>
          </div>
        </RevealSection>
      ) : (
        <>
          {(categories.length > 1 || tags.length > 0) && (
            <RevealSection as="section" className="section-block">
              <div className="filter-bar">
                <div className="filter-group" aria-label="Filter by category">
                  <Link className={`filter-chip${!category && !tag ? ' is-active' : ''}`} href="/blog">
                    All
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c.name}
                      className={`filter-chip${
                        category?.toLowerCase() === c.name.toLowerCase() ? ' is-active' : ''
                      }`}
                      href={`/blog?category=${encodeURIComponent(c.name)}`}
                    >
                      {c.name} <span className="filter-count">{c.count}</span>
                    </Link>
                  ))}
                </div>
                {tags.length > 0 && (
                  <div className="filter-group filter-group--tags" aria-label="Filter by tag">
                    {tags.slice(0, 12).map((t) => (
                      <Link
                        key={t.name}
                        className={`tag-badge${
                          tag?.toLowerCase() === t.name.toLowerCase() ? ' is-active' : ''
                        }`}
                        href={`/blog?tag=${encodeURIComponent(t.name)}`}
                      >
                        #{t.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {isFiltered && (
                <p className="filter-summary">
                  Showing {posts.length} {posts.length === 1 ? 'note' : 'notes'}
                  {category && (
                    <>
                      {' '}
                      in <strong>{category}</strong>
                    </>
                  )}
                  {tag && (
                    <>
                      {' '}
                      tagged <strong>#{tag}</strong>
                    </>
                  )}
                  {' · '}
                  <Link className="link-plain" href="/blog">
                    clear filters
                  </Link>
                </p>
              )}
            </RevealSection>
          )}

          {featured && (
            <RevealSection as="section" className="section-block">
              <FeaturedCard post={featured} />
            </RevealSection>
          )}

          <RevealSection as="section" className="section-block">
            {rest.length > 0 ? (
              <>
                <h2 className="blog-section-title">
                  {isFiltered ? 'Matching notes' : featured ? 'More notes' : 'All notes'}
                </h2>
                <div className="content-grid cols-3">
                  {rest.map((p) => (
                    <BlogCard key={p.slug} post={p} />
                  ))}
                </div>
              </>
            ) : (
              isFiltered && (
                <p className="prose">
                  Nothing here yet under that filter: {' '}
                  <Link className="link-plain" href="/blog">
                    see all notes
                  </Link>
                  .
                </p>
              )
            )}
          </RevealSection>

          <RevealSection as="section" className="section-block">
            <InkRule variant={2} />
            <div className="blog-cta">
              <h2 className="blog-section-title">Working on something similar?</h2>
              <p className="prose" style={{ maxWidth: '58ch', marginBottom: 24 }}>
                If any of this is close to a problem you&apos;re facing, I&apos;m happy to talk it
                through.
              </p>
              <HandDrawnButton href="/contact">Start a conversation</HandDrawnButton>
            </div>
          </RevealSection>
        </>
      )}
    </div>
  )
}

import Link from 'next/link'
import { footerGroups, routesInGroup } from '@/lib/routes'
import { getAllPosts, getCategories } from '@/lib/blog'

/**
 * Grouped footer sitemap.
 *
 * Data-driven end to end: static routes come from their `group` in routes.ts,
 * and the Writing column additionally pulls live blog data. Publishing a post
 * therefore adds a footer link on EVERY page automatically — which is the
 * internal-linking behaviour that helps crawlers find new posts quickly,
 * without waiting for a sitemap re-crawl.
 *
 * Adding a page to the footer = set `group` on its route. Nothing here changes.
 */

const EMAIL = 'kamleshchhipa480@gmail.com'
const LINKEDIN = 'https://www.linkedin.com/in/kamlesh-chhipa/'
const GITHUB = 'https://github.com/Kamlesh480'

/** Keep the per-page link count sane — a footer with 60 links dilutes rather
 *  than distributes, and buries the routes that actually matter. */
const MAX_RECENT_POSTS = 3
const MAX_CATEGORIES = 4

export default function SiteFooter() {
  const posts = getAllPosts()
  const recent = posts.slice(0, MAX_RECENT_POSTS)
  const categories = getCategories(posts).slice(0, MAX_CATEGORIES)

  return (
    <footer className="site-foot page-shell">
      <nav className="foot-grid" aria-label="Footer">
        {footerGroups.map((group) => {
          const groupRoutes = routesInGroup(group.id)
          const isWriting = group.id === 'writing'
          if (!groupRoutes.length && !isWriting) return null

          return (
            <div className="foot-col" key={group.id}>
              <h2 className="foot-col-title">{group.label}</h2>
              <ul>
                {groupRoutes.map((r) => (
                  <li key={r.path}>
                    <Link className="foot-link" href={r.path}>
                      {r.label}
                    </Link>
                  </li>
                ))}

                {/* Latest posts + categories live under Writing, so new
                    content is linked from every page the moment it ships. */}
                {isWriting &&
                  recent.map((p) => (
                    <li key={p.slug}>
                      <Link className="foot-link foot-link--sub" href={`/blog/${p.slug}`}>
                        {p.title}
                      </Link>
                    </li>
                  ))}

                {isWriting &&
                  categories.map((c) => (
                    <li key={c.name}>
                      <Link
                        className="foot-link foot-link--muted"
                        href={`/blog?category=${encodeURIComponent(c.name)}`}
                      >
                        {c.name}
                        <span className="foot-count"> ({c.count})</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )
        })}

        <div className="foot-col">
          <h2 className="foot-col-title">Elsewhere</h2>
          <ul>
            <li>
              {/* rel="me" ties these profiles to the Person entity: the same
                  claim the JSON-LD `sameAs` makes, in link form. */}
              <a className="foot-link" href={LINKEDIN} rel="me noopener noreferrer" target="_blank">
                LinkedIn
              </a>
            </li>
            <li>
              <a className="foot-link" href={GITHUB} rel="me noopener noreferrer" target="_blank">
                GitHub
              </a>
            </li>
            <li>
              <a className="foot-link" href={`mailto:${EMAIL}`}>
                Email
              </a>
            </li>
            <li>
              <a className="foot-link" href="/kamlesh-chhipa-resume.pdf" download>
                Résumé (PDF)
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <div className="foot">
        <div className="signature">Kamlesh</div>
        {/* Replaced an art-print colophon ("No. 01: Charcoal on paper /
            Studio · MMXXVI"). It supported the artwork conceit but implied a
            studio that doesn't exist and told a recruiter nothing. The role +
            location line is also a small local-relevance signal. */}
        <div className="meta">
          Backend &amp; AI infrastructure engineer&nbsp;&middot;&nbsp;Bengaluru, India
          <br />
          &copy;&nbsp;{new Date().getFullYear()} Kamlesh Chhipa
        </div>
      </div>
    </footer>
  )
}

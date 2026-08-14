import Link from 'next/link'
import JsonLd from './JsonLd'
import {
  graph,
  webPageNode,
  breadcrumbNode,
  itemListNode,
  ID,
  type PageType,
  type Crumb,
} from '@/lib/schema'

/**
 * Per-page structured data AND the visible breadcrumb trail. Drop ONE of these
 * into any page:
 *
 *   <PageSchema path="/about" type="AboutPage" name="…" description="…" />
 *
 * It emits a WebPage (or subtype) plus a BreadcrumbList — linked by `@id` to
 * the site-wide Person/WebSite nodes — and renders the matching visible trail.
 *
 * The visible crumbs are built from the SAME `breadcrumbNode()` array that
 * produces the JSON-LD, so the markup and the structured data can never
 * disagree. Google expects structured data to reflect visible content; keeping
 * one source of truth is what guarantees that here.
 *
 * Home renders no trail — a single "Home" crumb is noise, and Google's
 * breadcrumb guidance expects a trail to show a real position in a hierarchy.
 */
export default function PageSchema({
  path,
  name,
  description,
  type = 'WebPage',
  extraCrumbs,
  items,
  itemsName,
  nodes = [],
}: {
  path: string
  name: string
  description?: string
  type?: PageType
  extraCrumbs?: Crumb[]
  items?: { name: string; path: string }[]
  itemsName?: string
  nodes?: object[]
}) {
  const crumb = breadcrumbNode(path, extraCrumbs)
  const pagePath = extraCrumbs?.length ? extraCrumbs[extraCrumbs.length - 1].path : path
  const trail = crumb.itemListElement

  return (
    <>
      <JsonLd
        data={graph([
          webPageNode({ path: pagePath, name, description, type, breadcrumbId: crumb['@id'] }),
          crumb,
          ...(items?.length ? [itemListNode(items, itemsName ?? name)] : []),
          ...nodes,
        ])}
      />

      {trail.length > 1 && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            {trail.map((c, i) => {
              const isLast = i === trail.length - 1
              // Strip the origin — the schema needs absolute URLs, links don't.
              const href = c.item.replace(/^https?:\/\/[^/]+/, '') || '/'
              return (
                <li key={c.item}>
                  {isLast ? (
                    <span aria-current="page" className="breadcrumb-current">
                      {c.name}
                    </span>
                  ) : (
                    <>
                      <Link href={href}>{c.name}</Link>
                      <span className="breadcrumb-sep" aria-hidden="true">
                        ›
                      </span>
                    </>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      )}
    </>
  )
}

export { ID }

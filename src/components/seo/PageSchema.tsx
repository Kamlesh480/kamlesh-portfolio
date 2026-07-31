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
 * Per-page structured data. Drop ONE of these into any page:
 *
 *   <PageSchema path="/about" type="AboutPage" description="…" />
 *
 * It emits a WebPage (or a more specific subtype) plus a BreadcrumbList, both
 * linked by `@id` to the site-wide Person/WebSite nodes in the root layout.
 * Breadcrumb labels are read from `routes.ts`, so they can't drift from the nav.
 *
 * `extraCrumbs` appends deeper levels (e.g. an individual blog post beneath
 * Engineering Notes); `items` adds an ItemList for listing pages; `nodes` takes
 * any additional graph nodes (e.g. an Article) so a page still emits exactly
 * one JSON-LD block rather than several competing ones.
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

  return (
    <JsonLd
      data={graph([
        webPageNode({
          path: pagePath,
          name,
          description,
          type,
          breadcrumbId: crumb['@id'],
        }),
        crumb,
        ...(items?.length ? [itemListNode(items, itemsName ?? name)] : []),
        ...nodes,
      ])}
    />
  )
}

export { ID }

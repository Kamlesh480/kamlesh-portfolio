# Architecture

## Persistent Chrome vs. Page Content
This site went through a major refactor from a single-page hero to a 9-route multi-page site.
The critical architectural rule from that refactor:

**`SiteChrome` (`src/components/chrome/SiteChrome.tsx`) must render as a direct child of
`<body>` in `src/app/layout.tsx`, as a sibling of `<main>{children}</main>` — never nested
inside any element that could receive `transform`/`filter`/`contain`.** Doing so would
silently break the `position: fixed` layers it owns (paper texture, draw-mode toolbar, draw
canvases), which must stay pinned to the viewport across scroll and across client-side route
navigation without re-initializing.

`SiteChrome` owns these DOM ids, referenced by the vanilla JS engines in `src/lib/` — no other
component may ever render an element with one of these ids:
`paper, grain, tooth, vignette, dust, modeIndicator, drawQuickBar, drawExitBtn, toolbar,
tbDrag, modeToggle, tbCollapse, drawOverlay, drawCanvas, drawFx`.

`SiteChrome` guards its `useEffect` init with a `useRef` (`initialized`) to survive React
StrictMode's dev-mode mount→unmount→remount — without this guard, two competing `Playground()`
closures get created, each with independent `drawMode` state, and the toolbar becomes randomly
unresponsive. See `known_patterns.md` for the full history of draw-mode bugs this caused.

## Home-Only Content
Home is `HeroSection` (full-viewport hero) followed by `HomeSections`
(`src/components/home/HomeSections.tsx`) — the scrolling story: stats band →
three capability cards (with `SketchIcon`s) → featured projects (first 3 from
`src/content/projects.ts`, deep-linking `/projects#<slug>`) → compact experience
strip (from `src/content/experience.ts`) → final CTA. `HomeSections` is a Server
Component pulling everything from the content data files — don't hand-duplicate
copy into it; edit the content files instead. The stats-band numbers are the
one exception (hand-authored in `HomeSections`), and must obey the same
resume-accuracy rule as everything else.

`src/components/home/HeroSection.tsx` owns everything hero-specific: the availability badge,
the `.rule` divider, the real charcoal-sketch portrait (`public/kamlesh-portrait.jpg`, via
`next/image` with `priority`), and the font-ready-gated reveal choreography
(`document.fonts.ready` → `.ink`/`.reveal`/`.settled` classes on `#homeHero`).

**The procedural bust is gone from the hero** — replaced by the user's real charcoal-sketch
portrait for lead-gen trust. `HeroSection` no longer imports `src/lib/charcoal.js` at all
(`FigureCanvas` is now unused code; only `Dust` is used, by `SiteChrome`). The portrait uses a
wrapper-blend pattern documented in `theme_and_styling.md` §portraits: `mix-blend-mode:
multiply` on the img against a `background: var(--paper)` WRAPPER, with the fade mask on the
wrapper — because `.home-hero`'s z-index creates an isolated stacking context, a blend can
never reach the fixed `#paper` layer outside it, so blending must target an in-context
paper-colored backdrop. This is now the ONLY portrait on the site: /about's dark portrait was
replaced by diagrams (see below), so `.about-portrait*` CSS is gone and
`public/kamlesh-portrait-dark.jpg` is an unreferenced leftover asset.

## Draw Marks Do Not Persist Across Navigation
Since `SiteChrome` never unmounts between routes, the draw canvas content would otherwise
survive navigation by default (a visitor's scribble on Home would still be there on /contact).
`SiteChrome` explicitly clears `#drawCanvas` pixels on every `usePathname()` change — the draw
*system* (toolbar, mode state) stays mounted, only the pixel content clears. This is a
deliberate product decision, not an oversight — flip it by removing the `usePathname`-driven
`clearRect` effect if "graffiti travels with you" is ever preferred instead.

## Chrome Split (Header/Footer)
- `SiteHeader` (`src/components/layout/SiteHeader.tsx`) — brand/logo + primary nav, data-driven
  from `headerRoutes` in `src/lib/routes.ts` (currently: About, Experience, Projects, Skills,
  Contact — Home is reached via the brand/logo only, deliberately not a `headerRoutes` entry).
  Includes a mobile hamburger + full-screen ink-in panel below 880px.
- `SiteFooter` (`src/components/layout/SiteFooter.tsx`) — full sitemap (`footerRoutes`, all 9
  routes) + signature/meta block. This is why Architecture/Blog/Resume are still "wired into
  navigation" per the original design brief despite not appearing in the header nav — the
  primary header nav is deliberately capped at 5 items to preserve the hand-drawn SVG
  underline-animation pattern, which doesn't scale visually past ~5 items.

## Layout Model
- `.home-hero` — Home's full-bleed first viewport, `min-height: 100vh` (not fixed `height`, so
  it never clips on short viewports with large fluid type).
- `.page-shell` — shared horizontal rhythm (`clamp()` padding, `max-width: 1680px`) for the
  other 8 routes.
- `header` is NOT sticky/fixed — plain document flow, at `z-index: var(--z-header)` (1500).
  This value matters: `header` creates its own stacking context, and if it were ever set back
  to the generic `--z-content` (4), its mobile nav panel (nested inside header, `position:
  fixed`, `z-index: 2000`) would get trapped and lose to same-z-index-but-later-in-DOM content
  in `<main>` — see `known_patterns.md`.
- **`Card` frame edges hug the border (`Card.tsx` path top≈1.5% / bottom≈98.5%) ON PURPOSE.**
  The frame SVG uses `preserveAspectRatio="none"`, so any vertical waviness in the top/bottom
  edges is multiplied by the card's height — a wavier edge dips proportionally deeper into the
  content and collided with the `<h3>` title on tall cards (e.g. the healthcare project card).
  Keep the horizontal edges near-straight; the `#rough` filter supplies the hand-drawn wobble.
  Don't re-introduce a wavy top edge without also decoupling it from card height.

## Content Data Model
Typed data files under `src/content/`, imported directly into Server Components — no client
fetching, no MDX. `types.ts` defines `ExperienceEntry`, `ProjectEntry`, `SkillGroup`,
`DecisionRecord`, plus the blog contract (`BlogFrontmatter`/`BlogPost`/`TocEntry`). This structure exists specifically so a future Resume-page rewrite can reuse
the same data without a second content-authoring pass.

`decisions.ts` (architecture decision records, drives `/architecture`) is **derived content**:
it adds *reasoning about* work already evidenced in `experience.ts`/`projects.ts`, and must
never introduce a metric, employer, or technology not already in those files. Same Content
Accuracy Rule, one step removed — when editing it, check the claim against the source file
rather than against what sounds right.

**Array order IS display order, everywhere.** `/experience`, `/projects`, `/resume`, and
`HomeSections`' "featured work"/"experience strip" all render `experience`/`projects` by
mapping the array directly — there is no separate sort/filter step. To make an entry appear
last on every page that lists it, put it last in the source array; nothing else needs to
change. (`HomeSections`' `featured` constant used to be `projects.slice(0, 3)` — now it's the
full `projects` array, specifically so a deliberately-last entry stays visible there too
instead of silently falling off a top-3 cut.)

**`ExperienceEntry.range` and `ProjectEntry.period` are optional**, not required — this is by
design for entries that should show no dates (e.g. a personal project framed without an
employment timeline). Every consuming page guards the date UI with `{entry.range && (...)}` /
`{p.period && (...)}` rather than assuming it's present — if a new page renders `experience` or
`projects`, copy that guard pattern, don't assume `range`/`period` exist.

**Anonymized personal project entry**: one `experience` entry (slug `personal-project`,
company `"Personal Project"`) and one `projects` entry (slug `healthcare-platform`, title
`"Healthcare Claims Intelligence Platform"`) describe the same real project — its actual name
is deliberately never in the codebase (not publishable, by explicit request). Both entries are
last in their arrays and have no dates. If you're tempted to "fill in" a company/product name
here from context or memory, don't — the omission is intentional, not a data gap. The
`/about` page's "Standout project" section links to `/projects#healthcare-platform` — if that
slug ever changes, update the anchor href too (they're two separate literals, not derived from
a shared constant).

## Hand-Drawn Diagram System
`src/components/diagram/` renders bespoke charcoal schematics on /projects and
/experience so those pages aren't wall-to-wall text.
- `Sketch.tsx` — primitives (`Diagram`, `Box`, `Chip`, `Cylinder`, `Queue`, `Cloud`,
  `Arrow`, `Connector`, `Group`, `Badge`, `Note`, `Dot`). Shapes with real area (boxes,
  cylinders, rings, groups) render **clean** geometry and let the global `#rough` filter
  roughen them — the exact technique `.sketch-icon` uses, which is why they read as the same
  hand. Do NOT hand-wobble those; add `#rough` via a `.sk-box`/`.sk-group-box`/`.sk-badge-ring`
  class instead.
- **GOTCHA — `#rough` clips axis-aligned thin strokes.** The filter's default
  object-bounding-box region collapses to zero height (horizontal line) or zero width (vertical
  line), so a perfectly straight arrow shaft / connector / chip-pin / queue-divider filtered by
  `#rough` renders as *nothing* — only diagonal strokes survive. This silently ate half the
  arrows on first build (they looked like a bare ">"). Fix in force: connectors (`.sk-line`)
  and hairlines (`.sk-hair`) are NOT filtered — instead `Arrow`/`Connector` bake a hand-drawn
  wobble into the path geometry via `sketchCurve()` (deterministic `Math.sin` noise, so no
  hydration mismatch). If you add a new straight connector, route it through `Arrow`/`Connector`
  or class it `.sk-hair`; never put a raw axis-aligned `<line>`/`<path>` under a `#rough` class.
- Dashed connectors (`.sk-line--dash`) are excluded from the `.sk-draw` ink-in animation —
  the pathLength=1 dashoffset trick can't coexist with a real dash pattern, so they ride in on
  the parent section's fade instead (see the `:not(.sk-line--dash)` guards in globals.css).
- `ProjectDiagrams.tsx` / `ExperienceDiagrams.tsx` — one composition per content slug, plus
  `projectDiagram(slug)` / `experienceDiagram(slug)` lookups that return `null` for any slug
  without a diagram (so adding a content entry never breaks the page — it just renders text).
- `AboutDiagrams.tsx` — not slug-keyed (About is prose, not content-array driven): exports
  `OwnershipDiagram` (hero right column — the stack, with an extent marker spanning all layers)
  and `JourneyDiagram` (the vertical career path that REPLACED the About portrait photo).
- `ArchitectureDiagrams.tsx` — `DecisionLoopDiagram` (the /architecture hero) plus
  `decisionDiagram(slug)` keyed to `src/content/decisions.ts` slugs. Only some records have a
  diagram; the rest render text-only, by design.
- `BlogDiagrams.tsx` — figures authored for a specific post, embedded from markdown with
  `:::diagram <slug>`. `resolveDiagram()` in BlogParts.tsx tries project → experience →
  decision → blog sets in order, so a post can reuse any existing figure by slug.
- **Keep drawn content ~16 units clear of the viewBox edges.** `.sketch-diagram-scroll` fades
  its outer 14px to transparent (so a mid-scroll diagram doesn't hard-clip on mobile), which
  silently *erases* anything drawn flush to the edge — it looks like a clipping bug but
  `getBBox()` will show the geometry is correctly placed. Equally, don't leave a wide margin:
  a narrow drawing in a wide viewBox renders left-shifted with dead space, because the `<svg>`
  fills its column regardless. Match content extent to viewBox, minus that ~16-unit padding.
- Sizing rule: pick the viewBox width to be close to the column the figure lands in, so it
  renders near 1:1. Scaling a wide drawing down into a narrow column is what makes diagram
  labels illegible; widening the drawing (rather than scaling it up) is also what makes a tall
  figure render shorter.
  The pages call these inline (`{projectDiagram(p.slug)}` after the summary;
  `{experienceDiagram(entry.slug)}` after the highlights). **Slugs are the join key** — if you
  rename a slug in `src/content/*`, update the MAP key here or the diagram silently disappears.
- Diagrams are authored in an arbitrary ~900–980-wide user space and scaled to container
  width by the `<Diagram>` wrapper. On narrow screens they scroll horizontally inside
  `.sketch-diagram-scroll` (overflow-x:auto + edge fade mask) rather than shrinking labels
  into illegibility — the card and page never gain horizontal overflow (verified 0px at 390w).
- **Draw-in animation is pure CSS, no per-diagram JS**: every stroked shape carries
  `pathLength={1}` + class `sk-draw`; text/fills carry `sk-fade`. `.reveal-section.in-view
  .sk-draw` animates `stroke-dashoffset` 1→0 and `.sk-fade` opacity in — keyed off the
  existing RevealSection `.in-view` class the card already sits inside. Resting state (no
  animation) is fully drawn, so if the IntersectionObserver never fires the diagram is simply
  visible (same safety contract as `.reveal-section`). Guarded by `prefers-reduced-motion`.
- Focal "key move" nodes use `solid` (filled charcoal, paper-colored text); legacy/replaced
  nodes use the `sk-node--legacy` wrapper (faded + struck). All diagram CSS lives in the
  clearly-commented block appended to the end of `globals.css`.

## Announcement Bar
`src/content/announcements.ts` + `src/components/chrome/AnnouncementBar.tsx`, mounted in the
root layout ABOVE `SiteHeader`. Adding news = one entry in the content file.
- Client-only render on purpose: date windows (`starts`/`expires`) and dismissal are both
  browser facts. Server-rendering would flash a bar that then vanishes, and would bake
  expired announcements into static HTML. Evaluating dates in the browser also means a dated
  banner switches on/off ON THE DAY without a redeploy.
- Renders `null` when nothing is active — no reserved strip, no layout shift.
- **GOTCHA — the dismissal key must be derived from the DATE-active set, never the
  route-filtered one.** The bar hides an announcement whose `href` matches the current route
  (don't advertise the page you're on). If the key followed that filtered list, navigating
  onto an announced page would shrink the set, change the key, and RESURRECT a bar the
  visitor had dismissed. `dateActive` → key; `active` (route-filtered) → display.
- Not an `aria-live` region: an auto-rotating banner re-announcing itself every 7s is hostile
  to screen readers. Dots give deliberate navigation. Rotation pauses on hover/focus and is
  disabled entirely under `prefers-reduced-motion`.

## Sticky Top Bar
`AnnouncementBar` + `SiteHeader` are wrapped in `.site-top` (root layout) which carries
`position: sticky` ONLY. Constraints that must hold:
- **No transform/filter/backdrop-filter on `.site-top`.** `.nav-mobile-panel` is a
  `position: fixed` descendant of `<header>`; any of those makes the wrapper its containing
  block and traps it (Bug 4 all over again). The blur/paper lives on `::before`/`::after`
  pseudo-elements, which carry filters without becoming an ancestor containing block.
- **Draw mode un-sticks it** (`body.draw-mode-active .site-top { position: static }`).
  `#drawOverlay` reserves only the top 64px of the viewport; the bar is taller, so left sticky
  it would cover drawable area and swallow canvas pointer events.
- The bar repaints the page's own paper (same fixed gradient + the `--grain-img`/`--tooth-img`
  textures) rather than a flat colour — it sits ABOVE `#paper`/`#grain`/`#tooth` in the stack,
  so a plain fill renders as a visibly lighter band. See `theme_and_styling.md`.
- `SiteChrome` stays OUTSIDE `.site-top` — it must remain a direct child of `<body>`.

## Footer
`SiteFooter` renders columns from `footerGroups` + each route's `group` field in `routes.ts`.
Adding a page to the footer = set `group` on its route; the component never changes.
The Writing column additionally pulls live blog data (recent posts + categories), so
publishing a post adds a sitewide internal link automatically — deliberate for crawl
discovery. Counts are capped (3 posts / 4 categories): a footer with 60 links dilutes rather
than distributes.

## Breadcrumbs
`PageSchema` renders BOTH the `BreadcrumbList` JSON-LD and the visible trail, from the SAME
`breadcrumbNode()` array — so markup and structured data cannot drift (Google expects them to
agree). Labels come from `routes.ts`, so nav/sitemap/schema/visible trail share one source.
Home renders no visible trail (a lone "Home" crumb is noise). A blog post passes
`extraCrumbs` to get the third level. Adding a page needs no breadcrumb work — the existing
one-line `<PageSchema …>` call produces it.

## SEO Layer
- `src/lib/seo.ts` exports `SITE_URL` (from `NEXT_PUBLIC_SITE_URL`, no domain hardcoded
  elsewhere), `baseOpenGraph`/`baseTwitter`, and `pageMetadata()` — every route's
  `export const metadata` should call this helper rather than building a raw object, because
  Next's App Router metadata merges shallowly per top-level key: a page that sets its own
  `openGraph: {title, description}` without spreading `baseOpenGraph` would silently lose
  `siteName`/`images`/`locale`.
- `src/app/sitemap.ts` / `src/app/robots.ts` are both derived from `routes.ts` — never hand-list
  routes in either file.
- **`NEXT_PUBLIC_SITE_URL` must be set wherever the site is actually deployed** (Vercel →
  Project Settings → Environment Variables, most likely given the `.gitignore` has a `.vercel`
  entry). Without it, `SITE_URL` in `seo.ts` silently falls back to the placeholder
  `https://kamlesh-chhipa.example` — sitemap.xml, robots.txt, canonical tags, and OG image URLs
  will all point at the wrong domain with no error or warning. This happened for real: the site
  went live at kamlesh-chhipa.com before this env var was ever set anywhere. `.env.example`
  (committed — note the `!.env.example` negation in `.gitignore`, since the blanket `.env*` rule
  would otherwise catch it too) documents the required value; `.env.local` (gitignored) holds
  the actual value for local dev/build. Setting `.env.local` does NOT affect the deployed site —
  that requires the separate hosting-provider dashboard step.
- **`SITE_URL` resolution in `seo.ts` must never do a bare `process.env.NEXT_PUBLIC_SITE_URL ??
  fallback`.** `??` only triggers on `null`/`undefined` — an env var that's *set but empty*
  (e.g. saved with a blank value in a hosting dashboard, or a build environment that injects an
  empty string rather than leaving the var unset) sails straight past `??` and produces
  `SITE_URL = ''`. `metadataBase: new URL(SITE_URL)` in `layout.tsx` then throws
  `TypeError: Invalid URL` (`ERR_INVALID_URL`, `input: ''`) during `next build`'s page-data
  collection — which fails the **entire** production build, not just SEO metadata. This happened
  for real on Vercel right after adding the env var. Fixed via `resolveSiteUrl()` in `seo.ts`:
  trims the raw value, treats a blank/whitespace-only result the same as unset, and validates
  the result is actually a parseable URL (`new URL(raw).origin`) before accepting it — any
  failure falls back to the placeholder domain instead of throwing. If `SITE_URL`-adjacent code
  is ever touched again, keep this defensive resolution; do not simplify it back to a bare `??`.
- Root layout emits `Person` + `WebSite` JSON-LD once via `src/components/seo/JsonLd.tsx` (a
  Server Component using a manually `<`-escaped `dangerouslySetInnerHTML`, not `next/script`,
  since this is static inline data with no loading-strategy concern).

## Engineering Notes (blog) Framework
Adding a post = ONE markdown file in `src/content/blog/`. Nothing else is touched — route,
metadata, cover, reading time, TOC, Article schema, sitemap entry, related/prev-next all
derive from it. Authoring contract is documented in `src/content/blog/README.md` (that file
is excluded from the post index by the `^[A-Z]+\.md$` / `_`-prefix filter in `blog.ts`).
- `src/lib/blog.ts` — filesystem index (server-only). Throws at BUILD time on missing
  required frontmatter rather than shipping a broken post. `draft: true` shows in dev,
  is excluded from production build, listing, sitemap, and 404s on the detail route.
- `src/lib/markdown.ts` — markdown-it + Shiki. Two classes of custom block, handled
  differently ON PURPOSE: `:::note|tip|warning` stay markdown-it containers (their bodies
  are prose that must keep rendering markdown); `:::diagram|metrics|timeline` are split OUT
  of the source before parsing, because their bodies are structured data and — for
  `:::diagram` — must become a real React component, which an HTML string cannot.
  Shiki uses a hand-authored `charcoal-paper` theme; stock themes read as a pasted-in dark
  IDE against this palette. `createHighlighter` is async but the returned `codeToHtml` is
  sync, which is what lets markdown-it's sync `highlight` hook work.
- **Covers and share cards come from the same frontmatter.** `coverNodes` + `coverMetric` turn
  `PostCover` from an abstract motif into a labelled schematic of the article, and feed
  `blog/[slug]/opengraph-image.tsx`, which renders a unique 1200×630 card per post. Omit them
  and the cover falls back to a motif inferred from category/tags — nothing breaks.
- **`generateMetadata` must STRIP `openGraph.images`.** `baseOpenGraph` pins the site-wide
  og-image.png; any explicit `images` silently overrides the generated per-post card, and the
  build still succeeds while every post shares one generic preview. Verify by reading the
  rendered `<meta property="og:image">`, not by checking the file exists.
- OG fonts live in `assets/fonts/` as STATIC instances. Satori cannot parse variable fonts
  (a `[wght]` file fails with "Cannot read properties of undefined") and requires explicit
  `display` on any element with more than one child.
- Client JS is ONE island (`BlogChrome.tsx`) using event delegation for copy buttons,
  progress bar, TOC active state, and lightbox — the body stays a static HTML string.
- **`/blog` is `ƒ` dynamic**, not static, because it reads `searchParams` for category/tag
  filters. This is the only non-static route on the site; it's the accepted cost of
  crawlable, shareable filter URLs. Moving filters to the client would restore static.

## GOTCHA — bare `header {}` / `nav {}` element selectors leak into page content
globals.css styles the site chrome with bare element selectors. Any semantic `<header>` or
`<nav>` inside page content silently inherits them — the blog article header picked up
`display:flex` (rendering title/byline/tags as side-by-side columns) AND `z-index:1500`,
which would have floated it above the draw toolbar. Fixed by explicitly resetting
`.post-header` / `.post-breadcrumb` / `.toc` / `.prev-next`. Any NEW in-content
`<header>`/`<nav>` needs the same reset — or convert the chrome selectors to classes.

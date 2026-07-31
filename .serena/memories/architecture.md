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
`DecisionRecord`. This structure exists specifically so a future Resume-page rewrite can reuse
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

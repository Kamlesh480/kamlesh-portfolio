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

`src/components/home/HeroSection.tsx` owns everything hero-specific: the `.rule` divider, the
figure canvas (`#figure`, `#headline`), the font-ready-gated reveal choreography
(`document.fonts.ready` → `.ink`/`.reveal`/`.settled` classes on `#homeHero`). This must stay
strictly Home-scoped — never hoisted into shared chrome/layout — because `HeroSection` is what
dynamically imports the ~950-line canvas engines (`src/lib/charcoal.js` for the figure,
`src/lib/playground.js` for the draw system) via `await import()` inside `useEffect`. If this
import ever moves into a shared layout or chrome component, every route on the site pays the
cost of loading that code, not just Home.

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

## Content Data Model
Typed data files under `src/content/`, imported directly into Server Components — no client
fetching, no MDX. `types.ts` defines `ExperienceEntry`, `ProjectEntry`, `SkillGroup`. This
structure exists specifically so a future Resume-page rewrite and Architecture-page build-out
can reuse the same data without a second content-authoring pass.

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

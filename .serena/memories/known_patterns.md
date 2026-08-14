# Known Patterns & Debugging History

This file exists because the draw-mode system in particular went through many rounds of
subtle, hard-to-reproduce bugs. Read this before modifying `src/lib/playground.js`,
`src/lib/charcoal.js`, `SiteChrome.tsx`, or any z-index/stacking-context-adjacent CSS.

## Verification Approach (no committed test suite)
This repo has no test runner in `package.json`. Verification has always been done with
throwaway Playwright scripts, run from a scratchpad directory *outside* the repo (never
committed) against a local `npx next dev --port 3001` server. The standard pattern used
repeatedly and successfully:
1. `npm i playwright` in the scratchpad dir (not the repo).
2. Write a script that drives real `chromium`/`webkit` browsers — click real DOM elements,
   read real `getComputedStyle`, sample real canvas pixel data — never assert against
   assumptions about what the CSS/JS *should* do.
3. Run against **both Chromium and WebKit** for anything involving pointer events or CSS
   stacking — several bugs below only reproduced in one engine or were only caught by
   comparing engines.
4. For contrast/accessibility work, compute actual luminance ratios in-browser (alpha-blend
   computed colors against the real layered background), don't eyeball screenshots.

## Bug 1 — Draw-mode toolbar becomes unresponsive after any edit
**Symptom:** toolbar buttons stop responding to clicks intermittently, especially after a
StrictMode remount in dev.
**Root cause:** `SiteChrome`'s `useEffect` called `window.Playground({...})` without a mount
guard. React StrictMode's dev-mode mount→unmount→remount created **two** `Playground()`
closures, each with independent `drawMode` state, racing each other.
**Fix:** `useRef` guard (`if (initialized.current) return`) before calling `Playground()`.
This pattern is required for any future `useEffect` that does one-time imperative DOM/canvas
setup in this codebase.

## Bug 2 — Two cursors visible at once in draw mode / can't click toolbar while "drawing"
**Symptom:** both the system cursor and the custom brush-ring cursor visible simultaneously;
clicking the side toolbar or top quick-bar sometimes triggered a draw stroke instead.
**Root cause history (multiple failed fixes before the real one):**
- First attempt: CSS `pointer-events` toggling on a full-page overlay — toolbar buttons
  intermittently failed because the overlay and toolbar occupied overlapping z-index space in
  ways that shifted depending on scroll/zoom state.
- Second attempt: capture-phase `document.addEventListener('click', ..., true)` with manual
  hit-testing — fragile, order-dependent.
- **Actual fix:** `#drawOverlay` is a *geometric draw zone* — a `position: fixed` div covering
  only the inner drawable region, with explicit reserved strips at the top (quick bar), right
  (side toolbar), and bottom (mode indicator) subtracted out via `top`/`right`/`bottom`/`left`
  inset values, not full-viewport `inset: 0`. Draw events (`pointerdown`/`pointermove`) attach
  to this zone element only, never to `window`. The system cursor and brush ring never conflict
  because they're spatially exclusive by construction — the toolbar is physically outside the
  draw zone's bounding box, so it never needs `pointer-events` tricks or z-index arbitration at
  all. **This is the correct general pattern for any future full-page-interactive-layer +
  fixed-toolbar UI in this codebase — carve out reserved geometry, don't fight z-index.**

## Bug 3 — Coordinate drift: brush ring / stroke appears offset from the actual cursor
**Symptom:** especially noticeable when the browser was zoomed or the canvas had been resized.
**Root cause:** the draw engine mapped `clientX/clientY` to canvas coordinates by multiplying
by `devicePixelRatio` directly, assuming the canvas's top-left corner sits at the viewport
origin — breaks under browser zoom, pinch-zoom panning, or a DPI change between monitors.
**Fix:** `toCanvas(clientX, clientY)` in `playground.js` measures `canvas.getBoundingClientRect()`
on every event and computes the actual scale factor (`canvas.width / rect.width`), rather than
trusting a cached/assumed `devicePixelRatio`. Any future coordinate-mapping code in this file
must follow this "measure, don't assume" pattern.

## Bug 4 — Mobile nav panel invisible/unclickable despite correct z-index on the panel itself
**Symptom:** the mobile hamburger panel (`.nav-mobile-panel`, `z-index: 2000`) rendered behind
Home's hero content even though 2000 > any content z-index.
**Root cause:** `header` (the panel's DOM ancestor) had `position: relative` + its own
`z-index: var(--z-content)` (4) — this makes header create its own stacking context. `<main>`
(containing `.home-hero`, also z-index 4) is a **later sibling in DOM order**, so on a z-index
tie, it paints on top of header's *entire subtree*, including the z-index-2000 panel nested
inside it — child z-index values never escape a parent stacking context to compete with
siblings-of-the-parent.
**Fix:** raised `header`'s own z-index to `--z-header: 1500`, well above page content.
**General lesson for this codebase:** whenever adding a `position: fixed` element nested inside
some other positioned container, check whether that container itself creates a stacking context
that could cap the fixed element's effective z-index — the fixed element's own z-index number
only matters within whatever stacking context contains it.

## Bug 5 — SVG rough-border renders as a thick, uneven line on wide elements
**Symptom:** `Card`'s hand-drawn border looked like a bold black cartoon outline on the
right/bottom edges only.
**Root cause:** the border path uses `viewBox="0 0 100 100"` with `preserveAspectRatio="none"`
stretched to fill a wide, short card — non-uniform scaling distorts `stroke-width` per-axis
(vertical-ish segments pick up the horizontal scale factor, which is much larger on a wide
card).
**Fix:** `vector-effect="non-scaling-stroke"` on the path — keeps the stroke a constant
screen-pixel width regardless of the element's aspect ratio. Apply this to any future
stretched-SVG-frame technique in this codebase.

## Bug 6 — favicon.ico causes a 500 on every route in dev
**Symptom:** `GET / 500` immediately after regenerating `favicon.ico`; log showed
`Format error decoding Ico: The PNG is not in RGBA format!`.
**Root cause:** the source PNGs packed into the multi-res `.ico` were rendered opaque (RGB, no
alpha channel) via Playwright screenshot with `omitBackground: false`. Next's ICO decoder
requires RGBA.
**Fix:** render favicon source frames with `omitBackground: true` (the tile itself paints its
own opaque background rect, so only the rounded corners are actually transparent — but the PNG
format is RGBA either way, which is what Next's decoder needs).

## Bug 7 — hand-drawn diagram arrows/connectors render as just ">" with no line
**Symptom:** in the `src/components/diagram` schematics, straight arrows showed only their
arrowhead (a bare ">"); the shaft, chip pins, and RabbitMQ queue dividers were invisible.
Diagonal arrows looked fine — which is the tell.
**Root cause:** `#rough`'s default `filterUnits="objectBoundingBox"` region collapses to zero
height for a perfectly horizontal stroke (zero width for a vertical one), so `feDisplacementMap`
had no region to render into and clipped the stroke away. Arrowheads and diagonal lines have a
2-D bounding box, so they survived.
**Fix:** do NOT filter thin axis-aligned strokes. Connectors (`.sk-line`) and hairlines
(`.sk-hair`) carry no `#rough`; `Arrow`/`Connector` bake the hand-drawn wobble into the path
geometry via `sketchCurve()` (deterministic `Math.sin` noise — same on server/client, so no
hydration mismatch). **General lesson:** `#rough` (or any `feDisplacementMap` filter) on a
straight horizontal/vertical line will disappear — give the shape 2-D bounds or don't filter it.

## Bug 8 — a diagram inside `.content-grid` gives the whole PAGE horizontal scroll on mobile
**Symptom:** /about scrolled sideways at 390px (18px of overflow) while /projects and
/experience — same diagrams, same widths — did not. The overflowing elements were the grid's
children, including the innocent `<p class="page-lede">` sibling.
**Root cause:** `.sk` carries an inline `min-width` (diagrams scroll rather than shrink into
illegibility). A `1fr` track is `minmax(auto, 1fr)`, and that `auto` min-size resolves to the
child's **min-content** — so the diagram's `min-width` inflated the track, and every sibling in
it, past the container. On /projects the same diagram sits in normal block flow inside a
`Card`, where `.sketch-diagram-scroll`'s `overflow-x: auto` clamps it — grid tracks ignore that.
**Fix:** `.content-grid > * { min-width: 0 }` — lets tracks shrink below min-content so the
horizontal scroll stays inside `.sketch-diagram-scroll` where it was designed to live.
**General lesson:** any grid/flex child that contains an overflow-scrolling box needs
`min-width: 0`, or the inner content's min-width leaks out and blows up the whole row.

## Content Accuracy Rule
`src/content/{experience,projects,skills}.ts` must stay strictly grounded in the two source
resume PDFs and any explicit project briefs the user supplies (e.g. the personal project's
brief) — never invent skills, dates, employers, or metrics not evidenced by a source document,
even if a design brief's example categories suggest them (e.g. an early brief's example skill
list included Java/Spring Boot/GraphQL/Terraform — none of that is real, none of it was added).
When facts conflict between sources, the resume/primary source wins, and when a fact (like a
project's date range or employment classification) isn't stated anywhere, ask the user rather
than guessing — this happened for the personal project's dates and reporting-line details.

**Employer-confidentiality invariant (BrightEdge and any future employer).** Two classes of
detail must never be published on this site, regardless of being on the private résumé:
1. **Internal system codenames.** "DCX Collector V2" was removed everywhere and is now
   described by function ("High-Throughput Keyword Collection Pipeline", slug
   `keyword-collection-pipeline`). A codename ranks for nothing, means nothing to a reader,
   and discloses internal naming. **Exception, verified:** "AI Hyper Cube" is a *publicly
   announced* BrightEdge product (CEO keynote + press releases), so naming it is verifiable
   credibility, not disclosure — keep it. Check whether a name is public before genericising
   it; blanket-anonymising costs real credibility.
2. **Absolute internal cost figures.** "$40K → $15K/month" and "$18K–$20K/month saved" were
   replaced with percentages and "a five-figure monthly saving". Percentages convey the same
   achievement without publishing an employer's infrastructure spend. Specific supplier names
   (Vast.ai) were likewise generalised to "rented GPU capacity" — naming an employer's vendor
   is a supplier-relationship detail, not a skill.
3. **The employer NAME is scoped to employment context only.** "BrightEdge" may appear on
   `/experience`, `/resume`, in `experience.ts` (the `company` field), and in the Home
   "Where I've been" strip — all of which ARE employment history. It must NOT appear on
   `/about`, `/projects`, `/architecture`, `/skills`, `/contact`, `/blog`, or in any blog post:
   there, name the SYSTEM instead ("AI Hyper Cube · LLM infrastructure", "Data platform"),
   or the timeframe alone (`period: 'Jun 2025 – Present'`, not `'BrightEdge · Jun 2025'`).
   Rationale: attaching an employer's name to public technical write-ups and project pages is
   what invites a concern; stating employment history on a résumé page does not.
   The site-wide `Person` JSON-LD keeps `worksFor` — that's the machine-readable form of the
   same résumé fact, and removing it would weaken entity recognition for no privacy gain.
Percentages, throughput/scale numbers, role, and standard tech stack are all fine — that's
normal résumé material.

**Confidential-name invariant:** the personal project's real product/company name is NOT
publishable (explicit user instruction). It must appear NOWHERE in the repo — not in code, not
in content, and not in these memory files (which are git-tracked, so they ship too). Refer to
it only generically ("the personal project", "the healthcare-claims platform"); it is
represented in content as `company: 'Personal Project'` / slug `personal-project` /
`healthcare-platform` — see `architecture.md` (Content Data Model). Do not reintroduce the name
as a "helpful" clarification.

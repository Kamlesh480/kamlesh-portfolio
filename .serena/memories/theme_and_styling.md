# Theme & Styling — Charcoal/Paper Design System

## Where Styles Live
Almost everything is in one hand-written `src/app/globals.css`. Tailwind v4 is installed but
supplemental at most (a handful of utility classes) — **never** introduce Tailwind component
classes as a replacement for the hand-drawn charcoal design language. Do not add a second
styling system.

## Color Tokens (`:root` in globals.css)
```
--paper:      #f9f7f1   (base background — "marble" near-white)
--paper-hi:   #fdfcf8   (lighter gradient edge)
--paper-lo:   #efeadf   (darker gradient edge)
--char-deep:  #161410   (near-black charcoal — headlines)
--char:       #221f1a   (body charcoal)
--graphite:   #423e36   (secondary text)
--graphite-s: #665f53   (muted/caption text — contrast floor, see below)
--edge:       #2a2620   (rules, borders)
```
Also load-bearing for perceived brightness: the `#grain`/`#tooth` texture layers
multiply-darken the paper — their `opacity` values (0.30 / 0.26, lowered twice from the
original 0.55 / 0.5 across successive brightness passes) are the main lever for how light the whole
site feels, more than the tokens themselves. The `#vignette` inset shadows were
also softened in the same pass. There is also ONE muted accent
token, `--accent: #47617a` (slate, lifted from a statue-reference image the user
supplied) — used ONLY for: the availability-badge pulse dot, the hero accent
word's text-stroke, and link hovers. Keep it that sparse; this is not a
multi-color design.

The display-text filter matters for readability: `.headline`, `.page-title`, and
`.stat-value` use `url(#rough)` (wobble only). They previously used
`url(#charcoalText)`, whose grain pass punches holes in the letterforms — real
users reported the text looked "not clean" because of it. The #charcoalText
filter still exists in SvgFilterDefs but is intentionally unused; don't reapply
it to body-size or display text.
**These are WCAG-AA contrast-audited — do not lighten `--graphite-s` or darken `--paper-lo`
without re-running the contrast audit.** `--graphite-s` was originally `#7d776c` (only 3.50:1
against `--paper`, failing AA on body/caption text) and was darkened to `#665f53` specifically
to clear 4.5:1 against the darkest gradient stop (`--paper-lo`) that any text could realistically
sit on. The background was also lightened from `#e8e4da` → `#f2eee5` in the same pass. If either
token changes again, re-verify with a real luminance-ratio check across all 9 routes, not by eye
— several failures at the previous values were invisible in isolated screenshots but measurable
(e.g. `.tb-note`, `.eyebrow`, `.card-meta` at reduced opacity compounded with the grey text
color to fail contrast even though neither alone looked obviously wrong).

Also matters: `viewport.themeColor` in `src/app/layout.tsx` must track `--paper`, not
`--char-deep` — a charcoal `themeColor` tints mobile browser chrome dark and makes the whole
site read as a dark theme even though the page itself is light.

## Typography
- **Caveat** (`--font-caveat`) — the hand-lettered display font. Headlines, nav, buttons,
  brand wordmark, toolbar labels.
- **Cormorant Garamond** (`--font-cormorant`) — serif body/lede copy, italic for eyebrows.
- Both loaded via `next/font/google` in `src/app/layout.tsx`, exposed as CSS variables on
  `<html>`.

## SVG Filters (the "hand-drawn" texture)
Defined once globally in `src/components/chrome/SvgFilterDefs.tsx`, rendered by `SiteChrome`.
Every page/primitive that wants the hand-drawn look references these by `filter: url(#id)` —
never duplicate filter defs in a page-level component.
- `#rough` — light wobble via `feTurbulence` + `feDisplacementMap`. Used on nav text, buttons,
  dividers, most UI chrome.
- `#charcoalText` — heavier wobble + a punched-grain pass (dry-charcoal look). Currently
  UNUSED by design (see the readability note above) — kept only in case a special-purpose
  dry-charcoal accent is ever wanted; never on headlines or body text.
- `#smudgeDot` — used for the small period/dot after "Kamlesh" in the brand wordmark.

**Gotcha:** if an SVG path uses `preserveAspectRatio="none"` to stretch a shape non-uniformly
(e.g. a rough-rect background stretched to fill a wide card), its `stroke-width` gets distorted
along with the shape unless you add `vector-effect="non-scaling-stroke"` — otherwise vertical-ish
segments render much thicker than horizontal ones. See `Card.tsx`'s `.card-bg` path for the
fixed pattern; this bug shipped once and was caught visually (a card border looked like a bold
cartoon outline on one side).

## Z-Index Scale
Reference tokens declared in `:root` (`--z-paper` through `--z-quickbar`) for **new** code to
consume. The pre-existing draw-system rules (toolbar, quickbar, mini-palette, mode indicator)
intentionally kept their original hardcoded literals rather than being mass-rewritten to the
token scale — those values are load-bearing and already verified correct; treat them as frozen
unless you have a specific reason to touch them. `--z-header: 1500` is the one non-obvious entry:
`header` needs a much higher z-index than page content (`--z-content: 4`) because it creates its
own stacking context (`position: relative` + explicit `z-index`), and its mobile nav panel
(nested inside it, `position: fixed`) would otherwise get visually trapped below same-z-index
content in `<main>` that happens to paint later in DOM order. See `known_patterns.md`.

## Shared Primitives (`src/components/ui/`)
Use these instead of ad-hoc markup on content pages:
- `SketchIcon` — hand-drawn icon set (`server`, `spark`, `layers`, `cloud`,
  `pipeline`, `pencil`) styled via `.sketch-icon` (stroke: currentColor +
  global `#rough` filter). Used on Home capability cards and Skills category
  cards; add new icons here rather than one-off SVGs.
- `InkRule` — static hand-drawn divider (3 fixed path variants, no animation — Home's animated
  `.rule` divider is a separate, deliberately different component/class).
- `HandDrawnButton` — the `.btn` + drawn-ring-outline pattern, generalized for any `href`.
- `SectionHeading` — eyebrow + real `<h2>`/`<h3>` heading pair.
- `Card` — rough-bordered card via the stretchy-SVG-frame technique (see the non-scaling-stroke
  gotcha above).
- `RevealSection` — IntersectionObserver-driven scroll-into-view fade/blur-in for below-the-fold
  content on the 8 non-Home pages. Deliberately uses different class names (`.reveal-section`/
  `.in-view`) and a different trigger (IntersectionObserver, not `document.fonts.ready`) than
  Home's choreography — no shared state or timers between the two systems.

## Draw-Mode Interaction System
Lives in `src/lib/charcoal.js` (procedural figure/dust canvas engine) and
`src/lib/playground.js` (the interactive draw/toolbar system) — both are vanilla JS IIFEs
attached to `window.Charcoal`/`window.Playground`, dynamically imported (not React components).
This system went through many rounds of bug-fixing; see `known_patterns.md` before touching it.

## Hero Layout — Column Proportions & Viewport Fit
`.hero`'s grid is `grid-template-columns: minmax(0, 1fr) 40%;` with `justify-content:
space-between` on `.hero`. The portrait column is a literal, fixed 40% of `.hero`'s width by
design spec. `.hero-portrait-wrap` fills that column at `width: 100%` (capped `max-width:
620px` for ultra-wide screens) — do not reintroduce an independent `vw`-based width on the
portrait wrapper, or it will drift from the 40% the column guarantees.

**No width cap on the text content** — `.hero-text` and `.lede` both have no `max-width`
(removed per explicit user request), and there is NO `avail-badge` element anymore (also
removed per user request, along with its CSS — `.avail-badge`, `.pulse`, `@keyframes
availPulse` are all gone; don't re-add without being asked).

**The text column MUST stay `1fr`, not a fixed px cap.** This flip-flopped once and it's worth
recording exactly why: with `.hero-text`/`.lede` uncapped, the `.lede` paragraph naturally
fluid-wraps to fill however much width its grid column offers — there's no ch-based limit
holding it back anymore. A `minmax(0, 1fr)` column therefore lets `.lede`'s own wrap width
(not an arbitrary number) determine how close the text's right edge sits to the portrait,
which is exactly what closes the gap: verified via Playwright bounding-box measurement, the
text-to-image gap is now a tight, near-constant ~68–72px (matching the `column-gap` value
almost exactly, i.e. near-zero *wasted* space) across the full 1366–2560px range. The
intermediate version used a *fixed* `580px` cap on this column — that was correct ONLY while
`.hero-text` still had its own `52ch` max-width (matching the fixed cap to capped content);
the moment the content-side cap was removed, the leftover fixed-column cap became a stale
bottleneck that under-filled the column and dumped the difference into the `space-between`
gap, reintroducing a ~160-330px gap. **Column sizing must track content sizing — if either
`.hero-text`'s cap or the column's cap changes, re-check the other.**

Two things previously caused a real reported bug ("too much empty space between text and
image", "See my work" wrapping onto two lines):
1. `.hero-text` had `max-width: 40ch` — far narrower than its actual grid column, leaving a
   dead gap before the image AND capping the `.cta-row` flex row too narrow for both CTAs to
   fit on one line. Now `52ch`, with an explicit `column-gap` on `.hero` doing the job of
   separating the columns instead.
2. `.link-plain` had no `white-space: nowrap` — under the old cramped width it wrapped
   mid-phrase. Now `nowrap` on the link itself, with `.cta-row { flex-wrap: wrap }` as the
   graceful fallback (the whole link drops to its own line if it must, never splits internally).

**Viewport-fit rule for the hero**: the headline/lede/CTA stack must keep its `.cta-row`
bottom edge above the fold on real laptop viewports without scrolling. This was verified with
Playwright bounding-box checks (not just eyeballing) at 1366×768, 1440×900, 1512×900, and
1920×1080 — 1366×768 is the tightest real-world case and was the one that first failed. The
levers, in order of impact: `.headline`'s `font-size` clamp ceiling (currently `clamp(44px,
6vw, 92px)`, line-height 0.88 — do not raise without re-checking 1366×768), then the
margin-top/margin-bottom clamps on `.avail-badge`/`.eyebrow`/`.lede`/`.cta-row`. `.home-hero`'s
`min-height` is `88svh`, not `100vh` — it sits below `<header>` in normal flow (see
`architecture.md`), so `100vh`-of-hero plus the header's own height always exceeded one real
screen by construction, regardless of how tight the internal spacing was.

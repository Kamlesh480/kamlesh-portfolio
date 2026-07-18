# Theme & Styling — Charcoal/Paper Design System

## Where Styles Live
Almost everything is in one hand-written `src/app/globals.css`. Tailwind v4 is installed but
supplemental at most (a handful of utility classes) — **never** introduce Tailwind component
classes as a replacement for the hand-drawn charcoal design language. Do not add a second
styling system.

## Color Tokens (`:root` in globals.css)
```
--paper:      #f6f3ec   (base background)
--paper-hi:   #fbf8f2   (lighter gradient edge)
--paper-lo:   #eae5da   (darker gradient edge)
--char-deep:  #161410   (near-black charcoal — headlines)
--char:       #221f1a   (body charcoal)
--graphite:   #423e36   (secondary text)
--graphite-s: #665f53   (muted/caption text — contrast floor, see below)
--edge:       #2a2620   (rules, borders)
```
Also load-bearing for perceived brightness: the `#grain`/`#tooth` texture layers
multiply-darken the paper — their `opacity` values (0.42 / 0.38, lowered from
0.55 / 0.5 in the brightness pass) are the main lever for how light the whole
site feels, more than the tokens themselves. The `#vignette` inset shadows were
also softened in the same pass. On mobile (≤880px) the hero `#figure` renders at
`opacity: 0.28` — it was 0.6 originally, which put the headline directly on the
figure's dark mass and hurt readability.
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
- `#charcoalText` — heavier wobble + a punched-grain pass (dry-charcoal look). Used on large
  display headlines (`.headline`, `.page-title`).
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

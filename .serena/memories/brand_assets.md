# Brand Assets — KC Monogram System

## The Mark
A hand-sketched "KC" monogram (Kamlesh Chhipa), built as real SVG paths — not a generated
raster image. Uses the same charcoal technique as the rest of the site: double-pass strokes
(a fainter echo path layered under the main stroke, simulating an artist redrawing a line),
`feTurbulence`/`feDisplacementMap` wobble, and a dry-grain filter that punches small flecks out
of the stroke.

## Source of Truth
- `public/brand/kc-mark.svg` — master, charcoal-on-transparent. Every other raster variant is
  rendered from this file (via Playwright screenshot, not a design tool) — if the mark design
  ever changes, edit this file first and regenerate the rest from it.
- `public/brand/kc-mark-paper.svg` — same paths, off-white stroke, for dark backgrounds.
- `src/components/layout/BrandMark.tsx` — the inline React version used live in the site header.
  This is a **simplified, size-tuned variant**, not a direct embed of `kc-mark.svg`: it drops
  the echo strokes and dry-grain filter (they read as noise at header scale, ~30-40px) and
  reuses the site's global `#rough` filter from `SvgFilterDefs` instead of carrying its own
  `<defs>` — do not duplicate filter definitions here.
- `src/app/icon.svg` — the favicon source (Next.js file-convention icon). Bolder strokes still
  further simplified, on an opaque paper-colored rounded tile, sized to stay legible at 16px.

## Generated Variants (in `public/brand/`)
`kc-mark.png` / `kc-mark-paper.png` (1024px transparent), `logo-horizontal(-paper).png` and
`logo-vertical(-paper).png` (mark + "Kamlesh Chhipa" wordmark lockups), `avatar.png` (1024²
square on the paper gradient, for LinkedIn/GitHub profile use).

## Wired Into the Site
- `src/app/favicon.ico` — hand-packed multi-resolution ICO (16/32/48, PNG-in-ICO format). No
  npm package was used for this; there's a one-off packer script (not committed — it lived in
  the working scratchpad) that concatenates a minimal ICONDIR header + entries + the three RGBA
  PNGs. **The PNGs must be RGBA, not RGB** — see `known_patterns.md` Bug 6.
- `src/app/apple-icon.png` — 180² touch icon, Next.js file convention.
- `public/og-image.png` — social share image, composited from an HTML template (Caveat font +
  the mark + current hero headline copy) via a Playwright screenshot, not `next/og`/Satori.
  If the Home hero headline ever changes again, this image should be regenerated to match —
  it's a static asset, not dynamically generated per-request.

## Color Note
The favicon tile and OG image background were generated against the pre-contrast-fix paper
tone (`#e8e4da`) — see `theme_and_styling.md` for the current `--paper` value (`#f9f7f1`). The
difference is visually negligible in isolation but they're technically stale; regenerate them
from the current token if exact consistency ever matters (e.g. before a print use case).

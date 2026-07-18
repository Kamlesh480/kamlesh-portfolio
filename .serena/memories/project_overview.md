# Kamlesh Chhipa Portfolio — Project Overview

## Purpose
Personal-brand portfolio site for Kamlesh Chhipa (backend/full-stack/AI-infra software
engineer). Live at https://kamlesh-chhipa.com/. Not a typical single-page dev portfolio —
a full multi-page site with a distinctive hand-drawn "charcoal on paper" visual identity,
built to attract recruiters, founders, and hiring managers.

The old portfolio (https://kamlesh480.github.io/, repo `Kamlesh480/Kamlesh480.github.io`) is
permanently retired — it now serves a meta-refresh + canonical redirect to this site (GitHub
Pages has no server-side 301, so that's the closest equivalent; Google treats it as one).

## Tech Stack
- **Next.js 16.2.6** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS v4** — installed but barely used; the real styling is a single hand-written
  `src/app/globals.css` (~1100 lines). Tailwind is not the design system here.
- No CMS, no database, no backend — fully static content driven by typed data files in
  `src/content/`. `next build` prerenders all 9 routes as static HTML.
- No test runner is configured in `package.json`. Verification for this project has
  historically been done via ad-hoc Playwright scripts run from a scratchpad directory
  outside the repo, not committed test files — see `known_patterns.md`.

## Running Locally
```bash
npm run dev     # dev server, typically on :3001 (see note below)
npm run build   # production build — must pass with zero type errors before shipping
npm run start   # serve the production build
npm run lint    # eslint
```
Note: port 3000 is often occupied by an unrelated sibling project (a "Lumen/ClaimBridge"
dashboard) on this machine — the portfolio dev server is conventionally run on `--port 3001`.
Always verify which port is actually serving this repo before trusting `curl localhost:3000`.

## Key Entry Points
- `src/app/layout.tsx` — root layout. Mounts `SiteChrome`, `SiteHeader`, `<main>{children}</main>`,
  `SiteFooter`. Owns all site-wide `metadata` (title template, OG/Twitter defaults, robots,
  `metadataBase`) and the `Person`/`WebSite` JSON-LD via `<JsonLd>`.
- `src/app/page.tsx` — Home route, renders `HeroSection` only.
- `src/lib/routes.ts` — single source of truth for every route (path, label, header/footer
  visibility, sitemap priority/changeFrequency). Nav, footer, and `sitemap.ts` all read from
  this array — do not hardcode route lists elsewhere.
- `src/lib/seo.ts` — `SITE_URL` (env-driven, no domain hardcoded elsewhere), `pageMetadata()`
  helper every route's `page.tsx` should use for its `export const metadata`.
- `src/content/{experience,projects,skills}.ts` — the actual resume/project content, typed via
  `src/content/types.ts`. See `content_and_seo.md` for the accuracy rules governing this data.

## Site Map (9 routes)
Home `/`, About, Experience, Projects, Skills, Contact — fully built.
Architecture, Blog (`/blog`, labelled "Engineering Notes" in nav), Resume — intentionally
lightweight placeholders/functional-but-not-final (Resume has a working PDF download + summary,
not yet the full interactive reader originally scoped).

## Brand Assets
See `brand_assets.md` for the full KC monogram system (favicon, OG image, logo lockups).

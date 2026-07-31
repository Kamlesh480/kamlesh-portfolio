---
description: Audit .serena/memories/*.md against the current codebase and update anything out of sync
argument-hint: "[memory file name, e.g. architecture — omit to audit all]"
---

Audit all `.serena/memories/*.md` files against the current codebase and update anything that is out of sync.

$ARGUMENTS may optionally name a specific file to focus on (e.g. `architecture` or `theme_and_styling`).
If no argument is given, audit ALL memory files.

**Read `.serena/memories/memory_maintenance.md` FIRST** — it defines the house style (dense agent
notes, invariants over prose) and the add/update threshold every edit below must obey. Do not
violate it to "be thorough."

---

## Step 1 — Orient: what changed recently?

Run these first to understand the scope of drift:

```bash
git log --oneline -20
git diff HEAD~5 HEAD --stat
git status --porcelain
```

Map changed paths to the memory file(s) they affect:

- `src/app/layout.tsx`, `src/components/chrome/SiteChrome.tsx`, `SvgFilterDefs.tsx`, route folder structure under `src/app/` → `architecture.md` (Persistent Chrome, Chrome Split, Layout Model)
- `src/components/home/HeroSection.tsx`, `HomeSections.tsx` → `architecture.md` (Home-Only Content) **and** `theme_and_styling.md` (Hero Layout)
- `src/content/{types,experience,projects,skills}.ts` → `architecture.md` (Content Data Model); content-accuracy invariants → `known_patterns.md`
- `src/components/diagram/*` → `architecture.md` (Hand-Drawn Diagram System)
- `src/lib/seo.ts`, `src/lib/routes.ts`, `src/app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `src/components/seo/JsonLd.tsx` → `architecture.md` (SEO Layer) + `project_overview.md` (Site Map)
- `src/app/globals.css` (`:root` tokens, z-index scale, filters, primitive classes) → `theme_and_styling.md`
- `src/components/ui/*` (Card, InkRule, HandDrawnButton, SectionHeading, RevealSection, SketchIcon) → `theme_and_styling.md` (Shared Primitives)
- `src/lib/charcoal.js`, `src/lib/playground.js` → `theme_and_styling.md` (Draw-Mode) + `known_patterns.md` (draw-mode bugs)
- `public/brand/*`, the monogram source → `brand_assets.md`
- `package.json`, scripts, deps, Node/Next version → `project_overview.md` (Tech Stack, Running Locally)
- A new route/page added or removed → `project_overview.md` (Site Map) **and** `src/lib/routes.ts` must agree
- Any bug found & fixed that a future dev could re-hit → `known_patterns.md`

---

## Step 2 — Read the source of truth

Read the actual code for every area that changed. The load-bearing files for this project:

```
src/app/layout.tsx
src/app/globals.css                      # tokens, z-index, filters, primitive CSS
src/components/chrome/SiteChrome.tsx
src/components/chrome/SvgFilterDefs.tsx
src/lib/routes.ts                         # single source of truth for nav + sitemap
src/lib/seo.ts                            # SITE_URL resolution, metadata helpers
src/content/types.ts                      # ExperienceEntry / ProjectEntry / SkillGroup shape
src/components/diagram/Sketch.tsx         # primitive exports
src/components/ui/                        # shared primitives (ls this dir)
```

Also `ls src/app` to confirm the actual route list, and `ls src/components/diagram` / `ls src/components/ui`.

Heed `AGENTS.md`: this is a pinned-but-modified Next.js — verify any Next-API claim against
`node_modules/next/dist/docs/` before writing it into a memory.

---

## Step 3 — Read current memory files

Read every `.serena/memories/*.md` file you plan to touch BEFORE editing:

```
.serena/memories/memory_maintenance.md   # style + threshold — read first, always
.serena/memories/project_overview.md
.serena/memories/architecture.md
.serena/memories/theme_and_styling.md
.serena/memories/known_patterns.md
.serena/memories/brand_assets.md
```

---

## Step 4 — Identify the gaps

For each file, compare against code. Drift patterns to look for:

### `project_overview.md`
- A route added/removed under `src/app/` not reflected in the Site Map list (and count in the heading)
- Tech-stack version bump (Next.js, React) or a new dev script in `package.json`
- Key entry-point path renamed/moved

### `architecture.md`
- New route or top-level structural change not described
- `Content Data Model`: `types.ts` interface fields changed (e.g. a field made optional), or the array-order / anonymized-entry invariants no longer hold
- `Hand-Drawn Diagram System`: primitive list drifts from `Sketch.tsx` exports; new gotcha discovered
- `SEO Layer`: `NEXT_PUBLIC_SITE_URL` / `resolveSiteUrl()` behaviour changed, or a route not covered by `routes.ts`-derived sitemap/robots
- Any DOM id owned by `SiteChrome` added/removed from the documented id list

### `theme_and_styling.md`
- `Color Tokens`: a `--*` custom property added/renamed/recolored in `:root` (globals.css)
- `Z-Index Scale`: a `--z-*` token added or its value changed
- `SVG Filters`: a filter id added/removed in `SvgFilterDefs.tsx` or its params retuned
- `Shared Primitives`: a component added/removed in `src/components/ui/`
- `Hero Layout`: column proportions / viewport-fit rules changed in `HeroSection` or its CSS

### `known_patterns.md`
- A new bug fixed that a future dev could re-introduce → add it (symptom → root cause → fix)
- An existing bug entry is stale (function renamed, mechanism changed)
- The Content-Accuracy Rule needs a new invariant (e.g. a new "never fabricate X")

### `brand_assets.md`
- Monogram source or generated variants in `public/brand/` changed
- A new place the mark is wired into the site

---

## Step 5 — Update the memory files

Make targeted edits. Rules (in addition to `memory_maintenance.md`):
- Edit only what actually changed — never rewrite still-accurate sections
- Keep each file's existing structure, heading names, and terse bullet style
- Prefer invariants and non-obvious gotchas; a fact readable in one glance from the code does NOT belong here
- `known_patterns.md`: lead with the symptom, then root cause, then the fix; never delete an entry unless the bug genuinely cannot recur
- When you document a new gotcha, state the constraint the code can't show on its own (the "why it must stay this way"), not a restatement of the code

### Using Serena MCP tools (when available)
If `read_memory` / `write_memory` tools are listed in the session, prefer them (they keep the
memory index and `mem:` references consistent). If Serena MCP tools are NOT connected, use the
standard `Read` and `Edit` file tools directly on `.serena/memories/*.md`.

---

## Step 6 — Verify consistency

After editing, cross-check:

1. Every `page.tsx` under `src/app/` appears in `project_overview.md`'s Site Map **and** in `src/lib/routes.ts` (header/footer/sitemap all derive from it — no drift allowed)
2. Every `--*` color token and `--z-*` value in `globals.css` `:root` matches `theme_and_styling.md`
3. Every `<filter id="…">` in `SvgFilterDefs.tsx` matches the ids listed in `theme_and_styling.md` and used in `globals.css`
4. Exported primitives in `src/components/diagram/Sketch.tsx` match the list in `architecture.md`'s Diagram System section
5. Components in `src/components/ui/` match `theme_and_styling.md`'s Shared Primitives list
6. `ExperienceEntry` / `ProjectEntry` / `SkillGroup` fields in `src/content/types.ts` match `architecture.md`'s Content Data Model
7. Run `serena memories check` (if the CLI is available) for a stale-reference report

Finally: `npx tsc --noEmit` should still pass — you should not have touched code, only `.md`.

---

## What NOT to update

- Do not document file structure or code patterns readable directly from the source — memories are for non-obvious facts, quirks, and invariants (per `memory_maintenance.md`)
- Do not paste component/function bodies into memory — summarise the invariant that matters
- Do not add git history, PR numbers, dates, or "added for X" notes — those live in commit messages
- Do not record volatile line-level details or one-off task notes
- Do not invent Next.js API behaviour — verify against `node_modules/next/dist/docs/` first

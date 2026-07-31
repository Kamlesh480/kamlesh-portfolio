# Adding an Engineering Note

**To publish a post: create one `.md` file in this directory. That's the whole process.**
The route, metadata, cover art, reading time, table of contents, Article structured data,
sitemap entry, related-posts links, and prev/next navigation are all derived automatically.
No page or component needs editing, ever.

The filename becomes the URL by default, but you should set `slug:` in the frontmatter and
let that decide — the filename can then stay whatever is convenient to organise by, and
renaming a file will never break an already-indexed URL.

## Choosing the URL (this matters more than it looks)

**The URL is a ranking signal, and it's permanent. Never use an internal codename.**

An internal codename like `acme-collector-v2` is exactly what not to use: nobody searches for
it, it ranks for nothing, and it publishes a system name your employer never made public. The same article at
`scaling-serp-keyword-collection-pipeline` targets terms people actually type.

Rules:

- **Pull 3–6 keywords out of the article's own topic** — what would someone type into Google
  to find this problem? Not what you call the project internally.
- **Front-load the primary keyword.** `scaling-serp-keyword-collection-pipeline`, not
  `how-i-went-about-scaling-things`.
- Lowercase, hyphen-separated, no dates, no version numbers, no stop words
  (`a`, `the`, `how-to`). Aim under ~60 characters.
- The **title stays human** — it does not have to match the slug. Titles sell the click;
  slugs carry the keywords.
- **Once a post is live, never change the slug.** You'd lose the indexed URL and every
  inbound link. Change the title freely instead.

A build **fails** on a malformed slug (uppercase, spaces, double hyphens), and `npm run dev`
**warns** when a slug looks like a codename (`…-v2`) or is shorter than three words.

---

## Frontmatter

```yaml
---
title: "Rebuilding a keyword collector for 100M+ keywords a month"
description: "One sentence. Used on cards, in Google results, and on social previews."
date: "2026-07-31"          # YYYY-MM-DD — controls ordering
updated: "2026-08-14"       # optional; only add when you actually revise it
category: "Data Infrastructure"
tags: ["python", "rabbitmq", "scale"]
featured: true              # optional — pins to the featured slot (use on one post)
draft: true                 # optional — visible in `npm run dev`, excluded from production
coverTitle: "SERP collection at scale"  # optional — overrides the generated cover label
---
```

`title`, `description`, `date`, and `category` are **required** — a build fails loudly with
the filename and the missing field rather than shipping a half-broken post.

**Drafts** are the safe way to work: with `draft: true` the post renders on the dev server
so you can read it in place, but is excluded from the production build, the listing, and
the sitemap. Delete the line when it's ready.

---

## Writing the body

Standard markdown works as expected: `##`/`###` headings, lists, **bold**, links, tables,
blockquotes, images, and inline `` `code` ``.

Two rules worth knowing:

- **Only `##` and `###` appear in the table of contents.** Use `##` for major sections.
  Don't use `#` — the post title is already the page's single `<h1>`.
- Heading anchors are generated from the heading text, so changing a heading changes its
  anchor link.

### Code blocks

Put the language after the fence for syntax highlighting and a language label:

````markdown
```python
async def collect(keyword: str) -> dict:
    return {"keyword": keyword}
```
````

Highlighted languages: `python`, `typescript`, `javascript`, `tsx`, `jsx`, `json`, `yaml`,
`bash`, `shell`, `sql`, `dockerfile`, `go`, `rust`, `html`, `css`, `diff`, `ini`.
Anything else still renders correctly, just without colouring. Every block gets a copy
button automatically.

### Callouts

```markdown
:::note Optional custom title
Body text, which can contain **markdown** and [links](https://example.com).
:::

:::tip
:::

:::warning
:::
```

### Metrics row

Each line is `value | label`:

```markdown
:::metrics
- 4× | faster processing
- 100M+ | keywords / month
:::
```

### Timeline

Same `label | description` shape:

```markdown
:::timeline
- V1 | Request-bound collector, one process
- V2 | Queue plus a worker pool
:::
```

### Diagrams

Embed any hand-drawn diagram that already exists on the site, by slug:

```markdown
:::diagram keyword-collection-pipeline
```

Available slugs come from the three diagram sets — projects
(`ai-hyper-cube`, `trino-iceberg-clickhouse-pipeline`, `keyword-collection-pipeline`,
`healthcare-platform`), experience (`brightedge`, `hevo-data`, `duit-technologies`,
`personal-project`), and architecture decisions (`inference-in-house`,
`tenancy-as-invariant`, `idempotent-webhooks`). An unknown slug renders nothing rather
than crashing the build.

To add a *new* diagram, add it to the relevant file in `src/components/diagram/` — see
`.serena/memories/architecture.md` for the conventions (especially: never put the
`#rough` filter on a straight line).

### Images

```markdown
![Alt text for screen readers](/blog/my-image.png "Optional caption shown under the image")
```

Put files in `public/blog/`. Images are lazy-loaded and click-to-zoom automatically.
Note that photography sits awkwardly against this site's charcoal design — prefer a
diagram where one will do.

---

## Cover images

There are none to make, and nothing to source or license.

Each post gets generated cover art in the site's charcoal language that is a **simplified
schematic of what the article is about** — not decoration. Pick the shape with `cover:`:

| `cover:` | Draws | Use for |
|---|---|---|
| `pipeline` | sources → processor → queue → store | data pipelines, throughput, ingestion |
| `comparison` | one node splitting into a rejected (faded) and a chosen (inked) path | trade-offs, migrations, "X vs Y", rebuilds |
| `layers` | a stack with one layer inked and an extent bracket | architecture, stacks, platforms |
| `timeline` | milestones along a line, the last one inked | journeys, evolution, retrospectives |

Omit `cover:` and it's inferred from the category, tags, and title. `coverTitle` sets the
handwritten label in the corner (defaults to the category).

The art is deterministic — derived from the slug — so a post always renders the same cover
across builds, while different posts vary. It's drawn in a fixed 320×180 space and scaled
with `xMidYMid meet`, so shapes are never distorted across card, featured, and hero sizes.

---

## Checklist before publishing

1. `npm run dev` → read the post at `/blog/<slug>` end to end.
2. Check the table of contents matches your `##` headings.
3. Remove `draft: true`.
4. `npm run build` — this is what catches missing frontmatter.

## Content accuracy

The same rule that governs the rest of this site applies here: **don't publish a metric,
employer detail, or internal system behaviour that isn't accurate.** Approximate numbers
should read as approximate. If something is confidential, describe the shape of the
problem without the specifics — see `.serena/memories/known_patterns.md`.

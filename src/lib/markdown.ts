import MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'
import { createHighlighter, type Highlighter } from 'shiki'
import type { TocEntry } from '@/content/types'

/**
 * Markdown → HTML for blog posts, plus TOC extraction.
 *
 * Server-only and build-time only (every post prerenders). Post content is
 * authored by us, so `html: true` is safe here — do NOT reuse this renderer for
 * anything user-submitted without adding sanitisation.
 *
 * Two kinds of custom block exist, and they are handled differently on purpose:
 *  - `:::note|tip|warning` stay as markdown-it containers, because their bodies
 *    are prose that must keep rendering markdown (links, code, emphasis).
 *  - `:::diagram|metrics|timeline` are split OUT before parsing. Their bodies
 *    are structured data, not prose, and pre-splitting avoids fighting
 *    markdown-it's list rendering. `:::diagram` additionally has to become a
 *    real React component, which an HTML string could never do.
 */

/* ---- Shiki: a theme that reads as ink on paper -------------------------- */
/* Stock themes are built for dark IDEs and look pasted-in against this site's
   palette. This one uses the site's own ink/graphite values plus the single
   slate accent, so code sits inside the design rather than on top of it. */
const charcoalTheme = {
  name: 'charcoal-paper',
  type: 'light' as const,
  colors: { 'editor.background': '#00000000', 'editor.foreground': '#221f1a' },
  settings: [
    { settings: { foreground: '#221f1a' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7c7466', fontStyle: 'italic' } },
    { scope: ['keyword', 'keyword.control', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#161410', fontStyle: 'bold' } },
    { scope: ['string', 'string.quoted', 'punctuation.definition.string'], settings: { foreground: '#4a6076' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: '#7a5c34' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#2f4356' } },
    { scope: ['entity.name.type', 'entity.name.class', 'support.class', 'support.type'], settings: { foreground: '#3a5568' } },
    { scope: ['variable', 'variable.parameter', 'variable.other'], settings: { foreground: '#3a352c' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#6b6456' } },
    { scope: ['entity.name.tag'], settings: { foreground: '#161410', fontStyle: 'bold' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#4a6076' } },
    { scope: ['markup.inserted'], settings: { foreground: '#3f5d3f' } },
    { scope: ['markup.deleted'], settings: { foreground: '#7a3f3f' } },
  ],
}

/** Languages worth loading — anything else renders unhighlighted. */
const LANGS = [
  'python', 'typescript', 'javascript', 'tsx', 'jsx', 'json', 'yaml',
  'bash', 'shell', 'sql', 'dockerfile', 'go', 'rust', 'html', 'css', 'diff', 'ini',
]

let highlighterPromise: Promise<Highlighter> | null = null
function getHighlighter() {
  // Grammar loading is expensive; do it once per build process.
  highlighterPromise ??= createHighlighter({ themes: [charcoalTheme], langs: LANGS })
  return highlighterPromise
}

/* ---- helpers ------------------------------------------------------------ */
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export type BodySegment =
  | { kind: 'html'; html: string }
  | { kind: 'diagram'; slug: string }

/** "- 4× | faster processing" → { value, label } */
function splitPair(line: string): { value: string; label: string } {
  const text = line.replace(/^[-*]\s+/, '').trim()
  const i = text.indexOf('|')
  return i === -1
    ? { value: text, label: '' }
    : { value: text.slice(0, i).trim(), label: text.slice(i + 1).trim() }
}

function renderMetrics(lines: string[]): string {
  const cards = lines
    .filter((l) => l.trim())
    .map(splitPair)
    .map(
      (p) =>
        `<div class="metric-card"><span class="metric-value">${escapeHtml(p.value)}</span>` +
        `<span class="metric-label">${escapeHtml(p.label)}</span></div>`
    )
    .join('')
  return `<div class="metric-row">${cards}</div>`
}

function renderTimeline(lines: string[]): string {
  const steps = lines
    .filter((l) => l.trim())
    .map(splitPair)
    .map(
      (p) =>
        `<li class="timeline-step"><span class="timeline-label">${escapeHtml(p.value)}</span>` +
        `<span class="timeline-body">${escapeHtml(p.label)}</span></li>`
    )
    .join('')
  return `<ol class="timeline">${steps}</ol>`
}

/* ---- renderer ----------------------------------------------------------- */

function createRenderer(toc: TocEntry[], highlighter: Highlighter) {
  const slugCounts = new Map<string, number>()
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: false })

  // Callouts keep markdown rendering inside them.
  for (const type of ['note', 'tip', 'warning'] as const) {
    md.use(container, type, {
      render(tokens: { nesting: number; info: string }[], idx: number) {
        if (tokens[idx].nesting !== 1) return '</div></aside>'
        const title = tokens[idx].info.trim().slice(type.length).trim() || type
        return (
          `<aside class="callout callout--${type}" role="note">` +
          `<p class="callout-title">${escapeHtml(title)}</p><div class="callout-body">`
        )
      },
    })
  }

  // Headings: stable unique ids + TOC capture.
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const level = Number(tokens[idx].tag.slice(1))
    const text = tokens[idx + 1]?.content ?? ''
    if (level === 2 || level === 3) {
      const base = slugify(text) || `section-${toc.length + 1}`
      const n = (slugCounts.get(base) ?? 0) + 1
      slugCounts.set(base, n)
      const id = n === 1 ? base : `${base}-${n}`
      tokens[idx].attrSet('id', id)
      toc.push({ id, text, level: level as 2 | 3 })
    }
    return self.renderToken(tokens, idx, options)
  }

  // Code fences: Shiki, with a language label and a copy affordance.
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]
    const requested = (token.info || '').trim().split(/\s+/)[0].toLowerCase()
    const lang = LANGS.includes(requested) ? requested : 'text'
    let code: string
    try {
      code = highlighter.codeToHtml(token.content, { lang, theme: 'charcoal-paper' })
    } catch {
      code = `<pre class="shiki"><code>${escapeHtml(token.content)}</code></pre>`
    }
    return (
      `<figure class="code-block">` +
      `<figcaption class="code-block-bar">` +
      `<span class="code-lang">${escapeHtml(requested || 'text')}</span>` +
      `<button class="code-copy" type="button" aria-label="Copy code to clipboard">Copy</button>` +
      `</figcaption>${code}</figure>`
    )
  }

  // Wide tables scroll inside their own container rather than forcing the
  // article column wider. Wrapping (instead of `display:block` on the table)
  // keeps real table semantics for assistive tech.
  md.renderer.rules.table_open = () => '<div class="table-scroll"><table>'
  md.renderer.rules.table_close = () => '</table></div>'

  // Images become figures; the markdown title attribute becomes the caption.
  md.renderer.rules.image = (tokens, idx) => {
    const t = tokens[idx]
    const src = String(t.attrGet('src') ?? '')
    const title = t.attrGet('title') == null ? '' : String(t.attrGet('title'))
    return (
      `<figure class="post-figure">` +
      `<img src="${escapeHtml(src)}" alt="${escapeHtml(String(t.content ?? ''))}" loading="lazy" decoding="async" />` +
      (title ? `<figcaption>${escapeHtml(title)}</figcaption>` : '') +
      `</figure>`
    )
  }

  // External links open in a new tab, safely.
  const defaultLinkOpen =
    md.renderer.rules.link_open ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = String(tokens[idx].attrGet('href') ?? '')
    if (/^https?:\/\//.test(href)) {
      tokens[idx].attrSet('target', '_blank')
      tokens[idx].attrSet('rel', 'noopener noreferrer')
    }
    return defaultLinkOpen(tokens, idx, options, env, self)
  }

  return md
}

const OPEN_RE = /^:::(diagram|metrics|timeline)(?:\s+([\w-]+))?\s*$/
const CLOSE_RE = /^:::\s*$/

/**
 * Render a post body into ordered segments plus its table of contents.
 * Segments exist so `:::diagram` can mount a real React component — an
 * all-HTML string render could never do that.
 */
export async function renderPostBody(
  body: string
): Promise<{ segments: BodySegment[]; toc: TocEntry[] }> {
  const highlighter = await getHighlighter()
  const toc: TocEntry[] = []
  const md = createRenderer(toc, highlighter)

  const segments: BodySegment[] = []
  let buffer: string[] = []

  const flushMarkdown = () => {
    const chunk = buffer.join('\n').trim()
    if (chunk) segments.push({ kind: 'html', html: md.render(chunk) })
    buffer = []
  }

  const lines = body.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(OPEN_RE)
    if (!m) {
      buffer.push(lines[i])
      continue
    }
    const [, kind, arg] = m
    flushMarkdown()

    if (kind === 'diagram') {
      if (arg) segments.push({ kind: 'diagram', slug: arg })
      continue
    }

    // metrics / timeline: consume until the closing :::
    const inner: string[] = []
    i++
    while (i < lines.length && !CLOSE_RE.test(lines[i])) inner.push(lines[i++])
    segments.push({
      kind: 'html',
      html: kind === 'metrics' ? renderMetrics(inner) : renderTimeline(inner),
    })
  }
  flushMarkdown()

  return { segments, toc }
}

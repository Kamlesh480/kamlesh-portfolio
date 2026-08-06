import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getAllPosts, getPostBySlug } from '@/lib/blog'

/**
 * Per-post social share card (1200×630).
 *
 * Every page previously shared one static site-wide image, so a post linked on
 * LinkedIn or X showed a generic portfolio graphic that said nothing about the
 * article. This renders a unique card per post from the post's own frontmatter —
 * automatic for every future post, nothing to design by hand.
 *
 * NOTE: this is rendered by Satori, which cannot run the `#rough` SVG filters
 * that give the site its hand-drawn texture. The card therefore uses the right
 * palette and typography but flatter linework than the on-site diagrams — an
 * accepted trade for fully automatic generation.
 */

export const alt = 'Engineering note by Kamlesh Chhipa'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Prerender a card for every post at build time. */
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

const PAPER = '#f6f3ec'
const PAPER_HI = '#fdfcf8'
const INK = '#161410'
const BODY = '#423e36'
const MUTED = '#665f53'
const ACCENT = '#47617a'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  // STATIC font instances only — Satori cannot parse variable fonts
  // (a `[wght]` file fails with "Cannot read properties of undefined"), so these
  // are static instances from Fontsource, not the Google Fonts variable files.
  const [caveat, cormorant] = await Promise.all([
    readFile(join(process.cwd(), 'assets/fonts/Caveat-Bold.woff')),
    readFile(join(process.cwd(), 'assets/fonts/Cormorant-Regular.woff')),
  ])

  const title = post?.title ?? 'Engineering Notes'
  const category = post?.category ?? 'Engineering Notes'
  const nodes = post?.coverNodes?.slice(0, 4) ?? []
  const metric = post?.coverMetric
  const readingTime = post?.readingTime

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: PAPER,
          padding: '62px 68px',
          fontFamily: 'Cormorant',
          // A hairline frame reads as the site's drawn card edge without
          // needing a filter Satori can't run.
          border: `2px solid ${INK}`,
          borderRadius: 4,
        }}
      >
        {/* eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 54, height: 2, background: MUTED }} />
          <div
            style={{
              fontSize: 25,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: MUTED,
              fontStyle: 'italic',
            }}
          >
            {category}
          </div>
        </div>

        {/* headline */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Caveat',
            fontSize: title.length > 62 ? 74 : 88,
            lineHeight: 1.06,
            color: INK,
            maxWidth: 1010,
          }}
        >
          {title}
        </div>

        {/* the article's chain, when the post declares one */}
        {nodes.length >= 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {nodes.map((n, i) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 20px',
                    borderRadius: 5,
                    fontSize: 26,
                    border: `2px solid ${INK}`,
                    background: i === nodes.length - 1 ? INK : PAPER_HI,
                    color: i === nodes.length - 1 ? PAPER_HI : BODY,
                  }}
                >
                  {n}
                </div>
                {i < nodes.length - 1 && <div style={{ fontSize: 26, color: MUTED }}>→</div>}
              </div>
            ))}
          </div>
        )}

        {/* footer: metric + byline */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {metric && (
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Caveat',
                  fontSize: 40,
                  color: ACCENT,
                  border: `2px solid ${ACCENT}`,
                  borderRadius: 999,
                  padding: '4px 26px',
                }}
              >
                {metric}
              </div>
            )}
            {readingTime && (
              // `display: flex` is required by Satori on any element with more
              // than one child — `{n} min read` is two text nodes, not one.
              <div style={{ display: 'flex', fontSize: 26, color: MUTED, fontStyle: 'italic' }}>
                {`${readingTime} min read`}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', fontFamily: 'Caveat', fontSize: 42, color: INK }}>
            Kamlesh Chhipa
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Caveat', data: caveat, style: 'normal', weight: 700 },
        { name: 'Cormorant', data: cormorant, style: 'normal', weight: 400 },
      ],
    }
  )
}

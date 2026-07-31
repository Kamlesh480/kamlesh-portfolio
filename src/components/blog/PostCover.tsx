import type { BlogPost } from '@/content/types'

/**
 * Generated cover art in the site's charcoal language — no photography, nothing
 * to source or license per post.
 *
 * The cover is a SIMPLIFIED SCHEMATIC of what the article is actually about,
 * not decoration: a pipeline post gets sources → processor → store, a
 * trade-off post gets two diverging paths with the chosen one inked in. Pick it
 * with `cover:` in frontmatter; otherwise it's inferred from category/tags.
 *
 * Drawn in a fixed 320×180 user space and scaled with `xMidYMid meet`, so
 * shapes are NEVER distorted across the card/featured/hero aspect ratios. (The
 * earlier version stretched a 100×100 box with `preserveAspectRatio="none"`,
 * which squashed circles into ellipses and read as random flat lines.)
 */

export type CoverMotif = 'pipeline' | 'comparison' | 'layers' | 'timeline'

/** Deterministic 0..1 from a string — same input, same output, every build. */
function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

/** Choose a motif from what the post is about, when none is declared. */
function inferMotif(post: BlogPost): CoverMotif {
  const hay = `${post.category} ${post.tags.join(' ')} ${post.title}`.toLowerCase()
  if (/(vs|versus|trade-?off|decision|migrat|replac|rebuild|before)/.test(hay)) return 'comparison'
  if (/(stack|layer|architecture|platform|full-?stack)/.test(hay)) return 'layers'
  if (/(journey|timeline|history|evolution|retro)/.test(hay)) return 'timeline'
  return 'pipeline'
}

/* Small helpers so every motif draws in the same hand. Straight connectors are
   NOT filtered — #rough erases axis-aligned strokes (known_patterns.md Bug 7). */
const Node = ({ x, y, w, h, solid }: { x: number; y: number; w: number; h: number; solid?: boolean }) => (
  <rect className={solid ? 'pc-node-box pc-node-box--solid' : 'pc-node-box'} x={x} y={y} width={w} height={h} rx={4} />
)
const Line = ({ x1, y1, x2, y2, dashed }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }) => (
  <line className={dashed ? 'pc-link pc-link--dash' : 'pc-link'} x1={x1} y1={y1} x2={x2} y2={y2} />
)
const Head = ({ x, y }: { x: number; y: number }) => (
  <path className="pc-link" d={`M ${x - 6} ${y - 4} L ${x} ${y} L ${x - 6} ${y + 4}`} fill="none" />
)

/* ---- motifs (320 × 180) ------------------------------------------------- */

function Pipeline({ seed }: { seed: string }) {
  const sources = 3
  const ys = [42, 90, 138]
  return (
    <>
      {ys.slice(0, sources).map((y, i) => (
        <g key={i}>
          <Node x={20} y={y - 13} w={50} h={26} />
          <Line x1={70} y1={y} x2={106} y2={90} />
        </g>
      ))}
      <Head x={112} y={90} />
      {/* the processing stage — inked, because it's the point of the article */}
      <Node x={114} y={60} w={72} h={60} solid />
      <Line x1={186} y1={90} x2={214} y2={90} />
      <Head x={220} y={90} />
      {/* queue segments */}
      <Node x={222} y={70} w={40} h={40} />
      {[232, 242, 252].map((x) => (
        <line key={x} className="pc-tick" x1={x} y1={78} x2={x} y2={102} />
      ))}
      <Line x1={262} y1={90} x2={278} y2={90} />
      <Head x={284} y={90} />
      {/* sink */}
      <ellipse className="pc-node-box" cx={300} cy={72} rx={16} ry={6} />
      <path className="pc-node-box" d="M 284 72 L 284 108 A 16 6 0 0 0 316 108 L 316 72" fill="none" />
      <circle className="pc-accent" cx={150} cy={90} r={2 + hash01(seed, 3) * 1.5} />
    </>
  )
}

function Comparison({ seed }: { seed: string }) {
  return (
    <>
      <Node x={18} y={76} w={56} h={28} />
      {/* rejected path — faded */}
      <path className="pc-link pc-link--faded" d="M 74 84 C 110 56, 130 46, 158 46" fill="none" />
      <g className="pc-faded">
        <Node x={162} y={30} w={78} h={32} />
      </g>
      <Line x1={240} y1={46} x2={262} y2={46} dashed />
      {/* chosen path — inked */}
      <path className="pc-link" d="M 74 96 C 110 124, 130 134, 158 134" fill="none" />
      <Head x={158} y={134} />
      <Node x={162} y={118} w={78} h={32} solid />
      <Line x1={240} y1={134} x2={262} y2={134} />
      <Head x={268} y={134} />
      <ellipse className="pc-badge-ring" cx={288} cy={134} rx={24} ry={13} />
      <ellipse className="pc-badge-ring pc-faded" cx={288} cy={46} rx={24} ry={13} />
      <circle className="pc-accent" cx={201} cy={134} r={2 + hash01(seed, 7) * 1.5} />
    </>
  )
}

function Layers({ seed }: { seed: string }) {
  const rows = 4
  const focal = 1 + Math.floor(hash01(seed, 11) * 2) // 1 or 2
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <Node key={i} x={54} y={26 + i * 34} w={168} h={26} solid={i === focal} />
      ))}
      {/* extent marker spanning the stack */}
      <Line x1={236} y1={26} x2={236} y2={26 + (rows - 1) * 34 + 26} />
      <Line x1={236} y1={26} x2={228} y2={26} />
      <Line x1={236} y1={128} x2={228} y2={128} />
      <circle className="pc-accent" cx={44} cy={26 + focal * 34 + 13} r={3} />
    </>
  )
}

function Timeline({ seed }: { seed: string }) {
  const stops = 4
  const focal = stops - 1
  return (
    <>
      <Line x1={30} y1={90} x2={290} y2={90} />
      {Array.from({ length: stops }, (_, i) => {
        const x = 40 + (i * 240) / (stops - 1)
        const r = i === focal ? 9 : 6 + hash01(seed, i * 5) * 1.5
        return (
          <g key={i}>
            <circle className={i === focal ? 'pc-node-box pc-node-box--solid' : 'pc-node-box'} cx={x} cy={90} r={r} />
            <line className="pc-tick" x1={x} y1={90 + r + 4} x2={x} y2={118} />
            <line className="pc-tick" x1={x - 14} y1={124} x2={x + 14} y2={124} />
          </g>
        )
      })}
    </>
  )
}

const MOTIFS: Record<CoverMotif, (p: { seed: string }) => React.ReactElement> = {
  pipeline: Pipeline,
  comparison: Comparison,
  layers: Layers,
  timeline: Timeline,
}

export default function PostCover({
  post,
  variant = 'card',
}: {
  post: BlogPost
  variant?: 'card' | 'featured' | 'hero'
}) {
  const motif = (post.cover as CoverMotif) ?? inferMotif(post)
  const Motif = MOTIFS[motif] ?? Pipeline
  const label = post.coverTitle ?? post.category

  return (
    <div className={`post-cover post-cover--${variant}`} aria-hidden="true">
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet" className="post-cover-art">
        <Motif seed={post.slug} />
      </svg>
      <span className="post-cover-label">{label}</span>
    </div>
  )
}

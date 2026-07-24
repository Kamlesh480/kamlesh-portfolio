/**
 * Hand-drawn charcoal diagram primitives.
 *
 * These render clean SVG geometry and let the global `#rough` filter
 * (defined once in SvgFilterDefs, applied via .sk-* classes in globals.css)
 * do the roughening — exactly the technique the .sketch-icon set already
 * uses, so diagrams read as the same hand and blend into the paper/charcoal
 * language instead of looking like exported documentation.
 *
 * Every stroked shape carries pathLength={1} and the `sk-draw` class so the
 * strokes can "draw themselves in" when the enclosing RevealSection scrolls
 * into view (see .reveal-section.in-view .sk-draw in globals.css). Text and
 * fills carry `sk-fade` and fade in on the same trigger. All animation is
 * pure CSS keyed off an ancestor class — no per-diagram JavaScript.
 *
 * Coordinates are authored in an arbitrary user-space (most diagrams use a
 * ~900-wide viewBox); the <Diagram> wrapper scales the whole thing to the
 * container width and lets it scroll horizontally on narrow screens rather
 * than shrinking labels into illegibility.
 */
import React from 'react'

export type Pt = { x: number; y: number }

const lines = (l: string | string[]): string[] => (Array.isArray(l) ? l : [l])

/* Deterministic pseudo-noise in [-1, 1] — same on server and client (no
 * Math.random, so no hydration mismatch). Used to give connectors a baked-in
 * hand-drawn wobble instead of leaning on the #rough filter, whose
 * object-bounding-box region collapses to nothing for perfectly horizontal or
 * vertical strokes and clips them away. */
function noise(n: number): number {
  const s = Math.sin(n) * 43758.5453
  return (s - Math.floor(s)) * 2 - 1
}

/** A gently wavering cubic from `from` to `to`, bowed by `bend` at the middle.
 * Returns the path plus the second control point (the end tangent, for
 * aiming an arrowhead). */
function sketchCurve(from: Pt, to: Pt, bend: number, amp = 2) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const seed = from.x * 7 + from.y * 13 + to.x * 17 + to.y * 23
  const off1 = bend * 0.5 + amp * noise(seed + 1)
  const off2 = bend * 0.5 + amp * noise(seed + 2)
  const c1 = { x: from.x + dx / 3 + nx * off1, y: from.y + dy / 3 + ny * off1 }
  const c2 = { x: from.x + (2 * dx) / 3 + nx * off2, y: from.y + (2 * dy) / 3 + ny * off2 }
  return { d: `M ${from.x} ${from.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`, c2 }
}

/* ---- Wrapper ------------------------------------------------------------ */

export function Diagram({
  viewBox,
  minWidth = 560,
  caption,
  title,
  children,
  className,
}: {
  viewBox: string
  minWidth?: number
  caption?: string
  /** Accessible description — becomes the SVG <title> and aria-label. */
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <figure className={`sketch-diagram${className ? ' ' + className : ''}`}>
      <div className="sketch-diagram-scroll">
        <svg
          className="sk"
          viewBox={viewBox}
          style={{ minWidth }}
          role="img"
          aria-label={title}
          preserveAspectRatio="xMidYMid meet"
        >
          <title>{title}</title>
          {children}
        </svg>
      </div>
      {caption && <figcaption className="sketch-cap">{caption}</figcaption>}
    </figure>
  )
}

/* ---- Text-in-a-box helper ----------------------------------------------- */

function CenteredText({
  cx,
  cy,
  label,
  sub,
}: {
  cx: number
  cy: number
  label: string | string[]
  sub?: string
}) {
  const ls = lines(label)
  const lineH = 17
  const subH = sub ? 15 : 0
  const total = ls.length * lineH + subH
  const first = cy - total / 2 + lineH / 2 + 1
  return (
    <g className="sk-fade">
      <text className="sk-label" x={cx} y={first} textAnchor="middle" dominantBaseline="middle">
        {ls.map((ln, i) => (
          <tspan key={i} x={cx} dy={i === 0 ? 0 : lineH}>
            {ln}
          </tspan>
        ))}
      </text>
      {sub && (
        <text
          className="sk-sub"
          x={cx}
          y={first + (ls.length - 1) * lineH + lineH / 2 + 8}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {sub}
        </text>
      )}
    </g>
  )
}

/* ---- Box ---------------------------------------------------------------- */

export function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  solid,
  rx = 8,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string | string[]
  sub?: string
  /** Filled charcoal node — the focal "key move" in a diagram. */
  solid?: boolean
  rx?: number
}) {
  return (
    <g className={`sk-node${solid ? ' sk-node--solid' : ''}`}>
      <rect className="sk-box sk-draw" x={x} y={y} width={w} height={h} rx={rx} pathLength={1} />
      <CenteredText cx={x + w / 2} cy={y + h / 2} label={label} sub={sub} />
    </g>
  )
}

/* ---- Chip (GPU / compute) ---------------------------------------------- */

export function Chip({
  x,
  y,
  w,
  h,
  label,
  sub,
  solid,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string | string[]
  sub?: string
  solid?: boolean
}) {
  const pins = 4
  const step = w / (pins + 1)
  const ticks: React.ReactNode[] = []
  for (let i = 1; i <= pins; i++) {
    const px = x + step * i
    ticks.push(<line key={`t${i}`} className="sk-hair sk-draw" x1={px} y1={y - 6} x2={px} y2={y} pathLength={1} />)
    ticks.push(<line key={`b${i}`} className="sk-hair sk-draw" x1={px} y1={y + h} x2={px} y2={y + h + 6} pathLength={1} />)
  }
  return (
    <g className={`sk-node${solid ? ' sk-node--solid' : ''}`}>
      {ticks}
      <rect className="sk-box sk-draw" x={x} y={y} width={w} height={h} rx={5} pathLength={1} />
      <rect className="sk-box sk-draw sk-chip-core" x={x + 12} y={y + 12} width={w - 24} height={h - 24} rx={3} pathLength={1} />
      <CenteredText cx={x + w / 2} cy={y + h / 2} label={label} sub={sub} />
    </g>
  )
}

/* ---- Cylinder (database) ------------------------------------------------ */

export function Cylinder({
  x,
  y,
  w,
  h,
  label,
  sub,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string | string[]
  sub?: string
}) {
  const ry = Math.min(11, h * 0.16)
  const cx = x + w / 2
  const body = `M ${x} ${y + ry} L ${x} ${y + h - ry} A ${w / 2} ${ry} 0 0 0 ${x + w} ${y + h - ry} L ${x + w} ${y + ry}`
  return (
    <g className="sk-node">
      <path className="sk-box sk-draw" d={body} pathLength={1} fill="none" />
      <ellipse className="sk-box sk-draw" cx={cx} cy={y + ry} rx={w / 2} ry={ry} pathLength={1} />
      <CenteredText cx={cx} cy={y + ry + (h - ry) / 2 + 2} label={label} sub={sub} />
    </g>
  )
}

/* ---- Queue (message broker) -------------------------------------------- */

export function Queue({
  x,
  y,
  w,
  h,
  label,
  sub,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string | string[]
  sub?: string
}) {
  const divs = 3
  const step = w / (divs + 1)
  return (
    <g className="sk-node">
      <rect className="sk-box sk-draw" x={x} y={y} width={w} height={h} rx={5} pathLength={1} />
      {Array.from({ length: divs }, (_, i) => (
        <line
          key={i}
          className="sk-hair sk-draw sk-queue-div"
          x1={x + step * (i + 1)}
          y1={y + 8}
          x2={x + step * (i + 1)}
          y2={y + h - 8}
          pathLength={1}
        />
      ))}
      <CenteredText cx={x + w / 2} cy={y + h / 2} label={label} sub={sub} />
    </g>
  )
}

/* ---- Cloud -------------------------------------------------------------- */

const CLOUD_PATH =
  'M18 74 C6 74, 1 64, 3 54 C5 45, 14 40, 23 42 C25 26, 40 16, 56 19 C70 21, 80 32, 81 46 C93 45, 99 54, 99 63 C99 71, 92 74, 82 74 Z'

export function Cloud({
  x,
  y,
  w,
  h,
  label,
  sub,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string | string[]
  sub?: string
}) {
  return (
    <g className="sk-node">
      <g transform={`translate(${x}, ${y}) scale(${w / 100}, ${h / 90})`}>
        <path className="sk-box sk-draw" d={CLOUD_PATH} pathLength={1} vectorEffect="non-scaling-stroke" />
      </g>
      <CenteredText cx={x + w / 2} cy={y + h / 2 + 4} label={label} sub={sub} />
    </g>
  )
}

/* ---- Arrow -------------------------------------------------------------- */

export function Arrow({
  from,
  to,
  bend = 0,
  dashed,
  label,
  labelDy = -8,
}: {
  from: Pt
  to: Pt
  /** Perpendicular offset of the curve midpoint — gives an organic bow. */
  bend?: number
  dashed?: boolean
  label?: string
  labelDy?: number
}) {
  const { d, c2 } = sketchCurve(from, to, bend)
  const ang = Math.atan2(to.y - c2.y, to.x - c2.x)
  const ah = 12
  const spread = 0.42
  const b1 = { x: to.x - ah * Math.cos(ang - spread), y: to.y - ah * Math.sin(ang - spread) }
  const b2 = { x: to.x - ah * Math.cos(ang + spread), y: to.y - ah * Math.sin(ang + spread) }
  const lx = (from.x + to.x) / 2 + (-(to.y - from.y) / (Math.hypot(to.x - from.x, to.y - from.y) || 1)) * bend * 0.5
  const ly = (from.y + to.y) / 2 + ((to.x - from.x) / (Math.hypot(to.x - from.x, to.y - from.y) || 1)) * bend * 0.5
  return (
    <g className="sk-arrow">
      <path className={`sk-line sk-draw${dashed ? ' sk-line--dash' : ''}`} d={d} pathLength={1} fill="none" />
      <path className="sk-line sk-draw" d={`M ${b1.x} ${b1.y} L ${to.x} ${to.y} L ${b2.x} ${b2.y}`} pathLength={1} fill="none" />
      {label && (
        <text className="sk-edge-label sk-fade" x={lx} y={ly + labelDy} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  )
}

/** A hand-drawn line with no arrowhead — leader/annotation connectors. */
export function Connector({
  from,
  to,
  bend = 0,
  dashed,
}: {
  from: Pt
  to: Pt
  bend?: number
  dashed?: boolean
}) {
  const { d } = sketchCurve(from, to, bend)
  return <path className={`sk-line sk-draw${dashed ? ' sk-line--dash' : ''}`} d={d} pathLength={1} fill="none" />
}

/* ---- Group (dashed cluster boundary) ----------------------------------- */

export function Group({
  x,
  y,
  w,
  h,
  label,
}: {
  x: number
  y: number
  w: number
  h: number
  label?: string
}) {
  return (
    <g className="sk-group">
      <rect className="sk-group-box sk-draw" x={x} y={y} width={w} height={h} rx={16} pathLength={1} />
      {label && (
        <text className="sk-group-label sk-fade" x={x + 16} y={y - 7}>
          {label}
        </text>
      )}
    </g>
  )
}

/* ---- Badge (circled metric) -------------------------------------------- */

export function Badge({
  cx,
  cy,
  text,
  w = 78,
  h = 34,
}: {
  cx: number
  cy: number
  text: string
  w?: number
  h?: number
}) {
  return (
    <g className="sk-badge">
      <ellipse className="sk-badge-ring sk-draw" cx={cx} cy={cy} rx={w / 2} ry={h / 2} pathLength={1} />
      <text className="sk-badge-text sk-fade" x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
        {text}
      </text>
    </g>
  )
}

/* ---- Note (margin annotation) ------------------------------------------ */

export function Note({
  x,
  y,
  text,
  anchor = 'start',
}: {
  x: number
  y: number
  text: string | string[]
  anchor?: 'start' | 'middle' | 'end'
}) {
  const ls = lines(text)
  return (
    <text className="sk-note sk-fade" x={x} y={y} textAnchor={anchor}>
      {ls.map((ln, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 16}>
          {ln}
        </tspan>
      ))}
    </text>
  )
}

/* ---- Dot (small source / actor node) ----------------------------------- */

export function Dot({
  cx,
  cy,
  r = 6,
  label,
  labelDy = -12,
}: {
  cx: number
  cy: number
  r?: number
  label?: string
  labelDy?: number
}) {
  return (
    <g className="sk-node">
      <circle className="sk-box sk-draw sk-dot" cx={cx} cy={cy} r={r} pathLength={1} />
      {label && (
        <text className="sk-sub sk-fade" x={cx} y={cy + labelDy} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  )
}

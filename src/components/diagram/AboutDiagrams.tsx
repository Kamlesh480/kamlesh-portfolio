/**
 * Charcoal schematics for /about. Two different jobs:
 *  - `OwnershipDiagram` fills the hero's empty right column with the "what I am"
 *    claim made visual: a vertical slice of the stack with an extent marker
 *    spanning all of it.
 *  - `JourneyDiagram` replaces what used to be a portrait photo beside the
 *    "My path here" prose — a vertical path with the lesson from each step
 *    annotated on the transition into the next.
 *
 * Both are plain compositions of the primitives in Sketch.tsx. Vertical/
 * horizontal rules go through `Connector` (never a raw filtered <line>) — see
 * known_patterns.md Bug 7: #rough erases axis-aligned strokes.
 */
import { Diagram, Box, Arrow, Connector, Note } from './Sketch'

/* ---- Hero: the stack, and who owns it ---------------------------------- */
export function OwnershipDiagram() {
  const layers = [
    { label: 'Product UI', sub: 'Next.js · React · TypeScript' },
    { label: 'API & services', sub: 'Django · DRF · FastAPI' },
    { label: 'Data & AI infra', sub: 'Trino · ClickHouse · vLLM', solid: true },
    { label: 'Cloud & CI/CD', sub: 'GCP · AWS · Kubernetes · Docker' },
  ]
  // Geometry spans the full viewBox width on purpose: a narrow drawing inside a
  // wide viewBox renders left-shifted with dead space on the right, since the
  // <svg> itself fills its grid column. Keep content extent ≈ viewBox width.
  // Reading order is label → marker → stack, so the caption sits on the LEFT
  // and the extent ticks point right, into the layers they span.
  // ~16 units of padding on both sides: `.sketch-diagram-scroll` fades its
  // outer 14px to transparent (so a mid-scroll diagram doesn't hard-clip on
  // mobile), which silently eats anything drawn flush against the edge.
  const NOTE_X = 16
  const markX = 186
  const X = 208
  const W = 336
  const H = 60
  const STEP = 76
  const top = 18
  const bottom = top + (layers.length - 1) * STEP + H

  return (
    <Diagram
      viewBox="0 4 560 310"
      minWidth={380}
      title="A vertical slice of the product stack — product UI, API and services, data and AI infrastructure, cloud and CI/CD — with a marker spanning all four layers noting that one engineer owns the whole column, backend-first."
      caption="Fig. 1 — Backend-first, but the whole column ships."
    >
      {layers.map((l, i) => (
        <Box
          key={l.label}
          x={X}
          y={top + i * STEP}
          w={W}
          h={H}
          label={l.label}
          sub={l.sub}
          solid={l.solid}
        />
      ))}

      {/* extent marker spanning every layer — a plain rule with ticks turned
          toward the stack reads as "all of this" without needing a curly brace */}
      <Connector from={{ x: markX, y: top }} to={{ x: markX, y: bottom }} />
      <Connector from={{ x: markX, y: top }} to={{ x: markX + 12, y: top }} />
      <Connector from={{ x: markX, y: bottom }} to={{ x: markX + 12, y: bottom }} />
      <Note x={NOTE_X} y={(top + bottom) / 2 - 8} text={['I own the whole', 'column — end to end.']} />
    </Diagram>
  )
}

/* ---- Journey: the path, and what each step taught ---------------------- */
export function JourneyDiagram() {
  const stops = [
    { label: 'DUIT Technologies', sub: 'Python ETL · ML API evals' },
    { label: 'Hevo Data', sub: 'Full-stack · Django → Next.js' },
    { label: 'BrightEdge', sub: 'LLM infra · 5B tokens / mo' },
    { label: 'Personal project', sub: 'Founding engineer · 0 → 1', solid: true },
  ]
  // What each step taught, annotated on the transition out of it.
  const lessons = ['made messy data behave', 'shipped it, then measured it', 'cost became architecture']

  // viewBox width is matched to the ~0.8fr column this sits in, so the figure
  // renders near 1:1 — scaling a wide drawing down into a narrow column is what
  // makes diagram labels turn illegible.
  // 16 units of side padding — clear of the scroll container's edge-fade mask.
  const X = 16
  const W = 458
  const H = 66
  const STEP = 116
  const top = 12
  const midX = X + W / 2

  return (
    <Diagram
      viewBox="0 4 490 428"
      minWidth={340}
      title="A career path in four steps: DUIT Technologies writing Python ETL and evaluating ML APIs, then Hevo Data as a full-stack engineer migrating Django to Next.js, then BrightEdge architecting LLM infrastructure at five billion tokens a month, then founding engineer on a personal project taken from zero to one."
      caption="Fig. 1 — Four steps, one thread: make it work, then make it provable."
    >
      {stops.map((s, i) => {
        const y = top + i * STEP
        const endY = y + H
        const nextY = top + (i + 1) * STEP
        return (
          <g key={s.label}>
            <Box x={X} y={y} w={W} h={H} label={s.label} sub={s.sub} solid={s.solid} />
            {i < stops.length - 1 && (
              <>
                <Arrow from={{ x: midX, y: endY }} to={{ x: midX, y: nextY }} />
                <Note x={midX + 22} y={(endY + nextY) / 2 + 4} text={`→ ${lessons[i]}`} />
              </>
            )}
          </g>
        )
      })}
    </Diagram>
  )
}

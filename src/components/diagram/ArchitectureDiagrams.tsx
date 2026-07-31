/**
 * Charcoal schematics for /architecture.
 *
 * `DecisionLoopDiagram` is the page's hero figure (how a decision gets made);
 * `decisionDiagram(slug)` returns the figure for a given record in
 * `src/content/decisions.ts`, or null if that record has none — so adding a
 * decision never breaks the page.
 *
 * Conventions carried from Sketch.tsx: ~16 units of side padding (the scroll
 * container fades its outer 14px), and straight rules always go through
 * `Connector`/`Arrow`, never a raw filtered <line> — see known_patterns.md Bug 7.
 */
import { Diagram, Box, Chip, Cylinder, Arrow, Connector, Badge, Note } from './Sketch'

/* ---- Hero: how a decision actually gets made ---------------------------- */
export function DecisionLoopDiagram() {
  const steps = [
    { label: 'Constraint', sub: 'cost · scale · latency' },
    { label: 'Options', sub: 'name the trade' },
    { label: 'Decide', sub: 'write down the cost', solid: true },
    { label: 'Verify', sub: 'in production' },
  ]
  const X = 16
  const W = 124
  const GAP = 24
  const H = 72
  const Y = 26

  return (
    <Diagram
      viewBox="0 4 616 236"
      minWidth={420}
      title="A loop: a constraint such as cost, scale or latency leads to naming the options and their trade-offs, then to a decision with its cost written down, then to verification in production — whose measured result feeds back into the next constraint."
      caption="Fig. 1 — The loop. A decision without a measured result is just an opinion."
    >
      {steps.map((s, i) => {
        const x = X + i * (W + GAP)
        return (
          <g key={s.label}>
            <Box x={x} y={Y} w={W} h={H} label={s.label} sub={s.sub} solid={s.solid} />
            {i < steps.length - 1 && (
              <Arrow from={{ x: x + W, y: Y + H / 2 }} to={{ x: x + W + GAP, y: Y + H / 2 }} />
            )}
          </g>
        )
      })}

      {/* feedback path: what production actually measured re-enters as the
          next constraint — the reason this is a loop and not a checklist */}
      <Arrow
        from={{ x: X + 3 * (W + GAP) + W / 2, y: Y + H + 6 }}
        to={{ x: X + W / 2, y: Y + H + 6 }}
        bend={-58}
        dashed
      />
      <Note x={X + 2 * (W + GAP)} y={Y + H + 56} text="what the number actually said" anchor="middle" />
    </Diagram>
  )
}

/* ---- inference-in-house: two cost curves -------------------------------- */
function InferencePaths() {
  return (
    <Diagram
      viewBox="0 4 616 268"
      minWidth={420}
      title="The same five-billion-token monthly workload sent down two paths: hosted per-token APIs at forty thousand dollars a month, versus a self-hosted vLLM GPU platform at fifteen thousand — a 62 percent reduction."
      caption="Fig. 2 — Same workload, two cost curves. Only one of them stops growing per token."
    >
      <Box x={16} y={92} w={132} h={72} label="5B tokens" sub="every month" />

      {/* legacy path */}
      <g className="sk-node--legacy">
        <Box x={252} y={22} w={182} h={62} label="Hosted per-token API" />
      </g>
      <Arrow from={{ x: 148, y: 116 }} to={{ x: 252, y: 56 }} bend={14} />
      <Badge cx={534} cy={53} text="$40K / mo" w={140} h={40} />
      <Connector from={{ x: 434, y: 53 }} to={{ x: 464, y: 53 }} dashed />

      {/* chosen path */}
      <Chip x={252} y={172} w={182} h={64} solid label="Self-hosted vLLM" sub="open-source · GPU" />
      <Arrow from={{ x: 148, y: 140 }} to={{ x: 252, y: 202 }} bend={-14} />
      <Badge cx={534} cy={204} text="$15K / mo" w={140} h={40} />
      <Connector from={{ x: 434, y: 204 }} to={{ x: 464, y: 204 }} dashed />

      <Note x={316} y={130} text="62% ↓ — cost stops scaling per token" />
    </Diagram>
  )
}

/* ---- tenancy-as-invariant: every path scoped ---------------------------- */
function TenancyScope() {
  const paths = [
    'List queries',
    'Detail lookups',
    'ORM subqueries',
    'Raw SQL joins',
  ]
  const X = 16
  const W = 150
  const H = 44
  const STEP = 56
  const top = 40
  const gateX = 244
  const gateY = 78
  const gateH = 116

  return (
    <Diagram
      viewBox="0 4 616 296"
      minWidth={420}
      title="Four query paths — list queries, detail lookups, ORM subqueries and raw SQL joins — all pass through a single account-scope predicate before reaching the scraped claims database, because a booking identifier repeats across accounts."
      caption="Fig. 2 — The identifier repeats across accounts, so every path is scoped. No exceptions, including raw SQL."
    >
      {paths.map((p, i) => {
        const y = top + i * STEP
        return (
          <g key={p}>
            <Box x={X} y={y} w={W} h={H} label={p} />
            <Arrow from={{ x: X + W, y: y + H / 2 }} to={{ x: gateX, y: gateY + gateH / 2 }} bend={i < 2 ? 8 : -8} />
          </g>
        )
      })}

      <Box x={gateX} y={gateY} w={168} h={gateH} solid label={['Account', 'scope']} sub="every path, always" />
      <Arrow from={{ x: gateX + 168, y: gateY + gateH / 2 }} to={{ x: 470, y: gateY + gateH / 2 }} />
      <Cylinder x={470} y={92} w={130} h={92} label="Scraped claims" sub="multi-tenant" />

      <Note x={16} y={276} text="booking ID repeats across accounts — scope it, or leak it" />
    </Diagram>
  )
}

/* ---- idempotent-webhooks: redelivery is a no-op ------------------------- */
function IdempotentWebhook() {
  return (
    <Diagram
      viewBox="0 4 616 274"
      minWidth={420}
      title="A Stripe webhook is checked against the event IDs already seen: a repeat delivery is acknowledged and skipped, while a new event is applied and its ID recorded. Handler errors are caught and logged rather than re-thrown, so the provider never retries work that already succeeded."
      caption="Fig. 2 — Redelivery is a no-op, and a handler error never asks Stripe to try again."
    >
      <Box x={16} y={94} w={126} h={66} label="Stripe" sub="billing event" />
      <Arrow from={{ x: 142, y: 127 }} to={{ x: 190, y: 127 }} />
      <Box x={190} y={90} w={158} h={74} solid label={['Seen this', 'event ID?']} />

      {/* already applied */}
      <Arrow from={{ x: 348, y: 108 }} to={{ x: 424, y: 52 }} bend={10} label="yes" labelDy={-10} />
      <Box x={424} y={22} w={176} h={58} label="Skip" sub="already applied" />

      {/* first delivery */}
      <Arrow from={{ x: 348, y: 146 }} to={{ x: 424, y: 196 }} bend={-10} label="no" labelDy={16} />
      <Box x={424} y={168} w={176} h={62} label="Apply + record ID" sub="plan / state change" />

      <Note x={16} y={200} text={['Handler errors are caught', 'and logged — never re-thrown,', 'so Stripe never retries a', 'webhook that already worked.']} />
    </Diagram>
  )
}

const MAP: Record<string, () => React.ReactElement> = {
  'inference-in-house': InferencePaths,
  'tenancy-as-invariant': TenancyScope,
  'idempotent-webhooks': IdempotentWebhook,
}

export function decisionDiagram(slug: string): React.ReactElement | null {
  const D = MAP[slug]
  return D ? <D /> : null
}

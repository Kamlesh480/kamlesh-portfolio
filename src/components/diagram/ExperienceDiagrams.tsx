/**
 * One charcoal schematic per experience entry, keyed by slug. Deliberately a
 * *different* visual genre from the /projects flow diagrams so the two pages
 * don't feel repetitive: an impact scoreboard, a before/after performance
 * view, an ETL flow, and a 0→1 founding journey. `experienceDiagram()`
 * returns null for any slug without one.
 */
import { Diagram, Box, Chip, Cylinder, Arrow, Connector, Badge, Note } from './Sketch'

/* ---- BrightEdge — impact scoreboard across the three systems ------------ */
function BrightEdge() {
  const lanes = [
    { y: 58, name: ['AI Hyper', 'Cube'], a: '5B tokens / mo', b: '62% ↓ cost', focal: true },
    { y: 140, name: ['Trino', 'pipeline'], a: '1B+ events / mo', b: '5-figure ↓ / mo', focal: false },
    { y: 222, name: ['Keyword', 'collection'], a: '100M+ kw / mo', b: '4× faster', focal: false },
  ]
  return (
    <Diagram
      viewBox="0 0 920 290"
      minWidth={620}
      title="Impact scoreboard for three systems built at BrightEdge: AI Hyper Cube at five billion tokens a month and 62% lower cost, a Trino pipeline over a billion events a month at a five-figure monthly saving, and a rebuilt keyword collection pipeline at a hundred million keywords a month, four times faster."
      caption="Fig. 1. Three systems, one mandate: make expensive things at scale cheap and fast."
    >
      {lanes.map((l) => (
        <g key={l.name.join()}>
          <Box x={20} y={l.y - 28} w={168} h={56} label={l.name} />
          <Arrow from={{ x: 188, y: l.y }} to={{ x: 344, y: l.y }} />
          <Badge cx={430} cy={l.y} text={l.a} w={168} h={40} />
          <Arrow from={{ x: 516, y: l.y }} to={{ x: 566, y: l.y }} />
          <Badge cx={676} cy={l.y} text={l.b} w={190} h={44} />
        </g>
      ))}
    </Diagram>
  )
}

/* ---- Hevo Data — before/after performance ------------------------------- */
function Bar({ x, y, w, label, value }: { x: number; y: number; w: number; label: string; value: string }) {
  const h = 18
  return (
    <g>
      <rect className="sk-bar-track sk-draw" x={x} y={y} width={260} height={h} rx={4} pathLength={1} />
      <g className="sk-fade">
        <rect className="sk-bar-fill" x={x} y={y} width={w} height={h} rx={4} />
        <text className="sk-sub" x={x} y={y - 8}>{label}</text>
        <text className="sk-label" x={x + 270} y={y + h / 2} dominantBaseline="middle" style={{ fontSize: 15 }}>
          {value}
        </text>
      </g>
    </g>
  )
}
function HevoData() {
  return (
    <Diagram
      viewBox="0 0 920 340"
      minWidth={560}
      title="Before-and-after performance work at Hevo Data: the signup API dropped from nine seconds to two-and-a-half, and good-LCP URLs rose from 55.73% to 83.85% via Varnish caching and a CloudFront CDN."
      caption="Fig. 1. Owning it end-to-end: API latency and Core Web Vitals, before and after."
    >
      <Note x={40} y={40} text="Signup API: response time" />
      <Bar x={40} y={70} w={248} label="before" value="9 s" />
      <Bar x={40} y={118} w={69} label="after" value="2–2.5 s" />
      <Badge cx={470} cy={104} text="~75% ↓ · +4–5% signups" w={230} h={40} />

      <Note x={40} y={196} text="Good-LCP URLs: Core Web Vitals" />
      <Bar x={40} y={226} w={145} label="before" value="55.73%" />
      <Bar x={40} y={274} w={218} label="after" value="83.85%" />

      <Chip x={640} y={186} w={150} h={52} label="Varnish" sub="in-memory cache" />
      <Cylinder x={640} y={270} w={150} h={44} label="CloudFront CDN" />
      <Arrow from={{ x: 330, y: 250 }} to={{ x: 640, y: 214 }} bend={-20} label="what moved it" labelDy={-10} />
      <Arrow from={{ x: 715, y: 238 }} to={{ x: 715, y: 270 }} />
    </Diagram>
  )
}

/* ---- DUIT Technologies — ETL flow --------------------------------------- */
function DuitTechnologies() {
  const midY = 118
  return (
    <Diagram
      viewBox="0 0 900 250"
      minWidth={560}
      title="An ETL flow built at DUIT Technologies: a stock API feeds a Google Apps Script ETL job that loads Firebase and BigQuery, alongside evaluating machine-learning APIs to about ninety percent accuracy."
      caption="Fig. 1. Early-career ETL: real-time market data into Firebase and BigQuery."
    >
      <Box x={24} y={84} w={132} h={68} label="Stock API" sub="real-time" />
      <Box x={220} y={84} w={150} h={68} solid label="Apps Script" sub="ETL job" />
      <Cylinder x={470} y={42} w={150} h={72} label="Firebase" />
      <Cylinder x={470} y={150} w={150} h={72} label="BigQuery" />

      <Arrow from={{ x: 156, y: midY }} to={{ x: 220, y: midY }} label="extract" />
      <Arrow from={{ x: 370, y: midY }} to={{ x: 470, y: 78 }} bend={-8} label="load" />
      <Arrow from={{ x: 370, y: midY }} to={{ x: 470, y: 186 }} bend={8} />

      <Connector from={{ x: 620, y: 118 }} to={{ x: 648, y: 118 }} dashed />
      <Badge cx={760} cy={118} text="~90% ML-eval accuracy" w={220} h={42} />
    </Diagram>
  )
}

/* ---- Personal project — the 0→1 founding journey ------------------------ */
function PersonalProject() {
  const midY = 96
  const stops = [
    { x: 24, w: 150, label: 'Empty repo', sub: 'employee #1' },
    { x: 232, w: 168, label: 'Architecture', sub: 'stack · conventions' },
    { x: 458, w: 168, label: 'Live SaaS', sub: 'paying orgs, daily', solid: true },
    { x: 684, w: 176, label: 'Hired the team', sub: 'FE · QA · DevOps · BE' },
  ]
  return (
    <Diagram
      viewBox="0 0 900 220"
      minWidth={620}
      title="A zero-to-one founding journey: from an empty repository as employee number one, to defining the architecture and conventions, to a live SaaS used daily by paying healthcare organizations, to hiring and mentoring the engineering team that maintains it."
      caption="Fig. 1. Zero to one: empty repository to a live product and the team that now runs it."
    >
      {stops.map((s, i) => (
        <g key={s.label}>
          <Box x={s.x} y={midY - 34} w={s.w} h={68} solid={s.solid} label={s.label} sub={s.sub} />
          {i < stops.length - 1 && (
            <Arrow from={{ x: s.x + s.w, y: midY }} to={{ x: stops[i + 1].x, y: midY }} />
          )}
        </g>
      ))}
      <Note
        x={450}
        y={188}
        text="dual-DB router · Stripe lifecycle · RBAC · QA-gated pipeline: all built solo, first"
        anchor="middle"
      />
    </Diagram>
  )
}

const MAP: Record<string, () => React.ReactElement> = {
  brightedge: BrightEdge,
  'hevo-data': HevoData,
  'duit-technologies': DuitTechnologies,
  'personal-project': PersonalProject,
}

export function experienceDiagram(slug: string): React.ReactElement | null {
  const D = MAP[slug]
  return D ? <D /> : null
}

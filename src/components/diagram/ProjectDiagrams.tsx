/**
 * One bespoke charcoal schematic per project, keyed by slug. Each is a plain
 * composition of the primitives in Sketch.tsx — hand-placed in an ~960-wide
 * user space so the engineering *thinking* reads at a glance, not the exact
 * production topology. Rendered on /projects (and reused wherever a project
 * needs a visual). If a slug has no diagram, `projectDiagram()` returns null
 * and the page simply renders text, as before.
 */
import { Diagram, Box, Chip, Cylinder, Queue, Arrow, Connector, Group, Badge, Note, Dot } from './Sketch'

/* ---- AI Hyper Cube — LLM processing pipeline ---------------------------- */
function AiHyperCube() {
  const midY = 150
  return (
    <Diagram
      viewBox="0 0 960 320"
      minWidth={640}
      title="Pipeline: AI search results are prompt-scoped, run through self-hosted vLLM inference on GPUs, entity-extracted, then Spark post-processed with MD5 hash partitioning into ClickHouse — about five billion tokens a month."
      caption="Fig. 1 — AI search results become brand analytics: inference moved off pay-per-token APIs onto self-hosted GPUs."
    >
      <Note x={480} y={30} text="≈ 5B tokens processed / month" anchor="middle" />

      <Box x={24} y={115} w={118} h={70} label="AI SERPs" sub="100M+ / month" />
      <Box x={186} y={115} w={128} h={70} label={['Prompt', 'scoping']} />
      <Chip x={356} y={115} w={176} h={70} solid label="Self-hosted vLLM" sub="open-source · GPU" />
      <Box x={576} y={115} w={150} h={70} label="Extraction" sub="intent · sentiment · cites" />
      <Cylinder x={780} y={112} w={128} h={78} label="ClickHouse" />

      <Arrow from={{ x: 142, y: midY }} to={{ x: 186, y: midY }} />
      <Arrow from={{ x: 314, y: midY }} to={{ x: 356, y: midY }} />
      <Arrow from={{ x: 532, y: midY }} to={{ x: 576, y: midY }} />
      <Arrow from={{ x: 726, y: midY }} to={{ x: 780, y: midY }} label="Spark · hash-part." labelDy={-12} />

      {/* cost callout hanging off the focal inference node */}
      <Connector from={{ x: 444, y: 187 }} to={{ x: 444, y: 226 }} dashed />
      <Badge cx={444} cy={250} text="62% ↓ cost" w={116} h={38} />
      <Note x={444} y={286} text="$40K → $15K — inference in-house" anchor="middle" />
    </Diagram>
  )
}

/* ---- Trino–Iceberg–ClickHouse data pipeline ----------------------------- */
function TrinoPipeline() {
  const midY = 150
  return (
    <Diagram
      viewBox="0 0 960 340"
      minWidth={640}
      title="A self-managed Trino, Iceberg and ClickHouse pipeline on Kubernetes with a custom memory-aware scheduler, processing over a billion events a month and replacing a legacy BigQuery-UDF workflow for eighteen to twenty thousand dollars a month in savings."
      caption="Fig. 1 — Retiring the BigQuery-UDF workflow with a self-managed engine and a memory-aware scheduler."
    >
      <Box x={24} y={115} w={120} h={70} label="Events" sub="1B+ / month" />
      <Cylinder x={182} y={110} w={130} h={80} label="GCS" sub="raw + Hive meta" />

      <Group x={344} y={92} w={216} h={116} label="Kubernetes" />
      <Box x={362} y={114} w={180} h={72} solid label="Trino" sub="memory-aware sched." />

      <Box x={600} y={115} w={122} h={70} label="Iceberg" sub="table format" />
      <Cylinder x={772} y={110} w={130} h={80} label="ClickHouse" />

      <Arrow from={{ x: 144, y: midY }} to={{ x: 182, y: midY }} />
      <Arrow from={{ x: 312, y: midY }} to={{ x: 362, y: midY }} />
      <Arrow from={{ x: 542, y: midY }} to={{ x: 600, y: midY }} />
      <Arrow from={{ x: 722, y: midY }} to={{ x: 772, y: midY }} />

      {/* legacy path being replaced */}
      <g className="sk-node--legacy">
        <Box x={362} y={250} w={180} h={56} label="Legacy: BigQuery UDF" />
        <Connector from={{ x: 372, y: 278 }} to={{ x: 532, y: 278 }} />
      </g>
      <Connector from={{ x: 452, y: 250 }} to={{ x: 452, y: 208 }} dashed />
      <Note x={556} y={252} text="replaced end-to-end" />
      <Badge cx={760} cy={276} text="$18–20K ↓ / mo" w={150} h={38} />
    </Diagram>
  )
}

/* ---- DCX Collector V2 — event-driven collection ------------------------- */
function DcxCollector() {
  const midY = 150
  return (
    <Diagram
      viewBox="0 0 960 340"
      minWidth={680}
      title="An event-driven keyword collector: multiple vendor SERP sources fan into a FastAPI service, through a RabbitMQ queue to a Redis-backed worker pool orchestrated by Argo Workflows, landing in BigQuery, with an AI-Overview stitching branch that mitigates Google's num=100 deprecation."
      caption="Fig. 1 — Event-driven collection at 100M+ keywords/month; an AI-Overview stitching branch absorbs the num=100 change."
    >
      {/* fan-in sources */}
      <Box x={20} y={62} w={120} h={44} label="Vendor SERP A" />
      <Box x={20} y={128} w={120} h={44} label="Vendor SERP B" />
      <Box x={20} y={194} w={120} h={44} label="Vendor SERP C" />
      <Arrow from={{ x: 140, y: 84 }} to={{ x: 210, y: 138 }} bend={-6} />
      <Arrow from={{ x: 140, y: 150 }} to={{ x: 210, y: 150 }} />
      <Arrow from={{ x: 140, y: 216 }} to={{ x: 210, y: 162 }} bend={6} />

      <Box x={210} y={116} w={132} h={70} label="FastAPI" sub="collector" />
      <Group x={372} y={96} w={330} h={110} label="Argo Workflows · orchestration" />
      <Queue x={388} y={120} w={120} h={62} label="RabbitMQ" />
      <Box x={548} y={118} w={138} h={66} solid label="Worker pool" sub="Redis-backed" />
      <Cylinder x={792} y={112} w={128} h={78} label="BigQuery" />

      <Arrow from={{ x: 342, y: midY }} to={{ x: 388, y: midY }} />
      <Arrow from={{ x: 508, y: midY }} to={{ x: 548, y: midY }} />
      <Arrow from={{ x: 686, y: midY }} to={{ x: 792, y: midY }} />

      <Badge cx={508} cy={252} text="4× faster" w={104} h={38} />

      {/* stitching branch */}
      <Box x={560} y={248} w={200} h={58} label="AI Overview stitching" sub="mitigates num=100" />
      <Connector from={{ x: 760, y: 268 }} to={{ x: 856, y: 190 }} bend={26} dashed />
      <Note x={694} y={330} text="~60% ↓ collection cost · 25+ locales" anchor="middle" />
    </Diagram>
  )
}

/* ---- Healthcare claims platform — product architecture ------------------ */
function HealthcarePlatform() {
  const topY = 70
  return (
    <Diagram
      viewBox="0 0 980 440"
      minWidth={720}
      title="Product architecture: a browser client hits a Next.js dashboard through a proxy that fixes a trailing-slash double round-trip, into a Django DRF API enforcing role-based access; a custom database router splits application data from scraped claims data across separate databases; a collection pipeline gates on QA before writing claims; Stripe drives billing through idempotent webhooks."
      caption="Fig. 1 — One product, built from an empty repo: request path, dual-database router, QA-gated collection, and idempotent billing."
    >
      {/* request path (top row) */}
      <Dot cx={48} cy={topY} r={7} label="Users" labelDy={-16} />
      <Box x={84} y={topY - 32} w={150} h={64} label="Next.js dashboard" sub="real-time analytics" />
      <Box x={262} y={topY - 28} w={104} h={56} label="Proxy" sub="1 slash, not 2" />
      <Box x={398} y={topY - 36} w={180} h={72} solid label="Django · DRF API" sub="role-scoped (RBAC)" />
      <Box x={650} y={topY - 28} w={118} h={56} label="DB router" sub="custom" />

      <Arrow from={{ x: 55, y: topY }} to={{ x: 84, y: topY }} />
      <Arrow from={{ x: 234, y: topY }} to={{ x: 262, y: topY }} />
      <Arrow from={{ x: 366, y: topY }} to={{ x: 398, y: topY }} />
      <Arrow from={{ x: 578, y: topY }} to={{ x: 650, y: topY }} />

      {/* dual databases (right column) */}
      <Cylinder x={812} y={32} w={140} h={72} label="App DB" sub="application data" />
      <Cylinder x={812} y={150} w={140} h={88} label="Scraped claims" sub="2 DBs · 13 tables" />
      <Arrow from={{ x: 768, y: 64 }} to={{ x: 812, y: 64 }} label="app" labelDy={-10} />
      <Arrow from={{ x: 726, y: 98 }} to={{ x: 826, y: 158 }} bend={10} label="claims" labelDy={-6} />
      <Badge cx={882} cy={296} text="0 cross-tenant leaks" w={186} h={36} />

      {/* billing feeds the API */}
      <Box x={398} y={166} w={180} h={58} label="Stripe" sub="idempotent webhooks" />
      <Arrow from={{ x: 488, y: 166 }} to={{ x: 488, y: 106 }} />
      <Note x={500} y={140} text="billing events →" />

      {/* collection pipeline → QA gate → claims DB (bottom band) */}
      <Box x={84} y={300} w={158} h={64} label="Collection pipeline" sub="Cloud Tasks / Scheduler" />
      <Box x={286} y={300} w={140} h={64} label="QA gate" sub="row / null / dupe" />
      <Arrow from={{ x: 242, y: 332 }} to={{ x: 286, y: 332 }} />
      <Arrow from={{ x: 426, y: 332 }} to={{ x: 812, y: 214 }} bend={-26} label="on pass" labelDy={-10} />
      <Note x={286} y={392} text="fail → Slack alert, nothing reaches prod" />
    </Diagram>
  )
}

const MAP: Record<string, () => React.ReactElement> = {
  'ai-hyper-cube': AiHyperCube,
  'trino-iceberg-clickhouse-pipeline': TrinoPipeline,
  'dcx-collector-v2': DcxCollector,
  'healthcare-platform': HealthcarePlatform,
}

export function projectDiagram(slug: string): React.ReactElement | null {
  const D = MAP[slug]
  return D ? <D /> : null
}

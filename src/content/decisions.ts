import type { DecisionRecord } from './types'

/**
 * Architecture decision records for /architecture.
 *
 * CONTENT ACCURACY: every problem, decision, and number here restates a
 * decision already evidenced in `experience.ts` / `projects.ts` (and therefore
 * in the source resume/brief documents) — this file adds *reasoning about* that
 * work, never new facts. Do not introduce a metric, employer, or technology
 * that isn't already present in those files. The personal project's real name
 * is never used (see known_patterns.md).
 */
export const decisions: DecisionRecord[] = [
  {
    slug: 'inference-in-house',
    title: 'Move LLM inference off per-token APIs',
    context: 'AI Hyper Cube · LLM infrastructure',
    problem:
      'AI Hyper Cube runs scoped prompts over AI-generated search content at 5B+ tokens a month, across 100M+ keyword SERPs. At that volume the dominant cost driver was not compute or storage — it was per-token API pricing, and it grew linearly with every unit of product growth.',
    options: [
      {
        label: 'Stay on hosted per-token APIs',
        note: 'No serving infrastructure to own — but the cost curve is set by someone else and scales with every token.',
      },
      {
        label: 'Self-host open-source models on GPUs',
        note: 'Capacity-based cost and direct control of batching and throughput, at the price of owning model serving.',
        chosen: true,
      },
    ],
    decision:
      'Engineered a GPU-based inference platform on vLLM and rented GPU capacity running open-source models for large-scale entity extraction, moving the extraction workload off hosted APIs entirely.',
    tradeoff:
      'Traded a zero-operations dependency for infrastructure I own: GPU capacity planning, model serving, and throughput tuning became my problem — in exchange for a bill that no longer scales with every additional token.',
    outcomes: [
      'Monthly AI processing cost cut 62%.',
      'Throughput and extraction accuracy held at 5B+ tokens per month.',
    ],
  },
  {
    slug: 'self-managed-query-engine',
    title: 'Retire BigQuery UDFs for a self-managed engine',
    context: 'Data platform · 1B+ events / month',
    problem:
      'The legacy BigQuery UDF workflow processed more than a billion events a month. It was expensive at that scale and hard to reason about operationally — and both problems compounded as volume grew.',
    options: [
      {
        label: 'Keep tuning the BigQuery UDF workflow',
        note: 'No migration risk, but cost and operational behaviour stay inside someone else’s engine.',
      },
      {
        label: 'Self-manage Trino, Iceberg and ClickHouse',
        note: 'Direct control of memory, scheduling, and storage layout — at the cost of running the cluster.',
        chosen: true,
      },
    ],
    decision:
      'Built a Trino–Iceberg–ClickHouse pipeline on Python, GCS, Hive metadata, JavaScript UDFs and Kubernetes, with a custom memory-aware job scheduler to run distributed jobs safely at that volume.',
    tradeoff:
      'Took on cluster operations and a scheduler I had to write myself, to get predictable memory behaviour and a cost curve I actually control.',
    outcomes: [
      'A five-figure monthly saving versus the legacy process.',
      '1B+ events processed per month on the new pipeline.',
    ],
  },
  {
    slug: 'dual-database-router',
    title: 'Separate scraped data from application data',
    context: 'Personal project · healthcare claims platform',
    problem:
      'Scraped claims data and application data have different shapes, different lifecycles, and different failure modes. Putting both in one database would have coupled the scrape layer to the product permanently — every pipeline change becoming a product migration.',
    options: [
      {
        label: 'One database, one schema',
        note: 'Simple joins and migrations; the data layer and the application can never evolve independently.',
      },
      {
        label: 'Separate databases behind an explicit router',
        note: 'Independent lifecycles — but no cross-database joins, and every query’s destination must be deliberate.',
        chosen: true,
      },
    ],
    decision:
      'A dual-database architecture with a custom Django database router: application data and scraped claims data live in separate, independently managed databases.',
    tradeoff:
      'Gave up cross-database joins and added a routing layer every query passes through, in exchange for a data layer fully decoupled from the application layer.',
    outcomes: [
      '13 scraped data tables across 2 databases behind one custom router.',
      'The collection pipeline can change without forcing a product migration.',
    ],
  },
  {
    slug: 'tenancy-as-invariant',
    title: 'Treat a non-unique ID as a fact, not a bug',
    context: 'Personal project · multi-tenancy',
    problem:
      'A key booking identifier repeats across different accounts in the scraped source data. That is not a defect waiting to be fixed upstream — it is a property of the data. Any query written assuming global uniqueness would silently return another account’s records, and would look correct in every test written by the person who made the assumption.',
    options: [
      {
        label: 'Assume the identifier is unique',
        note: 'Reads naturally and stays wrong exactly where it matters most.',
      },
      {
        label: 'Scope every query path by account, explicitly',
        note: 'More verbose at every call site — and the invariant cannot be quietly forgotten.',
        chosen: true,
      },
    ],
    decision:
      'Designed and documented explicit account-scoping rules for every query path: list queries, detail lookups, ORM subqueries, and raw SQL joins.',
    tradeoff:
      'Every read carries an extra predicate and a rule someone has to know — the price of an invariant that still holds when a new engineer writes the next query.',
    outcomes: [
      'No account can retrieve another account’s records.',
      'The scoping model is written down and reviewable, not folklore.',
    ],
  },
  {
    slug: 'idempotent-webhooks',
    title: 'Assume every webhook arrives twice',
    context: 'Personal project · billing',
    problem:
      'Stripe can and does redeliver the same billing event. A handler that is not idempotent double-applies a plan change; a handler that throws makes Stripe retry work that already succeeded. Both failure modes corrupt billing state, which is the least forgiving state in the product.',
    options: [
      {
        label: 'Handle each delivery as it arrives',
        note: 'Correct only while the network is — and billing is the wrong place to find out it isn’t.',
      },
      {
        label: 'Key idempotency on the provider’s event ID',
        note: 'Redelivery becomes a no-op; failures must surface through monitoring instead of retries.',
        chosen: true,
      },
    ],
    decision:
      'An idempotency model keyed on the Stripe event ID, with handler errors caught and logged rather than re-thrown.',
    tradeoff:
      'Failures surface through logs and alerts instead of provider retries — which means the monitoring has to be real, not aspirational.',
    outcomes: [
      'The full billing lifecycle — trial, paid, upgrade, downgrade, cancellation, reactivation — runs on idempotent handlers.',
      'A logic bug never causes Stripe to retry an event that already succeeded.',
    ],
  },
]

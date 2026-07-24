import type { ProjectEntry } from './types'

export const projects: ProjectEntry[] = [
  {
    slug: 'ai-hyper-cube',
    title: 'AI Hyper Cube — LLM Processing Infrastructure',
    role: 'Architect & Lead Engineer',
    period: 'BrightEdge · Jun 2025 – Present',
    summary:
      'The core LLM infrastructure that scopes and runs prompts over AI-generated search content at massive scale — extracting intent, brand entities, sentiment, and citations for enterprise SEO analytics.',
    problem:
      'AI Overviews and AI-generated search results needed to be parsed for brand mentions, sentiment, and citations across 100M+ keyword SERPs a month — at a token volume and cost that made naive LLM API calls economically unworkable.',
    solution:
      'Architected a Python/ClickHouse/MySQL pipeline processing 5B+ tokens per month, then engineered a GPU-based inference platform on vLLM and Vast.ai using open-source models for large-scale entity extraction — moving the workload off pay-per-token hosted APIs entirely.',
    stack: ['Python', 'ClickHouse', 'MySQL', 'vLLM', 'Vast.ai', 'BigQuery', 'Apache Spark'],
    outcomes: [
      '5B+ tokens processed per month in production.',
      'Monthly AI processing cost cut 62% — from $40K to $15K — by moving inference to a self-hosted GPU platform.',
      '100M+ keyword SERPs processed monthly for prompt generation and post-processing, with brand-level hash partitioning (MD5 modulo) for reliable analytics.',
    ],
    challenges: [
      {
        title: 'Cost at token scale',
        description:
          'At 5B+ tokens/month, hosted LLM API pricing was the dominant cost driver. Solved by building a GPU-based inference platform on vLLM with open-source models, cutting cost 62% while keeping accuracy and throughput.',
      },
      {
        title: 'Reliable partitioning at brand scale',
        description:
          'Post-processing needed to stay analytics-ready across many brands without hot partitions. Solved with brand-level hash partitioning (MD5 modulo) in the Spark post-processing stage.',
      },
    ],
  },
  {
    slug: 'trino-iceberg-clickhouse-pipeline',
    title: 'Trino–Iceberg–ClickHouse Data Pipeline',
    role: 'Lead Engineer',
    period: 'BrightEdge · 2025',
    summary:
      'Replaced a legacy BigQuery UDF workflow with a self-managed Trino–Iceberg–ClickHouse pipeline, cutting monthly cost by $18K–$20K while scaling to over a billion events per month.',
    problem:
      'The existing BigQuery UDF-based processing workflow was expensive at scale and difficult to reason about operationally as event volume grew past 1B+ per month.',
    solution:
      'Built a pipeline on Python, GCS, Hive metadata, JavaScript UDFs, and Kubernetes, with a custom memory-aware job scheduler to safely run distributed jobs at that volume — replacing the BigQuery-UDF approach end-to-end.',
    stack: ['Trino', 'Iceberg', 'ClickHouse', 'Python', 'GCS', 'Hive metadata', 'Kubernetes', 'JavaScript'],
    outcomes: [
      '$18K–$20K in monthly cost savings versus the legacy BigQuery UDF process.',
      '1B+ events processed per month on the new pipeline.',
      'A custom memory-aware job scheduler purpose-built for this workload.',
    ],
  },
  {
    slug: 'dcx-collector-v2',
    title: 'DCX Collector V2',
    role: 'Lead Engineer',
    period: 'BrightEdge · 2025',
    summary:
      'A rebuilt keyword-collection system spanning multiple vendor integrations, achieving 4x faster processing at 100M+ keywords per month.',
    problem:
      "The prior collector couldn't keep pace with keyword volume across multiple vendor SERP sources, and Google's num=100 deprecation threatened to further degrade collection efficiency.",
    solution:
      'Led development on Python, FastAPI, RabbitMQ, Redis, Docker, Argo Workflows, and BigQuery for the core collector, then layered on an automated AI Overview stitching system (Python, JavaScript, BigQuery UDFs, Argo) specifically to mitigate the num=100 deprecation.',
    stack: ['Python', 'FastAPI', 'RabbitMQ', 'Redis', 'Docker', 'Argo Workflows', 'BigQuery'],
    outcomes: [
      '4x faster processing versus the previous collector.',
      '100M+ keywords processed per month across multiple vendor integrations.',
      "Keyword-collection costs cut ~60% across 25+ locales via the AI Overview stitching system that mitigated Google's num=100 deprecation.",
    ],
  },
  {
    // Personal project — the platform's name is intentionally withheld (not
    // publishable) and no dates are shown, by request. Deliberately last in
    // the array: every page that lists `projects` renders in array order.
    slug: 'healthcare-platform',
    title: 'Healthcare Claims Intelligence Platform',
    role: 'Founding Engineer & Full-Stack Lead · Personal Project',
    summary:
      'A production SaaS platform that automates the collection, validation, and analysis of insurance claims data for healthcare organizations. I was employee/contractor number one — no codebase, no architecture, no team. I built all of it, then hired the engineers who followed.',
    problem:
      'Diagnostic centres, clinics, and medical professionals were managing insurance claims manually across multiple insurance portals — no automated collection, no validation, no real-time visibility into what was outstanding, rejected, or overdue.',
    solution:
      'Built a full-stack SaaS platform from a blank repository: a Next.js dashboard with real-time analytics, a Django backend serving a dual-database architecture (application data cleanly separated from scraped claims data via a custom router), an automated collection pipeline with post-collection QA gating, a complete Stripe billing lifecycle, and a role-based access model scoped to the organization level. Then defined the technical direction, hired the team, and kept shipping.',
    stack: [
      'Next.js', 'React', 'TypeScript', 'Material UI', 'Tailwind CSS', 'Framer Motion',
      'Django', 'Django REST Framework', 'PostgreSQL',
      'GCP Cloud Run', 'Cloud SQL', 'Cloud Tasks', 'Cloud Scheduler',
      'Stripe', 'SendGrid', 'GitHub Actions', 'Docker',
    ],
    outcomes: [
      'Live in production with multiple healthcare organizations using it daily.',
      'Full Stripe billing lifecycle — free, trial, paid, upgrade/downgrade/cancellation/reactivation — built and operating with webhook-idempotent handlers.',
      '13 scraped data tables across 2 databases behind one custom database router, with zero cross-account data leaks under a documented multi-tenancy scoping model.',
      'Hired and onboarded the frontend, QA, DevOps, and backend engineers who now maintain and extend the platform.',
      'Multi-language UI (English + Italian) and RBAC across three permission levels, shipped with a CI/CD pipeline that runs automated database migrations on every deploy.',
    ],
    challenges: [
      {
        title: 'A booking ID that wasn’t actually unique',
        description:
          'The scraped claims database is multi-tenant, and a key booking identifier could repeat across different accounts — not a bug, a fact of the source data. I designed and documented explicit account-scoping rules for every query path (list queries, detail lookups, ORM subqueries, and raw SQL joins) to guarantee no account could ever see another’s records.',
      },
      {
        title: 'Stripe webhooks arriving more than once',
        description:
          'Stripe can and does redeliver the same billing event. Built an idempotency model keyed on the Stripe event ID, with handler errors caught and logged rather than re-thrown — so a logic bug never causes Stripe to retry a webhook that already succeeded.',
      },
      {
        title: 'A silent double round-trip on every API call',
        description:
          'Next.js normalizes URLs with trailing slashes; Django responds to slash-less URLs with a redirect. Left alone, every single API call would cost two HTTP round trips. Fixed at both ends of the request: the client strips trailing slashes, and the proxy re-appends exactly one before forwarding.',
      },
    ],
  },
]

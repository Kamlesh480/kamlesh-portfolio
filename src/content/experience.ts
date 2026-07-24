import type { ExperienceEntry } from './types'

/**
 * Sourced strictly from the resume/LinkedIn PDFs — every figure here
 * (percentages, dollar amounts, token counts) must match the source
 * documents exactly. Do not round, embellish, or add unevidenced claims.
 */
export const experience: ExperienceEntry[] = [
  {
    slug: 'brightedge',
    company: 'BrightEdge',
    role: 'Software Engineer (SDE 2)',
    location: 'Bengaluru, India',
    range: { start: 'Jun 2025', end: 'Present' },
    summary:
      'Architecting and scaling the core LLM processing infrastructure behind AI Hyper Cube — the platform that runs scoped LLM prompts over AI-generated search content to extract intent, brand entities, sentiment, and citations at production scale.',
    highlights: [
      'Architected and scaled the core LLM processing infrastructure for AI Hyper Cube using Python, ClickHouse, and MySQL, processing 5B+ tokens per month.',
      'Engineered a GPU-based LLM inference platform using vLLM, Vast.ai, and open-source models for large-scale entity extraction, cutting monthly AI processing costs 62% ($40K → $15K).',
      'Built pre- and post-processing pipelines for AI Hyper Cube, processing 100M+ keyword SERPs using Python and BigQuery for prompt generation, and Spark for post-processing with brand-level hash partitioning (MD5 modulo).',
      'Built a scalable Trino–Iceberg–ClickHouse data pipeline with a custom memory-aware job scheduler, replacing the legacy BigQuery UDF process — $18K–$20K in monthly savings while processing 1B+ events per month.',
      'Led development of DCX Collector V2 (Python, FastAPI, RabbitMQ, Redis, Docker, Argo Workflows, BigQuery) — a 4x faster processing pipeline handling 100M+ keywords per month across multiple vendor integrations.',
      'Implemented an automated AI Overview stitching system (Python, JavaScript, BigQuery UDFs, Argo) that mitigated the Google num=100 deprecation and cut keyword-collection costs ~60% across 25+ locales.',
    ],
    stack: ['Python', 'ClickHouse', 'MySQL', 'BigQuery', 'Apache Spark', 'Trino', 'Iceberg', 'Kubernetes', 'FastAPI', 'RabbitMQ', 'Redis', 'Docker', 'Argo Workflows', 'vLLM', 'GCS'],
  },
  {
    slug: 'hevo-data',
    company: 'Hevo Data',
    role: 'Full Stack Engineer',
    location: 'Bengaluru, India',
    range: { start: 'Feb 2022', end: 'May 2025' },
    summary:
      'Owned backend APIs and frontend experiences end-to-end for a data-pipeline SaaS product — from revenue-driving integrations to Core Web Vitals performance work.',
    highlights: [
      'Engineered the Snowflake Partner Connect feature via a secure POST API with a JWT fingerprint for automated destination creation, driving an additional 10–15 MQLs per month.',
      'Optimized the Signup API, cutting response time from 9s to 2–2.5s (~75% decrease) and increasing signup conversion 4–5%.',
      'Led end-to-end development of a secure referral portal (JavaScript Promises syncing job submissions across the database, webhooks, and the Lever API), increasing referral engagement 40%.',
      'Migrated the Django website frontend to a Next.js app with TypeScript and Tailwind CSS, and Dockerized it — a 15% improvement in application load times.',
      'Implemented A/B testing on high-conversion pages (signup, demo) using Jinja templates, HTML, SCSS, and JavaScript, resulting in a 20% increase in demo requests.',
      'Enhanced Core Web Vitals by deploying Varnish in-memory caching (good LCP URLs 55.73% → 65.23%) and migrating to CloudFront CDN, further raising good LCP URLs to 83.85%.',
    ],
    stack: ['Python', 'Django', 'Django REST Framework', 'JavaScript', 'React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Docker', 'CloudFront', 'Varnish', 'MySQL'],
  },
  {
    slug: 'duit-technologies',
    company: 'DUIT Technologies',
    role: 'Software Engineer Intern',
    location: 'New Delhi / Bengaluru, India',
    range: { start: 'Sep 2020', end: 'May 2022' },
    summary:
      'Early-career work spanning ETL pipelines, Python automation, and evaluating machine-learning APIs for production fit.',
    highlights: [
      'Created an ETL pipeline using Google Apps Script that fetched real-time data from a stock API and loaded it into Firebase and Google BigQuery — a 20% reduction in project costs.',
      'Evaluated 10+ machine-learning APIs, including the Google Video Intelligence API, and improved backend architecture with Python and MySQL, achieving ~90% accuracy in video analysis.',
      'Reduced project costs 15% by scripting Python-based data seeding for Google-registered shops via the Google Places API into a Firebase database.',
      'Developed Python scripts automating Confluence-to-Zendesk knowledge-base uploads, improving workflow efficiency for the customer experience team.',
    ],
    stack: ['Python', 'MySQL', 'Firebase', 'Google BigQuery', 'Google Places API', 'Google Apps Script', 'Django'],
  },
  {
    // Personal project — the platform's name is intentionally withheld
    // (not publishable) and no dates are shown, by request. This entry is
    // deliberately last in the array: every page that lists `experience`
    // renders in array order, so this stays last everywhere it appears.
    slug: 'personal-project',
    company: 'Personal Project',
    role: 'Founding Engineer & Full-Stack Lead',
    location: 'Remote',
    summary:
      'Founding engineer on a healthcare claims intelligence SaaS platform, built as a personal project — employee/contractor number one, before any other technical hire. Built the entire system from an empty repository to a live product with real paying healthcare organizations using it daily, then hired and onboarded the team that maintains it today.',
    highlights: [
      'Joined as the founding engineer with no existing codebase, architecture, or tooling — defined the technical direction, stack, repository structure, and conventions the whole team now follows.',
      'Owned the full stack end-to-end: Next.js/React/TypeScript frontend, Django/DRF backend, GCP infrastructure, data pipeline, billing, and RBAC.',
      'Designed a dual-database architecture with a custom Django database router — application data and scraped claims data live in separate, independently-managed databases, fully decoupling the data layer from the application layer.',
      'Built a complete Stripe billing lifecycle from scratch: trial provisioning, plan upgrades/downgrades, webhook idempotency, and automatic suspension/restoration of users and connectors tied to plan limits.',
      'Identified and enforced a critical multi-tenancy invariant (a key record identifier was not globally unique across accounts) — designed and documented the account-scoping rules across every query path to prevent cross-account data leaks.',
      'Built an automated data collection pipeline with post-collection QA gating (row-count, null-rate, and duplicate checks) before data reaches production, with Slack alerts on failure.',
      'Hired, onboarded, and mentored the engineers who followed — frontend, QA, DevOps, and backend/integration — including project memory systems and AI-assisted developer tooling that got new engineers contributing correctly from day one.',
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Django', 'Django REST Framework', 'PostgreSQL', 'GCP', 'Cloud Run', 'Stripe', 'Material UI', 'Tailwind CSS', 'Docker', 'GitHub Actions'],
  },
]

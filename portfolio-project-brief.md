# Portfolio Project Brief — Lumen: Healthcare Claims Intelligence Platform

> **Purpose of this document:** Feed this into a Claude session (or any AI assistant) to generate portfolio content — case study, resume bullet points, LinkedIn summary, project write-up, etc. It describes the project from an engineering skill perspective. All customer-specific and commercially sensitive information has been intentionally omitted.

---

## What I Built

**Lumen** is a production SaaS platform for healthcare claims management. It automates the collection, validation, and analysis of insurance claims data from multiple insurance portals, and surfaces that data as a real-time analytics dashboard for healthcare organisations (diagnostic centres, clinics, individual medical professionals).

I was the **lead engineer** across the full stack — frontend, backend, infrastructure, data pipeline, and developer tooling. The project went from zero to production with real paying customers.

---

## Tech Stack at a Glance

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Material UI v6, Tailwind CSS v3, Framer Motion, Canvas API, Recharts |
| **State & Data** | React Query v5 (`@tanstack/react-query`), React Context, Zod, React Hook Form |
| **Backend** | Python, Django REST Framework, PostgreSQL |
| **Auth** | JWT, httpOnly cookies, refresh token rotation, session cache pattern |
| **Billing** | Stripe (Checkout, Customer Portal, Webhooks), subscription lifecycle management |
| **Infrastructure** | Google Cloud Platform (Cloud Run, Cloud SQL, Cloud Scheduler, Cloud Tasks, Secret Manager, Artifact Registry), Vercel |
| **Analytics** | Google Analytics 4, Mixpanel — centralised typed provider pattern |
| **Automation** | Automated data collection pipeline, GCP Cloud Scheduler + Cloud Tasks job orchestration |
| **Notifications** | Slack webhooks (automated pipeline alerts) |
| **i18n** | Multi-language support (English + Italian) |
| **Developer tooling** | Claude Code (AI-assisted development), custom slash commands, project memory system |

---

## Frontend — Deep Dive

### Architecture Decisions

**Dual styling system with strict separation:**
The app has two visually distinct layers — a public marketing website and an authenticated dashboard. I enforced a hard architectural boundary:
- Public pages: Tailwind CSS v3 with a custom `website.*` semantic token namespace, Framer Motion entrance animations, Canvas API for interactive background animations
- Dashboard + auth: Material UI v6 exclusively, no Tailwind bleed. MUI `sx` props only — no `styled()` or `makeStyles`.

This kept the bundle clean, CSS specificity predictable, and made it impossible for a developer to accidentally mix systems.

**Next.js 15 App Router with route groups:**
```
src/app/
  page.tsx                    # Public landing page
  (auth)/                     # Auth layout group (no sidebar)
    login/, signup/, forgot-password/, reset-password/, activate/
  (dashboard)/                # Dashboard layout group (AppBar + Sidebar)
    dashboard/
      page.tsx                # Overview: KPIs, charts, recent data
      billing/                # Subscription management
      claims/                 # Claims list + claim detail (nested URL)
      reimbursements/         # Reimbursements list
      org/members/            # Org admin: member management
      profile/, help/
  pricing/                    # Public pricing page
  billing/success/, cancel/   # Stripe return URLs
  org/invites/[token]/accept/ # Public invite acceptance
```

**Proxy API architecture:**
All backend calls from the browser go through a Next.js catch-all API route (`/api/proxy/[...path]`). The browser never talks to the Django backend directly. The proxy:
- Reads httpOnly auth cookies server-side (tokens never exposed to client JS)
- Injects `Authorization` headers before forwarding to Cloud Run
- In production, additionally fetches and injects a Cloud Run IAM identity token for private service authentication
- Handles trailing slash normalisation to prevent Django 301 redirect chains

This was a deliberate security and architectural choice — it keeps the Cloud Run service private while giving the frontend a clean, same-origin API surface.

**Concurrent 401 handling:**
Built a queue-based refresh mechanism in the API client: when multiple in-flight requests hit a 401 simultaneously, only one token refresh fires. All other requests pause and drain the queue once the new token arrives. Prevents the "refresh storm" race condition common in SPA auth.

**Session cache pattern:**
Auth state is cached in `sessionStorage` and restored instantly on page load (no loading flash on refresh), then silently background-validated against the backend. A failed background validation clears state without a jarring logout screen, unless it returns a 401.

### Key Components Built

**`MultiSelectFilter`** — Reusable multi-select dropdown with:
- Dynamic search field appearing when options exceed 5
- "Select all" row counting only active (non-disabled) options  
- Disabled option states with visual distinction ("Unavailable" label)
- Automatic stripping of stale/disabled values that enter via URL params

**`DateRangePicker`** — Custom date range picker component replacing native inputs:
- Dual-month calendar view with range highlighting
- Preset shortcuts (Today, Last 7/14/30 days, This month, This year, All time)
- Hover preview before second selection click
- Data only commits on "Apply" — no premature API calls

**`StatusDistributionChart`** — Custom animated SVG pie chart (replaced Recharts for this component):
- CSS-scoped per-component to avoid global style leaks
- Entrance animation: 1050ms cubic-bezier sweep + count-up total + staggered bar fills
- Interactive: wedge pop-out + in-pie tooltip on hover, legend row highlighting
- Full dark mode support via CSS custom properties

**`AnalyticsProvider` + centralized analytics framework:**
GA4 and Mixpanel are registered as providers behind a typed abstraction layer. No page or component calls `gtag()` or `mixpanel.track()` directly — they call `analytics.track('event_name', properties)`. The event catalog is a TypeScript generic type that makes unknown event names a compile error. Adding a new analytics provider = one new file, zero callsite changes.

**Platform ↔ Portal cascade filter logic:**
Multi-select filters for data platform and insurance portal with bidirectional cascade — selecting a portal auto-selects its parent platform; selecting a platform narrows available portals. Handles the edge case where cross-platform portal selection must not be blocked when portals from multiple platforms are selected simultaneously.

### UI/UX Highlights

- **Dark mode** with full theme token system — no hardcoded colours except semantic KPI accent colours by design intent
- **Staggered entrance animations** on all dashboard pages using `motion.create(Box)` with custom delays
- **Canvas animations** — `HeroGridBackground` (dot-node grid with radial fade) and `EnterpriseGridAnimation` (5-snake crawling animation) both built with `requestAnimationFrame`
- **Scroll-aware navbar** on the public site with transparent → glass morphism transition at 5vh scroll threshold
- **Plan-gated navigation** — sidebar items lock and show upgrade tooltips based on subscription tier, without a page reload

---

## Backend — Deep Dive

### Architecture

Django REST Framework API with a clean resource-oriented URL structure. Account-scoped endpoints use nested paths (`/api/v1/accounts/{id}/claims/`) rather than query params, which made RBAC enforcement and URL semantics cleaner.

### Authentication & RBAC

- JWT-based auth with access + refresh token pair
- Custom organisation membership model: users belong to an org, have a role (`admin` / `member`), and are granted access to a subset of data accounts
- Org admins can invite members, manage roles, and control which data accounts each member can access
- Member deactivation carries a reason code (`plan_limit` vs `admin_action`) that drives different UI states — a member hit by a plan downgrade sees a different message and different available actions than one deactivated by an admin

### Billing Integration (Stripe)

Full Stripe integration covering:
- Plan tiers (Free, Individual, Individual Plus, Starter, Professional, Business Critical)
- Monthly and yearly billing cycles
- Trial provisioning at signup — the selected plan from the pricing page flows through the signup URL params into the backend's `provision_trial()` call so users start the trial on their chosen tier
- Stripe Customer Portal for plan upgrades, downgrades, and cancellation
- Webhook handling for subscription status changes
- Free plan as a permanent tier (not just trial expiry) — users can downgrade to Free without losing access
- Feature gating by plan: `features.help_support` flag, `limits.max_users`, `limits.max_connectors` enforced server-side and reflected in the frontend in real time via a polling hook

### Data Model

The platform uses a two-stage data table architecture:
- **Staging tables** (`iws_*` prefix) — raw collected data lands here first
- **Production tables** (no prefix) — QA-approved data that the API serves

This separation allows data quality validation before data reaches end users, supports re-collection and replacement workflows, and maintains a full audit trail of every scrape run.

---

## Data Pipeline

### Automated Collection

Built an automated job scheduling system:
- Schedule configuration stored per-account in the database (`frequency_days`, `is_active`, `last_run_at`, `next_run_at`)
- GCP Cloud Scheduler fires hourly; a Django endpoint reads schedules due to run and enqueues one Cloud Task per account
- Each Cloud Task executes the collector for that account in isolation — a failure for one account does not block others
- Deduplication prevents the same account+portal from running in parallel

### Automated Post-Collection QA

After every collection run, an automated QA framework runs before any data reaches production:
- Row count validation (at least one row, no regression vs previous run)
- Required field null-rate checks
- Date range coverage validation
- Duplicate detection within the batch
- Portal/platform field presence verification

QA results (`pass` / `warning` / `fail`) are stored on the scrape run record. Only `pass` triggers automatic promotion to production tables. `warning` and `fail` block promotion and trigger Slack alerts for manual review.

### Slack Notifications

Structured Slack messages sent to a dedicated channel after every pipeline run:
- ✅ Success: account, row counts, QA status, promotion confirmation, duration
- ⚠️ Warning: what check failed, what data was collected, that promotion is blocked
- ❌ Error: at which step the collector failed, what was left unchanged

All webhook URLs stored in GCP Secret Manager — never in code or environment files.

---

## Infrastructure

### GCP Architecture

```
Vercel (Next.js)
  ↓ /api/proxy/* (server-side, injects auth headers)
GCP Cloud Run (Django REST API — private service)
  ↓
GCP Cloud SQL (PostgreSQL)

GCP Cloud Scheduler → GCP Cloud Tasks → Cloud Run (data collection jobs)
GCP Secret Manager (credentials, webhook URLs, API keys)
GCP Artifact Registry (Docker images for Cloud Run)
```

### Security Posture

- Cloud Run deployed as a private service — not publicly reachable
- Next.js proxy is the only public entry point to the backend
- Production requests use dual-token auth: Cloud Run IAM identity token (proves the caller is an authorised GCP service account) + user JWT (proves who the user is)
- All secrets (DB credentials, Stripe keys, Slack webhooks) stored in GCP Secret Manager — never in `.env` files or code
- Auth tokens stored as httpOnly cookies — inaccessible to JavaScript, immune to XSS token theft
- PDF documents served via authenticated proxy — never exposed as direct storage URLs

### Staging Environment

Fully isolated staging environment mirroring production:
- Separate Vercel environment (auto-deploys from `staging` branch)
- Separate Cloud Run service (`lumen-backend-staging`)
- Separate Cloud SQL instance (`lumen-db-staging`)
- CI/CD pipeline: push to `staging` branch triggers automatic deploy of both frontend and backend

---

## Engineering Challenges Solved

**Trailing slash normalisation:**
Next.js normalises URLs and adds trailing slashes; Django responds to slash-less URLs with 301 redirects. Without intervention, every API call from the browser would generate two HTTP round trips. Solved with two-point stripping: the client strips trailing slashes before sending to the proxy, and the proxy re-appends exactly one before forwarding to Django — preventing both Django 301s and Next.js 308 normalisation redirects.

**Platform ↔ Portal cascade without blocking cross-platform selection:**
The cascade logic has a subtle edge case: if you select portals from two different platforms and then narrow by platform, the portal filter should not discard portals from the unselected platform. The condition `platform.length > 0 && insurancePortal.length === 0` ensures the portal list only narrows when no portals are selected yet — once any portal is picked, all portals stay visible.

**Stale URL params with disabled filter values:**
Platforms and portals can be deactivated server-side. Users arriving with stale bookmarked URLs containing now-inactive filter slugs would silently get wrong results. The filter bars strip inactive slugs from URL-initialised state before passing them as API params, while still showing the inactive options in the dropdown (greyed out) for transparency.

**`useEffect` + async auth context = duplicate API calls (anti-pattern avoided):**
In React Strict Mode, effects fire twice per mount. Combined with the two-phase auth context (cache restore → network validate), any `useEffect([isOrgAdmin])` pattern would trigger 4× API calls for admin-only data. Enforced the rule: all conditional data fetching uses React Query's `enabled` option, never `useEffect`.

**Framer Motion + MUI v6:**
`motion(Box)` is the Framer Motion v6 API; `motion.create(Box)` is the correct API for Framer Motion v11 with MUI v6. Subtle breakage that produced no runtime error but broke animations. Documented and enforced across the codebase.

---

## Developer Tooling

Built a custom Claude Code integration for AI-assisted development on this project:
- **Project memory system** — structured `.md` files documenting architecture, API contracts, UI patterns, gotchas, and naming decisions, consumed by Claude Code on every session to avoid re-scanning the codebase
- **Custom slash commands** — `/front-end-skill` (full coding guidelines for MUI + Next.js), `/new-dashboard-component` (scaffold new dashboard pages following project conventions), `/sync-memories` (audit and update memory files after significant changes)
- **Analytics tracking skill** — a reusable instruction set for adding typed analytics events to any component, enforcing privacy rules (no PII to GA4, no medical data tracked anywhere)

This reduced onboarding friction for new developers and made AI-assisted development significantly more accurate and context-aware.

---

## Scale & Scope Indicators

- Multiple production customer organisations (diagnostic centres and healthcare networks)
- Data collected from multiple insurance portals across different integration complexity tiers
- 14 staging tables + 14 production tables in the data pipeline
- Full billing lifecycle: free → trial → paid → upgrade/downgrade → cancellation → reactivation
- Multi-language UI (English + Italian)
- RBAC across three permission levels: unauthenticated, org member, org admin

---

## What This Project Demonstrates

| Skill area | Evidence |
|---|---|
| **Full-stack ownership** | Built frontend (Next.js), backend (Django), infra (GCP), and data pipeline end-to-end |
| **System design** | Proxy architecture, two-stage data pipeline, job scheduler, event-driven analytics layer |
| **TypeScript depth** | Generic event catalog for compile-time analytics correctness, strict null handling throughout |
| **Security engineering** | httpOnly cookies, private Cloud Run, dual-token IAM, Secret Manager, proxy pattern |
| **Performance thinking** | React Query caching strategy, concurrent 401 queue, session cache, planned Redis layer |
| **UI engineering** | Custom canvas animations, typed design system, dark mode token system, custom chart from scratch |
| **Auth & billing** | Full Stripe lifecycle, JWT refresh rotation, RBAC with feature gating, invite flows |
| **Data engineering** | Automated collection pipeline, QA framework, staging → production promotion with audit trail |
| **DevOps** | GCP Cloud Run + Scheduler + Tasks, Vercel, CI/CD, staging environment parity |
| **Developer experience** | Custom AI tooling, project memory system, documented patterns and anti-patterns |

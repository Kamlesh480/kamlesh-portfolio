---
title: "Scaling a SERP keyword collection pipeline to 100M+ keywords a month"
slug: "scaling-serp-keyword-collection-pipeline"
seoTitle: "Scaling a SERP keyword pipeline to 100M+/mo"
description: "How an event-driven rebuild with FastAPI, RabbitMQ and Redis took a SERP keyword collection pipeline to 100M+ keywords a month, 4x faster."
date: "2026-07-31"
category: "Data Infrastructure"
tags: ["python", "fastapi", "rabbitmq", "redis", "argo", "bigquery", "serp", "data-pipeline", "scale"]
featured: true
draft: true
cover: "pipeline"
coverTitle: "SERP collection at scale"
---

> **SCAFFOLD — not publishable yet.** Every number and technology named below is
> already public on this site (Projects / Experience). Sections marked
> **`[NEEDS INPUT]`** are deliberately empty: I won't invent internals. Fill those
> in, flip `draft: false`, and the post publishes itself.

## The problem

The previous collector could not keep pace with keyword volume across multiple vendor
SERP sources. On top of that, Google's `num=100` deprecation threatened to degrade
collection efficiency further — the kind of upstream change you don't get to negotiate
with.

:::metrics
- 100M+ | keywords / month
- 4× | faster than V1
- 25+ | locales served
- ~60% | collection cost cut
:::

## Background

`[NEEDS INPUT]` — what "collection" concretely does end to end: which artefacts are
fetched from vendors, what parsing happens, and where the output lands before BigQuery.

## What V1 actually did, and where it broke

`[NEEDS INPUT]` — V1's architecture and its real bottleneck. Was it request-bound,
single-worker, database-bound, or rate-limited by vendors? The "4× faster" claim needs
the honest before-picture to mean anything.

## The rebuild

The collector was rebuilt on Python, FastAPI, RabbitMQ, Redis, Docker, Argo Workflows,
and BigQuery.

:::diagram keyword-collection-pipeline

### Why a queue instead of direct calls

`[NEEDS INPUT]` — what RabbitMQ and Redis each do here. Queue for work distribution and
Redis for dedupe / rate-limiting / caching? Worth stating plainly, since "we used both"
without the split is the kind of detail readers see straight through.

### What Argo orchestrates

`[NEEDS INPUT]` — the split between the FastAPI service and Argo Workflows: which is the
scheduler, which is the worker pool, and what a single unit of work looks like.

## Absorbing the num=100 deprecation

An automated AI Overview stitching system — Python, JavaScript, BigQuery UDFs, and Argo —
was built specifically to mitigate the deprecation.

:::note What num=100 was
`[NEEDS INPUT]` — one plain-English paragraph on what the parameter did and what its
removal broke mechanically (e.g. results per request dropping, multiplying request count).
:::

`[NEEDS INPUT]` — how "stitching" works conceptually: what gets reassembled, from what,
and why that recovers the lost efficiency.

## Results

:::metrics
- 4× | faster processing vs. V1
- ~60% | keyword-collection cost cut
- 25+ | locales
:::

`[NEEDS INPUT]` — how "4× faster" was measured: throughput, wall-clock per batch, or
per-keyword latency? And over what window?

## What I'd do differently

`[NEEDS INPUT]` — the honest retrospective. This is the section engineers actually read.

## Takeaways

`[NEEDS INPUT]` — 3–4 transferable lessons that hold outside BrightEdge's specifics.

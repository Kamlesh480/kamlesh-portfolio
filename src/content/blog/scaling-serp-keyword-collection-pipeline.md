---
title: "From a 3-day batch wait to keywords that flow one at a time"
slug: "scaling-serp-keyword-collection-pipeline"
seoTitle: "Rebuilding a batch pipeline as event-driven"
description: "The old collector posted every job at once and waited two to three days for the whole batch to finish. Here's the event-driven rebuild that let each keyword flow independently."
date: "2026-07-31"
category: "Data Infrastructure"
tags: ["python", "fastapi", "rabbitmq", "redis", "serp", "data-pipeline", "scale"]
draft: false
cover: "pipeline"
coverTitle: "Batch → event-driven"
coverNodes: ["Keywords", "Redis", "Vendor", "Queue", "Workers"]
coverMetric: "3 days → continuous"
---

The slowest thing about the old collection pipeline wasn't throughput. It was **waiting**.

Every keyword in a batch was posted to vendors at once, and nothing useful came back until the entire batch had finished processing on their side — two to three days later. The system wasn't slow because it processed slowly. It was slow because it was designed to wait.

:::metrics
- 2–3 days | of waiting, removed
- 4× | faster processing
- 100M+ | keywords / month
- 25+ | locales
:::

## What the pipeline actually collects

For each keyword, the pipeline gathers the details that describe how it appears in search — where it ranks, whether an AI Overview is present for it, and the surrounding result characteristics. Multiply that by a hundred million keywords a month across twenty-five-plus locales and the interesting problem stops being "can we parse a result page" and becomes "how do we keep a hundred million small, independent jobs moving without losing track of any of them."

## What V1 did, and where it broke

V1 treated collection as a batch operation:

1. Take the set of keywords due for collection
2. Post every job to the vendors
3. Wait for **all** of them to finish
4. Start consuming the data

:::diagram serp-batch-before

Steps 2 and 3 are where the time went. Vendors process jobs on their own schedule, and the batch was only as fast as its slowest member — so the pipeline sat idle for two to three days before any keyword became usable.

:::warning The cost wasn't compute, it was coupling
Every keyword was tied to the fate of every other keyword in its batch. A single slow job held back results that were already finished and sitting there. Nothing in the design let a completed keyword move forward on its own.
:::

That coupling caused the rest of it too. Freshness was capped by the batch cycle rather than by how fast any individual keyword could be collected. And because progress was tracked at the batch level, a partial failure was awkward: you knew the batch hadn't finished, but not cleanly which keywords still owed you a result.

## The rebuild: state per keyword, work per callback

The fix wasn't a faster batch. It was removing the batch as a unit of progress.

:::diagram serp-event-driven-after

Two pieces carry that change, and they do different jobs — which is the part worth being precise about, because "we used Redis and RabbitMQ" tells you nothing on its own.

### Redis holds the state of every keyword

Redis stores the list of keywords due to be posted and, for each one, where it currently stands:

- has it been posted to the vendor yet?
- has its callback come back?
- has it been processed onward to the next step?

That's a status record per keyword, not per batch. The unit of progress became the keyword, which is what makes everything downstream possible: you can answer "what is outstanding right now" at any moment, and a keyword that finished early is free to move on immediately.

```python
# One status record per keyword — the pipeline's unit of progress.
POSTED, RETURNED, PROCESSED = "posted", "returned", "processed"

async def mark(redis, keyword: str, stage: str) -> None:
    await redis.hset(f"kw:{keyword}", mapping={"stage": stage})

async def pending(redis, keyword: str) -> bool:
    stage = await redis.hget(f"kw:{keyword}", "stage")
    return stage != PROCESSED
```

### RabbitMQ carries the work, triggered by the callback

Vendors don't finish on your schedule, so the pipeline stops asking and starts listening. When a callback arrives for a keyword, that becomes a task on a RabbitMQ queue for the next stage of processing.

The queue is what decouples arrival from processing. Callbacks land whenever they land; workers consume at whatever rate they can sustain. A burst of returns becomes queue depth instead of dropped work or a stalled service, and adding throughput means adding consumers rather than redesigning anything.

The combination is the whole idea: **Redis knows where every keyword stands, and RabbitMQ moves each one forward the moment it's ready.** Neither has to wait for a batch to close.

## When Google removed `num=100`

Partway through, an upstream change landed that had nothing to do with our design and everything to do with our request volume.

:::note What `num=100` was
Adding `num=100` to a Google search URL returned all of the results in a single page — effectively ten pages' worth in one request. When that parameter stopped being honoured, getting the same coverage meant paginating: many requests where one had previously been enough.
:::

This is the kind of change you don't get to negotiate. The relevant point for this write-up is that **the event-driven design absorbed it without a redesign**. More requests per keyword meant more callbacks and more queue depth — which is exactly the dimension the architecture was built to scale on. Under the batch model, the same change would have stretched an already multi-day cycle further.

## What changed

The headline number is 4× faster processing, but the shape of the change matters more than the multiple:

:::timeline
- Before | Post the whole batch, wait 2–3 days for every job, then consume
- After | Post continuously, react to each callback as it lands, process independently
:::

Freshness stopped being a property of the batch cycle and became a property of the individual keyword. "What's outstanding?" became a question with an answer, at any moment, rather than "the batch is still running."

## Takeaways

**A batch is a coupling decision, not just a scheduling one.** Grouping work means the group finishes together — which is fine until one member is slow and the rest are held hostage. If items are genuinely independent, tracking them independently is usually the whole fix.

**Track state at the unit you care about.** Batch-level progress can't answer "which keywords still owe me a result." Keyword-level status can, and that single change is what allows partial progress, targeted retries, and a real answer to "where are we right now."

**When you don't control completion, stop polling and start listening.** Vendors finish when they finish. A callback plus a queue turns someone else's unpredictable timing into your own backpressure, which you can actually scale.

**Design for the dimension that will grow.** Absorbing the `num=100` removal took no redesign because the system already scaled on queue depth and consumer count. Choosing the right axis early is what makes an unwelcome upstream change a capacity question instead of a rewrite.

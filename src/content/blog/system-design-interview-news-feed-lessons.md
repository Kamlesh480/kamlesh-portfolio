---
title: "What a system design interview actually tests: notes from a 10M-user feed"
slug: "system-design-interview-news-feed-lessons"
seoTitle: "System design interview: designing a news feed"
description: "Design a social platform for 10 million daily active users. The hard part wasn't the architecture: it was sequencing, answering the question asked, and keeping the design honest under follow-ups. Notes from the other side of the whiteboard."
date: "2026-09-03"
category: "Interviews"
tags: ["system-design", "interviews", "redis", "caching", "scalability", "backend"]
cover: "layers"
coverTitle: "Feed design, under questioning"
coverNodes: ["Estimate", "Model", "Feed", "Defend"]
coverMetric: "10M DAU"
---

The prompt was one line: **design a social media platform for 10 million daily active users: feed, posts, follows.**

I've read plenty of write-ups on feed design. What none of them prepared me for was the *shape* of the conversation: which parts the interviewer cut short, which single question came back four times, and how quickly a reasonable-sounding design falls apart under "so when exactly does that happen?"

This is a guide to that shape. The architecture is the easy half.

:::metrics
- 45 min | for scope, estimate, model, design
- 4× | one question re-asked until answered
- ~23K | read QPS at 10M DAU
- 100:1 | read-to-write ratio
:::

Here is the actual board at the end of the session: estimates bottom-left, services through the middle, feed and caches on the right. Names have been replaced; nothing else is touched.

![The whiteboard at the end of the interview: client and gateway on the left, auth, posts and user-management services through the middle, and the feed with its two caches on the right. Capacity estimates are written along the bottom-left.](/blog/social-media-feed-whiteboard.png)

Two things stand out to me now. The estimates ended up in a corner as an afterthought, when they should have driven everything. And the feed node on the right says both `pull` and `push`, which, as the interviewer eventually pointed out, is not yet a decision.

## Lesson 1: Estimate before you draw

I did what felt natural: started sketching boxes. Client, gateway, load balancer, then a careful decomposition of services.

I got about six minutes in before:

> "Before even drawing boxes, can you start with estimation?"

That's not a stylistic preference. **Numbers determine the architecture, so they have to come first.** Whether you need one database or a sharded cluster, whether the feed can be computed on read, whether media needs a CDN: all of it falls out of the QPS and storage figures. Draw first and you're designing for a scale you haven't established, and every box becomes unjustifiable.

The estimate itself is mechanical once you commit to assumptions out loud:

| Quantity | Assumption | Result |
| --- | --- | --- |
| Writes | 2 posts/user/day | 20M posts/day → **~230 write QPS** |
| Reads | 100:1 read:write | 2B reads/day → **~23K read QPS** |
| Peak | 3× average | ~700 write / ~70K read QPS |
| Metadata | ~1 KB/post | 20 GB/day → **~7 TB/year** |
| Media | 20% of posts, ~500 KB | 2 TB/day → **~730 TB/year** |

:::tip State assumptions as assumptions
Every number above rests on a guess: 2 posts a day, 100:1, 20% with media. Saying "I'm assuming 2 posts per user per day, tell me if that's off" turns a wrong guess into a shared premise. The interviewer can correct the input instead of doubting your reasoning.
:::

The media number is the one that pays off later: **730 TB/year vs 7 TB/year** is what makes "media goes to object storage behind a CDN, and the database stores only a URL" an obvious conclusion rather than a memorised talking point.

## Lesson 2: Find the hard problem and spend your time there

My first instinct was to design authentication properly: an auth service, token validation, where to centralise it, how the gateway routes valid versus invalid tokens.

> "Let's forget authentication: that's not the main problem statement."

Fair. Auth is well-understood, and every candidate can talk about JWTs. It generates no signal. Later the interviewer was explicit about where the signal was:

> "I can go in terms of feed itself, that is the hardest problem today."

**In any design prompt, one component is genuinely hard and the rest is plumbing.** Here: posts are a write to a table, follows are an edge list, auth is a solved problem. The feed is the only part where 10 million users changes what you'd build. That's where the interview lives.

Worth saying out loud early: *"Posts, follows and auth are fairly standard: I'll set them up quickly and spend most of the time on feed generation, since that's where the scale actually bites."* Now you're driving.

## Lesson 3: Answer the question that was asked

This is the one I'd rewind if I could.

The interviewer asked what I was storing in Redis. I answered by talking about media, CDNs, and cache warming. So it came again. And again: four times, progressively blunter:

> "In your Redis, what exactly are you storing?"
>
> "So what I asked was, whether post IDs are the things included in a read?"
>
> "Again: coming to the point, in your Redis, what exactly are you storing?"
>
> "My question is whether you're going to query the DB every time to get the post, or the entire post is in cache."

The answer was one sentence: **post IDs in a sorted set, scored by timestamp: the content lives in a separate cache.** I knew that. I buried it under context nobody asked for.

:::warning Context before the answer reads as evasion
Under pressure, elaborating feels like being thorough. From the other side of the table it looks like you don't know, or aren't listening. Lead with the direct answer in one sentence, then add the reasoning: **answer, then explain**, never the reverse.
:::

If an interviewer repeats a question, they are not testing your patience. They are telling you that you haven't answered it. Stop, and answer the literal question.

## The design: what actually goes in the cache

Once stated plainly, the design is two levels:

:::diagram feed-two-level-cache

Each user's timeline is a sorted set of post IDs. Post content sits in a second, shared cache keyed by post ID. A feed read pulls a page of IDs, then batch-fetches those posts, hitting the database only on a miss.

Which invites the obvious follow-up:

> "Why not just put everything in the first one?"

Three reasons, and having them ready is the whole point:

- **Write amplification.** A post by someone with a million followers would copy the full payload a million times. IDs are ~8 bytes; content is kilobytes.
- **One source of truth per post.** Edit a caption and you update one key: not every follower's timeline.
- **Cheap trimming.** Capping a timeline at the newest ~800 entries is trivial when entries are IDs.

**Note the pattern in that follow-up.** It wasn't a hint that I was wrong. It was a check that I could justify a decision I'd already made. Any real design has alternatives; being asked "why not X?" means the interviewer wants your reasoning, not a retreat.

## Lesson 4: A cache needs an eviction story

Then a question I hadn't prepared for:

> "If the size of posts per month is N, would the size of that cluster also be N?"

The instinct is to say yes: every post gets written, so it accumulates. But if the answer is "the cache grows exactly as fast as the database forever", you haven't designed a cache. You've designed a second, more expensive copy of the database.

The real answer is that **cache size is bounded by policy, not by input volume**: a TTL or an LRU/LFU eviction bound keeps a hot window (recent posts, plus whatever is being read), and everything else falls back to the store. Steady state sits well below N.

:::note The question behind the question
"Does it grow as N?" is really "do you know a cache needs a bound?" Any answer that names a policy, TTL, LRU, a rolling window, passes. Any answer that lets it grow forever does not, no matter how well you justify it.
:::

## Lesson 5: Your diagram has to match your claims

The sharpest moment came near the end. I'd said "push" and "pull" and drawn precomputed timelines. Then:

> "At what time are you precomputing in your second cluster? Because there's only two ways to go about it. If you're going to cache it at the time of query, you're not precomputing anything. There is no push at all: you're always pulling from the DB no matter what."

That was correct, and it caught a real gap. I'd described a push model but drawn a cache populated on read. **Those are opposite designs.** Fan-out on write means a worker pushes IDs into follower timelines at post time so reads are already done. Populating on query is fan-out on read with a cache in front. You can build either. You cannot claim one and draw the other.

The version that holds up is the hybrid, with the trigger stated explicitly:

:::diagram feed-hybrid-fanout

:::timeline
- On write | A worker pushes the new post ID into each follower's timeline: reads become a single lookup
- Exception | Accounts above a follower threshold are skipped; one post can't cost millions of writes
- On read | Fetch the precomputed timeline, pull posts from skipped big accounts live, merge
:::

That threshold is the celebrity problem, and naming it is most of the credit. Pure push dies on the account with 50 million followers. Pure pull dies at 23,000 reads per second. Neither is the answer; knowing which one breaks where is.

## Lesson 6: Expect questions about how you work with AI

Then the interview turned somewhere I didn't expect, and I think this is now standard:

- Which models do you use, and how do you decide which is good for a task?
- What's your token spend per month?
- What observability do you use for AI pipelines?
- Given clear specs, how many CRUD endpoints could you build in a day?

None of these are trivia. They're probing whether you have **calibrated judgement about your own tooling**: whether you've actually measured model fit for a task, or just default to whatever's popular.

The model-selection question was the interesting one, because the useful answer is a process, not a name: run the same workload through several models, score them on a criterion the product actually cares about, keep the one that wins. On a prompt-classification workload that meant measuring how many outputs yielded a usable entity: a concrete metric, not a vibe.

:::tip Have a number ready
"How much do you spend on tokens?" and "how many endpoints in a day?" both test self-awareness. An honest, specific answer, even a rough one, even a low one, beats a confident evasion. I said 50 endpoints and added the caveat that I care whether they map to real business logic, not just that they compile. The caveat is the substance.
:::

## What I'd do differently

1. **Estimate first, unprompted.** Numbers before boxes, always.
2. **Name the hard part out loud** and get permission to spend the time there.
3. **Answer in one sentence, then elaborate.** If a question repeats, I failed at this.
4. **Give every cache a bound**, TTL or eviction, before being asked.
5. **Say the trigger for every arrow.** "Populated by a worker at post time" is a design; an arrow is not.
6. **Treat "why not X?" as an invitation**, not a correction.

The architecture in this interview was, honestly, not hard. Feed design is a well-trodden problem and the two-level cache with hybrid fan-out is close to the standard answer. What was hard was the discipline: sequencing the conversation, hearing the actual question, and keeping the story consistent when someone pulls on a thread.

**Those are the parts you can practise without learning any new architecture at all.** Take a design you already know cold, and have someone ask "when exactly does that happen?" at every arrow until you can answer without hedging.

/**
 * Charcoal schematics authored for specific blog posts, keyed by slug and
 * embedded from markdown with `:::diagram <slug>`.
 *
 * These are deliberately generic: no real domains, project ids, service
 * accounts, IP addresses, or resource names ever appear in a diagram — see the
 * employer/confidentiality invariant in known_patterns.md.
 */
import { Diagram, Box, Cylinder, Queue, Arrow, Connector, Group, Badge, Note } from './Sketch'

/* ---- Before: a token exchange on every single request ------------------- */
function OidcBefore() {
  return (
    <Diagram
      viewBox="0 4 660 330"
      minWidth={460}
      title="The previous request path: a browser calls a server-side Next.js proxy, which performs a three-step token exchange: platform OIDC token, then an STS exchange, then a Cloud Run identity token: before the request reaches the private, IAM-enforced Cloud Run service and the Django app. The exchange added roughly 200 to 400 milliseconds to every request."
      caption="Fig. 1. Before: three token hops stood between the proxy and the application, on every request."
    >
      <Box x={16} y={116} w={112} h={56} label="Browser" />
      <Arrow from={{ x: 128, y: 144 }} to={{ x: 162, y: 144 }} />
      <Box x={162} y={110} w={126} h={68} label="Next.js proxy" sub="server-side" />
      <Arrow from={{ x: 288, y: 144 }} to={{ x: 320, y: 144 }} />

      <Group x={310} y={30} w={214} h={230} label="token exchange · per request" />
      <Box x={324} y={48} w={186} h={46} label="1 · Platform OIDC" />
      <Arrow from={{ x: 417, y: 94 }} to={{ x: 417, y: 116 }} />
      <Box x={324} y={116} w={186} h={46} label="2 · STS exchange" />
      <Arrow from={{ x: 417, y: 162 }} to={{ x: 417, y: 184 }} />
      <Box x={324} y={184} w={186} h={46} label="3 · Cloud Run ID token" />

      <Arrow from={{ x: 524, y: 144 }} to={{ x: 556, y: 144 }} />
      <Box x={556} y={110} w={100} h={68} solid label="Cloud Run" sub="private · IAM" />

      <Badge cx={417} cy={290} text="+200–400 ms" w={150} h={38} />
    </Diagram>
  )
}

/* ---- After: one entry point, no tokens in the request path -------------- */
function LoadBalancerAfter() {
  return (
    <Diagram
      viewBox="0 4 660 344"
      minWidth={460}
      title="The new request path: API traffic goes browser to Next.js proxy to an HTTPS load balancer, while admin traffic goes through an identity-aware SSO gate to the same load balancer. The balancer routes through a serverless network endpoint group to Cloud Run, whose ingress accepts load-balancer traffic only, so the direct service URL is blocked."
      caption="Fig. 2. After: one controlled entry point. No identity token is minted anywhere in the request path."
    >
      {/* API path */}
      <Box x={16} y={44} w={130} h={54} label="Browser" sub="API calls" />
      <Arrow from={{ x: 146, y: 71 }} to={{ x: 180, y: 71 }} />
      <Box x={180} y={38} w={140} h={62} label="Next.js proxy" sub="plain forward" />

      {/* admin path */}
      <Box x={16} y={152} w={130} h={54} label="Admin user" />
      <Arrow from={{ x: 146, y: 179 }} to={{ x: 180, y: 179 }} />
      <Box x={180} y={146} w={140} h={62} solid label="SSO gate" sub="org identity" />

      {/* both converge on the balancer */}
      <Arrow from={{ x: 320, y: 69 }} to={{ x: 358, y: 104 }} bend={8} />
      <Arrow from={{ x: 320, y: 177 }} to={{ x: 358, y: 140 }} bend={-8} />
      <Box x={358} y={86} w={158} h={68} solid label="HTTPS Load Balancer" sub="SSL termination" />

      <Arrow from={{ x: 437, y: 154 }} to={{ x: 437, y: 190 }} />
      <Box x={358} y={190} w={158} h={48} label="Serverless NEG" />
      <Arrow from={{ x: 437, y: 238 }} to={{ x: 437, y: 268 }} />
      <Cylinder x={366} y={268} w={142} h={62} label="Cloud Run" sub="ingress: LB only" />

      {/* the door that is now shut */}
      <g className="sk-node--legacy">
        <Box x={530} y={190} w={122} h={48} label="Direct URL" />
      </g>
      <Connector from={{ x: 530, y: 226 }} to={{ x: 512, y: 292 }} dashed />
      <Note x={528} y={262} text="blocked" />
    </Diagram>
  )
}

/* ---- SERP collection: batch-and-wait ------------------------------------ */
function SerpBatchBefore() {
  return (
    <Diagram
      viewBox="0 4 660 260"
      minWidth={440}
      title="The previous collection design: the whole keyword batch is posted to vendors at once, and nothing is usable until every job in the batch has finished: a wait of two to three days before any data flows."
      caption="Fig. 1. Before: one batch, one wait. The slowest job set the pace for all of them."
    >
      <Box x={16} y={92} w={132} h={62} label="Keyword batch" />
      <Arrow from={{ x: 148, y: 123 }} to={{ x: 184, y: 123 }} />
      <Box x={184} y={92} w={148} h={62} label="Post every job" sub="all at once" />
      <Arrow from={{ x: 332, y: 123 }} to={{ x: 372, y: 123 }} />

      <Group x={362} y={58} w={180} h={132} label="vendor processing" />
      <Box x={378} y={98} w={148} h={52} label="Jobs run" />

      <Arrow from={{ x: 542, y: 123 }} to={{ x: 584, y: 123 }} />
      <Box x={584} y={92} w={64} h={62} label="Data" />

      <Connector from={{ x: 452, y: 190 }} to={{ x: 452, y: 214 }} dashed />
      <Badge cx={452} cy={236} text="2–3 days before anything lands" w={264} h={38} />
    </Diagram>
  )
}

/* ---- SERP collection: event-driven -------------------------------------- */
function SerpEventDrivenAfter() {
  return (
    <Diagram
      viewBox="0 4 660 320"
      minWidth={460}
      title="The rebuilt design: Redis holds a status record for every keyword: whether it has been posted, whether its callback has arrived, and whether it has been processed onward. When a vendor callback arrives it becomes a task on a RabbitMQ queue, workers pick it up immediately, and the keyword's status is updated. Each keyword flows independently instead of waiting for the batch."
      caption="Fig. 2. After: state per keyword, work triggered per callback. Nothing waits for the batch."
    >
      {/* outbound */}
      <Box x={16} y={44} w={118} h={54} label="Keywords" />
      <Arrow from={{ x: 134, y: 71 }} to={{ x: 166, y: 71 }} />
      <Cylinder x={166} y={38} w={140} h={70} label="Redis" sub="status per keyword" />
      <Arrow from={{ x: 306, y: 71 }} to={{ x: 344, y: 71 }} label="post" labelDy={-10} />
      <Box x={344} y={44} w={136} h={54} label="Vendor" />

      {/* callback path */}
      <Arrow from={{ x: 412, y: 98 }} to={{ x: 412, y: 168 }} label="callback" labelDy={-8} />
      <Queue x={330} y={168} w={164} h={56} label="RabbitMQ" />
      <Arrow from={{ x: 330, y: 196 }} to={{ x: 300, y: 196 }} />
      <Box x={160} y={166} w={140} h={60} solid label="Workers" sub="next step" />

      {/* the loop that makes it self-tracking */}
      <Connector from={{ x: 230, y: 166 }} to={{ x: 230, y: 112 }} dashed />
      <Note x={20} y={150} text={['status updated:', 'posted · returned · done']} />

      <Badge cx={540} cy={262} text="each keyword flows on its own" w={230} h={38} />
    </Diagram>
  )
}

/* ---- Two-level cache: timeline holds IDs, content lives once ----------- */
function FeedTwoLevelCache() {
  return (
    <Diagram
      viewBox="0 4 600 292"
      minWidth={440}
      title="A two-level cache for a news feed. Each user's timeline is a Redis sorted set holding only post IDs, scored by timestamp. A second, shared cache holds one copy of each post's content, keyed by post ID. Reading a feed fetches a page of IDs from the timeline, then batch-fetches those posts from the content cache, falling back to the post store only on a miss."
      caption="Fig. 1. The timeline stores IDs; the content is cached once and shared. Editing a post touches one key, not every follower's timeline."
    >
      <Box x={16} y={42} w={104} h={56} label="Feed read" sub="GET /feed" />
      <Arrow from={{ x: 120, y: 70 }} to={{ x: 156, y: 70 }} />

      <Group x={148} y={30} w={228} h={104} label="1 · timeline per user" />
      <Box x={162} y={48} w={200} h={44} label="ZSET user:42:feed" sub="post IDs by time" />
      <Note x={162} y={112} text="~8 bytes each · trimmed to N" />

      {/* kept to the right of the group label below, which the centre would cross */}
      <Connector from={{ x: 340, y: 134 }} to={{ x: 340, y: 166 }} bend={0} />

      <Group x={148} y={166} w={228} h={104} label="2 · content, cached once" />
      <Box x={162} y={184} w={200} h={44} label="HASH post:{id}" sub="one copy per post" />
      <Note x={162} y={248} text="TTL / LRU: hot window only" />

      <Arrow from={{ x: 376, y: 206 }} to={{ x: 424, y: 206 }} label="miss" />
      <Cylinder x={424} y={172} w={128} h={72} label="Post store" sub="source of truth" />
    </Diagram>
  )
}

/* ---- Hybrid fan-out: push for most, pull for the huge accounts --------- */
function FeedHybridFanout() {
  return (
    <Diagram
      viewBox="0 4 680 316"
      minWidth={470}
      title="Hybrid fan-out. When an ordinary account posts, a worker pushes the post ID into each follower's precomputed timeline, so reads are a single lookup. Accounts above a follower threshold are skipped by that push; their posts are pulled live at read time and merged into the timeline instead, so one post never triggers millions of writes."
      caption="Fig. 2. Push on write for ordinary accounts; pull at read time for the few with enormous follower counts. The read path merges both."
    >
      <Box x={16} y={20} w={116} h={56} label="New post" />
      <Arrow from={{ x: 132, y: 48 }} to={{ x: 168, y: 48 }} />
      <Queue x={168} y={22} w={132} h={52} label="fan-out queue" />
      <Arrow from={{ x: 300, y: 48 }} to={{ x: 344, y: 48 }} />
      <Box x={344} y={16} w={150} h={64} label="Push worker" sub="ordinary accounts" />
      <Arrow from={{ x: 494, y: 48 }} to={{ x: 540, y: 48 }} />
      <Box x={540} y={16} w={116} h={64} label="Timelines" sub="precomputed" />

      <Note x={168} y={104} text="skipped for accounts above the follower threshold" />

      <Box x={16} y={196} w={116} h={64} label="Feed read" sub="GET /feed" />
      <Arrow from={{ x: 132, y: 228 }} to={{ x: 176, y: 228 }} />
      <Box x={176} y={196} w={150} h={64} label="Merge" sub="pushed + pulled" />
      <Note x={16} y={172} text="read = precomputed IDs + live pulls" />

      {/* both reads terminate on a real box: no arrow into empty space */}
      <Arrow from={{ x: 326, y: 212 }} to={{ x: 536, y: 88 }} />
      <Arrow from={{ x: 326, y: 244 }} to={{ x: 536, y: 262 }} label="pull at read" />
      <Box x={540} y={230} w={116} h={64} label="Big accounts" sub="fetched live" />
    </Diagram>
  )
}

const MAP: Record<string, () => React.ReactElement> = {
  'oidc-before': OidcBefore,
  'load-balancer-after': LoadBalancerAfter,
  'serp-batch-before': SerpBatchBefore,
  'serp-event-driven-after': SerpEventDrivenAfter,
  'feed-two-level-cache': FeedTwoLevelCache,
  'feed-hybrid-fanout': FeedHybridFanout,
}

export function blogDiagram(slug: string): React.ReactElement | null {
  const D = MAP[slug]
  return D ? <D /> : null
}

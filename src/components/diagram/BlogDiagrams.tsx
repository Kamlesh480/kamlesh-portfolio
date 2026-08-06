/**
 * Charcoal schematics authored for specific blog posts, keyed by slug and
 * embedded from markdown with `:::diagram <slug>`.
 *
 * These are deliberately generic: no real domains, project ids, service
 * accounts, IP addresses, or resource names ever appear in a diagram — see the
 * employer/confidentiality invariant in known_patterns.md.
 */
import { Diagram, Box, Cylinder, Arrow, Connector, Group, Badge, Note } from './Sketch'

/* ---- Before: a token exchange on every single request ------------------- */
function OidcBefore() {
  return (
    <Diagram
      viewBox="0 4 660 330"
      minWidth={460}
      title="The previous request path: a browser calls a server-side Next.js proxy, which performs a three-step token exchange — platform OIDC token, then an STS exchange, then a Cloud Run identity token — before the request reaches the private, IAM-enforced Cloud Run service and the Django app. The exchange added roughly 200 to 400 milliseconds to every request."
      caption="Fig. 1 — Before: three token hops stood between the proxy and the application, on every request."
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
      caption="Fig. 2 — After: one controlled entry point. No identity token is minted anywhere in the request path."
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

const MAP: Record<string, () => React.ReactElement> = {
  'oidc-before': OidcBefore,
  'load-balancer-after': LoadBalancerAfter,
}

export function blogDiagram(slug: string): React.ReactElement | null {
  const D = MAP[slug]
  return D ? <D /> : null
}

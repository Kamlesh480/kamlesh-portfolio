---
title: "Cutting 200–400ms per request by putting Cloud Run behind a load balancer"
slug: "cloud-run-load-balancer-oidc-token-exchange"
seoTitle: "Cloud Run behind an HTTPS load balancer"
description: "Every API call minted a fresh identity token through a three-step OIDC exchange. Replacing it with an HTTPS load balancer and a serverless NEG removed the tokens, the latency, and the vendor coupling."
date: "2026-08-06"
category: "Infrastructure"
tags: ["gcp", "cloud-run", "load-balancer", "oidc", "nextjs", "django", "security"]
cover: "comparison"
coverTitle: "One entry point"
coverNodes: ["Browser", "Proxy", "Load balancer", "Cloud Run"]
coverMetric: "200–400ms removed"
---

A private Cloud Run service is easy to reach from a laptop and surprisingly awkward to reach from a serverless frontend. The service enforces IAM, so every caller needs a valid Google identity token, and if your frontend runs on someone else's platform, getting one means a token exchange on **every single request**.

That exchange was costing 200–400ms per API call. This is how it came out of the request path, and what replaced it.

:::metrics
- 200–400ms | removed per request
- 3 → 0 | token hops before the app
- 1 | controlled entry point
:::

## The old path: three hops before the app

The frontend was a Next.js app with a server-side proxy route. Cloud Run was fully private, so before the proxy could forward anything it had to prove who it was:

1. **Platform OIDC token**: minted server-side by the hosting platform via Workload Identity Federation
2. **STS exchange**, that token swapped at Google's Security Token Service for a short-lived credential
3. **Cloud Run identity token**: a final token scoped to the exact service URL, set as the `Authorization` header

Cloud Run's IAM check validated the token, then handed the request to Django.

:::diagram oidc-before

It worked. It was also the slowest part of an otherwise fast stack.

:::warning The exchange was never cached
This is the detail that made it expensive rather than merely complex: the three-step exchange ran **per request**, not per session or per cold start. Every call paid the full cost.
:::

### A knock-on effect on auth headers

Because the identity token occupied the `Authorization` header, the application's own JWT had nowhere standard to sit. It moved to a custom header, and the authentication class had to accept both:

```python
class FlexibleJWTAuthentication(JWTAuthentication):
    """Reads the user JWT from X-User-Token when a platform identity token
    already occupies the Authorization header (production), and from the
    standard Authorization header locally."""

    def get_header(self, request):
        raw = request.META.get("HTTP_X_USER_TOKEN")
        if raw:
            return raw.encode("utf-8") if isinstance(raw, str) else raw
        return super().get_header(request)
```

A small thing, but a good example of how an infrastructure decision quietly reshapes application code. The header split outlived the token exchange that caused it.

### And no usable admin URL

Django admin had no public hostname at all. Reaching it meant opening a local tunnel:

```bash
gcloud run services proxy my-backend --region=$REGION --port=9090
# then browse http://localhost:9090/admin/
```

Workable for an engineer. Useless for anyone else on the team.

## What was actually wrong

Listing the problems separately makes the shape of the fix obvious:

- **Latency**: 200–400ms of token exchange on every request
- **Coupling**: platform-specific OIDC logic living in the frontend codebase
- **Fragility**: a failed exchange surfaced as an opaque `403` with no indication of which of the three steps broke
- **Access**: no admin URL a non-engineer could open
- **Portability**: the auth path was tied to one hosting provider

Every one of those traces back to the same root cause: **authentication was happening in the request path instead of at the network boundary.**

## The new path: one entry point

All traffic now enters through a Google HTTPS Load Balancer. Cloud Run stops enforcing IAM per-caller, and the network decides who gets in.

:::diagram load-balancer-after

The request flow becomes unremarkable, which is the point:

:::timeline
- API call | Browser → Next.js proxy → `api.example.com` → load balancer → serverless NEG → Cloud Run
- Admin | Browser → `admin.example.com` → SSO gate → the same load balancer
- Direct URL | The generated `run.app` URL is refused by ingress policy
:::

The proxy is now a plain HTTP forwarder. No SDK, no Workload Identity Federation config, no token minting:

```typescript
// Before: three awaited round-trips just to build a header.
const idToken = await getCloudRunIdentityToken(CLOUD_RUN_URL)
headers.set('Authorization', `Bearer ${idToken}`)
headers.set('X-User-Token', `Bearer ${userJwt}`)

// After: forward the user's JWT and get out of the way.
headers.set('X-User-Token', `Bearer ${userJwt}`)
```

## The setting that makes this possible

The interesting part is how Cloud Run stops checking IAM. The obvious move, granting `allUsers` the invoker role, is blocked outright in many organisations by a **Domain Restricted Sharing** org policy. That policy exists for good reason and you should not go looking for a way around it.

Google's supported answer is a service-level flag:

```bash
gcloud run services update my-backend \
  --region=$REGION \
  --no-invoker-iam-check \
  --ingress=internal-and-cloud-load-balancing
```

:::note Why this isn't "making it public"
`--no-invoker-iam-check` disables the invoker check **at the container level** without ever adding `allUsers` to the IAM policy, so it doesn't violate the org policy. It's only safe when paired with the second flag: `--ingress=internal-and-cloud-load-balancing` means the service accepts traffic *only* from the load balancer. Set the first flag without the second and you have genuinely published an open endpoint.
:::

The two flags are a pair. The ingress restriction is what turns "no IAM check" from a hole into a boundary.

## The load balancer stack

Four resources sit between DNS and the container, and each exists for one reason:

| Resource | Role |
| --- | --- |
| Serverless NEG | The adapter that lets a load balancer target a Cloud Run service at all |
| Backend service | Wraps the NEG; where timeouts and logging attach |
| URL map | Routes paths: the hook for adding more services later |
| HTTPS proxy + managed cert | Terminates SSL; the certificate auto-renews |

One gotcha worth knowing: **Google-managed certificates cannot provision while the hostname is proxied by a CDN.** The validation reaches the CDN edge instead of the load balancer and the certificate sits in `PROVISIONING` indefinitely. Point DNS straight at the load balancer IP until the certificate goes `ACTIVE`, then re-enable proxying if you need it.

```bash
# Watch until status is ACTIVE, not PROVISIONING
gcloud compute ssl-certificates describe my-cert --global \
  --format="get(managed.status)"
```

## Admin without a tunnel

The admin hostname is proxied through an identity-aware access layer requiring SSO with an organisation account. Unauthenticated requests are rejected at the edge and never reach the load balancer at all.

That produces defence in depth, with each layer doing one job:

| Layer | Protects | Mechanism |
| --- | --- | --- |
| Identity-aware proxy | `/admin/` | SSO: organisation account required |
| Cloud Run ingress | Every endpoint | Load-balancer traffic only; direct URL refused |
| Application JWT | API endpoints | Signed token, validated per request |
| Django admin auth | `/admin/` views | Superuser credentials, after SSO |

Two independent identity checks now guard admin, and neither requires anyone to install `gcloud`.

## What it bought

- **200–400ms off every API request.** The single largest latency win available, because it deleted work rather than optimising it.
- **A frontend with no cloud SDK.** The proxy forwards a header. New engineers don't need to understand Workload Identity Federation to work on it.
- **A real admin URL**, gated by SSO instead of a local tunnel.
- **A tighter blast radius.** The direct service URL is refused; there's exactly one way in.
- **Room to grow.** More services go behind the same load balancer through the URL map, with no per-service auth wiring.

## What I'd tell someone starting this

**Push authentication to the boundary.** A token minted per request is a tax on every request forever. Network-level identity is checked once, by infrastructure built for it.

**Treat `--no-invoker-iam-check` and the ingress flag as one change.** Reviewing them separately is how a private service quietly becomes public.

**Provision certificates before moving traffic.** The DNS-versus-CDN interaction costs an hour if you hit it unaware and nothing if you sequence it correctly.

**Expect the cleanup to outlive the migration.** The custom auth header exists because of a constraint that no longer applies. It still works, so it stays, for now. Infrastructure changes leave archaeology in the application layer, and it's worth writing down why, before the reason is forgotten.

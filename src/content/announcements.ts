/**
 * Site-wide announcement bar content.
 *
 * Add an entry, deploy, done. Multiple active entries rotate automatically.
 * Remove an entry (or let it expire) and the bar disappears on its own — with
 * no entries active, nothing renders at all and no space is reserved.
 *
 * `starts`/`expires` are evaluated in the BROWSER, not at build time, so a
 * dated announcement (an event, a sale, a talk) switches itself on and off
 * without needing a redeploy on the day.
 *
 * `id` is the dismissal key. Keep it stable for a given announcement; changing
 * it makes the bar reappear for people who previously dismissed it — which is
 * what you want for genuinely new news, and not what you want for a typo fix.
 */
export interface Announcement {
  id: string
  /** Keep it short — this has to read on one line on a phone. */
  message: string
  href: string
  /** Link label. Defaults to "Read more". */
  cta?: string
  /** ISO date (YYYY-MM-DD). Hidden before this day. */
  starts?: string
  /** ISO date (YYYY-MM-DD). Hidden from the END of this day. */
  expires?: string
  /** `accent` uses the slate accent for the pill — use sparingly. */
  tone?: 'default' | 'accent'
}

export const announcements: Announcement[] = [
  {
    id: 'post-system-design-interview-2026-09',
    message: 'New write-up: what a system design interview actually tests: notes from a 10M-user feed',
    href: '/blog/system-design-interview-news-feed-lessons',
    cta: 'Read the post',
  },
  {
    id: 'post-cloud-run-load-balancer-2026-08',
    message: 'Cutting 200–400ms per request by putting Cloud Run behind a load balancer',
    href: '/blog/cloud-run-load-balancer-oidc-token-exchange',
    cta: 'Read the post',
    tone: 'accent',
  },
]

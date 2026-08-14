'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { announcements, type Announcement } from '@/content/announcements'

/**
 * Rotating announcement bar at the very top of every page.
 *
 * Deliberate behaviours:
 *  - Renders NOTHING until mounted and until it knows what's active. The bar is
 *    date-filtered and dismissal-aware, both of which are client-only facts —
 *    rendering server-side would flash a bar that then vanishes, and would ship
 *    an expired announcement in the static HTML.
 *  - Reserves no space when empty, so a site with no news has no dead strip.
 *  - Rotation pauses on hover and on keyboard focus, so it can't yank a link
 *    out from under someone mid-click or mid-read.
 *  - `prefers-reduced-motion` disables auto-rotation entirely; the dots still
 *    allow manual navigation.
 *  - Dismissal is keyed to the SET of active ids, so publishing something new
 *    brings the bar back while a dismissed set stays dismissed.
 */

const STORAGE_KEY = 'kc-announce-dismissed'
const ROTATE_MS = 7000

/* The dismissed key lives in localStorage — an external store. Reading it via
 * useSyncExternalStore (rather than a `mounted` flag flipped in an effect)
 * gives a correct server snapshot with no hydration mismatch and no
 * setState-inside-an-effect cascade.
 *
 * The sentinel doubles as "we're on the server / not hydrated yet", which is
 * exactly when the bar must render nothing: date windows and dismissal are
 * both client-only facts. */
// A Symbol, not a sentinel string: it cannot collide with a real stored
// value, and — unlike the NUL-prefixed string this replaced — it doesn't
// make grep/git treat this source file as binary.
const UNKNOWN = Symbol('announce:server')

const listeners = new Set<() => void>()
/** localStorage's `storage` event only fires in OTHER tabs, so same-tab
 *  dismissals notify subscribers manually. */
function notifyDismissChange() {
  listeners.forEach((l) => l())
}
function subscribeDismiss(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', cb)
  }
}
function readDismiss(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null // storage blocked (private mode) — just show the bar
  }
}

function isActive(a: Announcement, now: Date): boolean {
  if (a.starts && now < new Date(`${a.starts}T00:00:00`)) return false
  // `expires` is inclusive of that whole day.
  if (a.expires && now > new Date(`${a.expires}T23:59:59`)) return false
  return true
}

/** Ignore trailing slashes, query strings and hashes when comparing routes. */
const normalisePath = (p: string) => p.split(/[?#]/)[0].replace(/\/+$/, '') || '/'

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const pathname = usePathname()

  // The union must be explicit: TS otherwise infers the type from
  // getSnapshot alone and rejects the Symbol server snapshot.
  const dismissedKey = useSyncExternalStore<string | null | typeof UNKNOWN>(
    subscribeDismiss,
    readDismiss,
    () => UNKNOWN
  )
  const hydrated = dismissedKey !== UNKNOWN

  // Date filtering must happen on the client: `new Date()` during SSR would
  // bake the build machine's clock into static HTML.
  const dateActive = useMemo(() => {
    if (!hydrated) return []
    const now = new Date()
    return announcements.filter((a) => isActive(a, now))
  }, [hydrated])

  // The dismissal key is derived from the DATE-active set, NOT the set shown on
  // this route. If it followed the route-filtered list, navigating onto an
  // announced page would shrink the set, change the key, and resurrect a bar
  // the visitor had already dismissed.
  const key = useMemo(() => dateActive.map((a) => a.id).sort().join('|'), [dateActive])

  // Don't advertise the page someone is already reading.
  const active = useMemo(
    () => dateActive.filter((a) => normalisePath(a.href) !== normalisePath(pathname ?? '')),
    [dateActive, pathname]
  )

  // Route changes can shorten the list; restart from the first item so the
  // rotation never points at a stale index. Adjusted DURING RENDER rather than
  // in an effect — React's documented pattern for resetting state when a prop
  // changes, and it avoids the cascading re-render an effect would cause.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setIndex(0)
  }

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, key)
    } catch {
      /* non-fatal: the bar simply returns next visit */
    }
    notifyDismissChange()
  }, [key])

  const visible = hydrated && active.length > 0 && dismissedKey !== key

  useEffect(() => {
    if (!visible || active.length < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setIndex((i) => (i + 1) % active.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [visible, active.length, paused])

  if (!visible) return null

  const current = active[Math.min(index, active.length - 1)]

  return (
    <div
      className="announce"
      role="region"
      aria-label="Site announcements"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="announce-inner">
        {/* Not an aria-live region: an auto-rotating banner that announces
            itself on every tick is hostile to screen-reader users. The dots
            provide deliberate navigation instead. */}
        <Link
          className={`announce-link${current.tone === 'accent' ? ' is-accent' : ''}`}
          href={current.href}
        >
          <span className="announce-dot" aria-hidden="true" />
          <span className="announce-msg">{current.message}</span>
          <span className="announce-cta">{current.cta ?? 'Read more'} →</span>
        </Link>

        {active.length > 1 && (
          <div className="announce-nav" role="tablist" aria-label="Choose announcement">
            {active.map((a, i) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={a.message}
                className={`announce-pip${i === index ? ' is-on' : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}

        <button type="button" className="announce-close" onClick={dismiss} aria-label="Dismiss announcements">
          ×
        </button>
      </div>
    </div>
  )
}

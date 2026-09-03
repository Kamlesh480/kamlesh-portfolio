'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { headerRoutes } from '@/lib/routes'
import BrandMark from './BrandMark'

// Hand-drawn underline squiggle per nav item — viewBox width and path roughly
// track each label's length so the underline reads as "drawn under this word."
const underlines: Record<string, { viewBox: string; d: string; len: number }> = {
  '/about': { viewBox: '0 0 60 12', d: 'M2 7 C 14 3, 28 10, 58 5', len: 64 },
  '/experience': { viewBox: '0 0 100 12', d: 'M2 6 C 30 11, 70 2, 98 8', len: 104 },
  '/projects': { viewBox: '0 0 84 12', d: 'M2 7 C 22 2, 50 11, 78 5', len: 84 },
  '/skills': { viewBox: '0 0 66 12', d: 'M2 6 C 18 10, 40 2, 64 7', len: 70 },
  '/contact': { viewBox: '0 0 78 12', d: 'M2 6 C 26 11, 54 2, 78 8', len: 84 },
}

export default function SiteHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile panel whenever the route actually changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Escape closes the mobile panel, consistent with the draw-mode escape hatch.
  useEffect(() => {
    if (!mobileOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <header>
      <Link href="/" className="brand">
        <BrandMark />
        <span className="brand-text">Kamlesh<span className="dot" /></span>
      </Link>

      <nav id="nav" aria-label="Primary">
        {headerRoutes.map((route) => {
          const ul = underlines[route.path]
          const active = pathname === route.path
          return (
            <Link
              key={route.path}
              className={`nav-item${active ? ' is-active' : ''}`}
              href={route.path}
            >
              {route.navLabel ?? route.label}
              {ul && (
                <svg className="ul" viewBox={ul.viewBox} preserveAspectRatio="none" aria-hidden="true">
                  <path d={ul.d} style={{ '--len': String(ul.len) } as React.CSSProperties} />
                </svg>
              )}
            </Link>
          )
        })}
      </nav>

      <button
        className="nav-hamburger"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 16" fill="none" aria-hidden="true">
          <path d="M2 2 C9 1,17 3,22 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" filter="url(#rough)" />
          <path d="M2 8 C9 7,17 9,22 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" filter="url(#rough)" />
          <path d="M2 14 C9 13,17 15,22 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" filter="url(#rough)" />
        </svg>
      </button>

      {/* The header's bottom edge. Uses .nav-rule, NOT .rule: `.rule` is
          hidden by default (stroke-dashoffset) and only revealed by the Home
          hero's .ink/.settled choreography, so it would draw nothing here. */}
      <svg className="nav-rule" viewBox="0 0 1500 14" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 8 C 200 4, 360 11, 560 7 S 920 3, 1140 9 S 1380 5, 1498 7" />
      </svg>

      <div className={`nav-mobile-panel${mobileOpen ? ' open' : ''}`} aria-hidden={!mobileOpen}>
        {headerRoutes.map((route, i) => (
          <Link
            key={route.path}
            href={route.path}
            className="nav-mobile-item"
            style={{ transitionDelay: mobileOpen ? `${i * 0.05}s` : '0s' }}
            onClick={() => setMobileOpen(false)}
          >
            {route.navLabel ?? route.label}
          </Link>
        ))}
      </div>
    </header>
  )
}

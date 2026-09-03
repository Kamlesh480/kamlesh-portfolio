'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import SvgFilterDefs from './SvgFilterDefs'

/**
 * Persistent, global site chrome: paper texture layers, ambient dust, and
 * the entire draw-mode system (toolbar, quick bar, overlay, canvases).
 *
 * MUST be rendered as a direct child of <body> in the root layout, as a
 * sibling to <main>{children}</main> — never nested inside any element that
 * could receive `transform`/`filter`/`contain`, which would silently break
 * the `position: fixed` layers here (paper, toolbar, draw canvases). This
 * is what lets these elements stay pinned to the viewport across scrolling
 * and across client-side route navigation without re-initializing.
 *
 * Reserved DOM ids owned by this component (referenced by id, not ref, from
 * the vanilla canvas engines in src/lib/charcoal.js and src/lib/playground.js
 * — no other component may ever render an element with one of these ids):
 * paper, grain, tooth, vignette, dust, modeIndicator, drawQuickBar,
 * drawExitBtn, toolbar, tbDrag, modeToggle, tbCollapse, drawOverlay,
 * drawCanvas, drawFx.
 */
export default function SiteChrome() {
  // Prevent React StrictMode's dev-mode mount→unmount→remount from creating
  // two competing Playground closures (each with its own drawMode state).
  const initialized = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      await import('@/lib/charcoal')
      await import('@/lib/playground')

      // paper grain via inline SVG turbulence (no external asset)
      function noiseURI(freq: number, oct: number, alpha: number) {
        const svg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">' +
          '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="' + freq +
          '" numOctaves="' + oct + '" stitchTiles="stitch"/>' +
          '<feColorMatrix type="matrix" values="0 0 0 0 0.10  0 0 0 0 0.09  0 0 0 0 0.07  0 0 0 ' + alpha + ' 0"/>' +
          '</filter><rect width="300" height="300" filter="url(#n)"/></svg>'
        return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")'
      }
      const grainEl = document.getElementById('grain')
      const toothEl = document.getElementById('tooth')
      const grain = noiseURI(0.9, 2, 0.55)
      const tooth = noiseURI(0.18, 3, 0.42)
      if (grainEl) grainEl.style.backgroundImage = grain
      if (toothEl) toothEl.style.backgroundImage = tooth
      // Publish the same textures as CSS vars. The sticky top bar paints its
      // own paper (it sits above #paper/#grain/#tooth in the stack), so it has
      // to reproduce them — otherwise that strip renders as a flat, visibly
      // lighter band against the textured page.
      const root = document.documentElement
      root.style.setProperty('--grain-img', grain)
      root.style.setProperty('--tooth-img', tooth)

      const dustCanvas = document.getElementById('dust') as HTMLCanvasElement | null
      if (dustCanvas && window.Charcoal) window.Charcoal.Dust(dustCanvas)

      const canvas = document.getElementById('drawCanvas') as HTMLCanvasElement | null
      const fx = document.getElementById('drawFx') as HTMLCanvasElement | null
      const toolbar = document.getElementById('toolbar')
      if (canvas && fx && toolbar && window.Playground) {
        window.Playground({ canvas, fx, toolbar })
      }

      // Draggable toolbar — users can pull it next to where they're drawing
      ;(function () {
        const drag = document.getElementById('tbDrag')
        const tb = document.getElementById('toolbar')
        if (!drag || !tb) return
        let ox = 0, oy = 0

        drag.addEventListener('pointerdown', function (e) {
          const ev = e as PointerEvent
          ev.stopPropagation()
          drag.setPointerCapture(ev.pointerId)
          const r = tb.getBoundingClientRect()
          tb.style.right = 'auto'
          tb.style.transform = 'none'
          tb.style.left = r.left + 'px'
          tb.style.top = r.top + 'px'
          ox = ev.clientX - r.left
          oy = ev.clientY - r.top
          ;(drag as HTMLElement).style.cursor = 'grabbing'
        })

        drag.addEventListener('pointermove', function (e) {
          const ev = e as PointerEvent
          if (!drag.hasPointerCapture(ev.pointerId)) return
          ev.stopPropagation()
          const maxX = window.innerWidth - tb.offsetWidth
          const maxY = window.innerHeight - tb.offsetHeight
          tb.style.left = Math.max(0, Math.min(maxX, ev.clientX - ox)) + 'px'
          tb.style.top = Math.max(0, Math.min(maxY, ev.clientY - oy)) + 'px'
        })

        drag.addEventListener('pointerup', function (e) {
          drag.releasePointerCapture((e as PointerEvent).pointerId)
          ;(drag as HTMLElement).style.cursor = 'grab'
        })
      })()
    }

    init()
  }, [])

  // Draw marks are session-scoped to the current page, not carried across
  // navigation (a scribble on Home showing up on /contact would read as a
  // bug, not a feature). The draw *system* itself (toolbar, mode state)
  // stays mounted — only the pixel content clears on route change.
  useEffect(() => {
    const canvas = document.getElementById('drawCanvas') as HTMLCanvasElement | null
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }, [pathname])

  return (
    <>
      {/* paper stack */}
      <div id="paper" aria-hidden="true" />
      <div id="grain" aria-hidden="true" />
      <div id="tooth" aria-hidden="true" />
      <div id="vignette" aria-hidden="true" />
      <canvas id="dust" aria-hidden="true" />

      {/* mode indicator */}
      <div id="modeIndicator" />

      {/* Draw-mode quick bar: visible only in draw mode (CSS) */}
      <div id="drawQuickBar">
        <button id="drawExitBtn" aria-label="Exit draw mode">
          ← Exit draw mode
        </button>
        <span className="qb-sep" />
        <button className="qt" data-qt="soft" aria-label="Soft charcoal">Soft</button>
        <button className="qt" data-qt="heavy" aria-label="Heavy charcoal">Heavy</button>
        <button className="qt" data-qt="pencil" aria-label="Fine pencil">Pencil</button>
        <button className="qt" data-qt="smudge" aria-label="Smudge">Smudge</button>
        <button className="qt" data-qt="eraser" aria-label="Eraser">Eraser</button>
        <span className="qb-sep" />
        <button className="qt" data-qt="size-down" aria-label="Smaller brush">−</button>
        <button className="qt" data-qt="size-up" aria-label="Larger brush">+</button>
        <span className="qb-sep" />
        <button className="qt qt-clear" data-qt="clear" aria-label="Clear marks">✕ Clear</button>
      </div>

      {/* toolbar */}
      <div className="toolbar" id="toolbar">
        <div className="tb-drag" id="tbDrag" title="Drag to move toolbar" aria-hidden="true">
          <svg viewBox="0 0 24 14" fill="none">
            <path d="M3 2 C8 1,16 3,21 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" filter="url(#rough)" />
            <path d="M3 7 C8 6,16 8,21 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" filter="url(#rough)" />
            <path d="M3 12 C8 11,16 13,21 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" filter="url(#rough)" />
          </svg>
        </div>

        <button id="modeToggle" title="Toggle draw mode">
          <svg className="mt-bg" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M7 9 C18 5, 34 7, 42 10 C44 20, 44 32, 41 40 C30 44, 14 43, 7 39 C4 28, 5 18, 7 9 Z" />
          </svg>
          <svg className="mt-icon" viewBox="0 0 28 28" aria-hidden="true">
            <path d="M6 22 L17 6 L22 9 L11 25 Z" />
            <path d="M6 22 L10 21 L11 25 Z" />
            <path d="M17 6 L22 9" />
          </svg>
          <span className="mt-label">Click to draw</span>
        </button>

        <div className="tool-group">
          <div className="tb-note">The paper is yours.</div>

          <button className="tool active" data-tool="soft" data-label="Soft charcoal" data-key="2">
            <svg className="tool-bg" viewBox="0 0 42 42" aria-hidden="true">
              <path d="M5 8 C13 5, 30 6, 37 9 C39 18, 39 28, 36 37 C26 40, 12 39, 5 35 C3 25, 3 16, 5 8 Z" />
            </svg>
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20 L9 7 L13 7 L19 20" strokeWidth="3" />
              <path d="M6 16 L16 16" />
            </svg>
          </button>

          <button className="tool" data-tool="heavy" data-label="Heavy charcoal" data-key="3">
            <svg className="tool-bg" viewBox="0 0 42 42" aria-hidden="true">
              <path d="M5 8 C13 5, 30 6, 37 9 C39 18, 39 28, 36 37 C26 40, 12 39, 5 35 C3 25, 3 16, 5 8 Z" />
            </svg>
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 20 L9 5 L15 5 L20 20" strokeWidth="4.5" />
              <path d="M5.5 15 L17.5 15" />
            </svg>
          </button>

          <button className="tool" data-tool="pencil" data-label="Fine pencil" data-key="1">
            <svg className="tool-bg" viewBox="0 0 42 42" aria-hidden="true">
              <path d="M5 8 C13 5, 30 6, 37 9 C39 18, 39 28, 36 37 C26 40, 12 39, 5 35 C3 25, 3 16, 5 8 Z" />
            </svg>
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 19 L16 4" />
              <path d="M14 6 L18 4 L20 8 L10 22 Z" />
            </svg>
          </button>

          <svg className="tb-sep" viewBox="0 0 24 8" preserveAspectRatio="none" aria-hidden="true">
            <path d="M1 4 C6 3, 18 5, 23 4" />
          </svg>

          <button className="tool" data-tool="smudge" data-label="Smudge" data-key="4">
            <svg className="tool-bg" viewBox="0 0 42 42" aria-hidden="true">
              <path d="M5 8 C13 5, 30 6, 37 9 C39 18, 39 28, 36 37 C26 40, 12 39, 5 35 C3 25, 3 16, 5 8 Z" />
            </svg>
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 14 C8 8, 17 8, 19 14 C21 19, 14 21, 12 17" />
              <path d="M8 16 C9 13, 15 12, 16 16" />
            </svg>
          </button>

          <button className="tool" data-tool="eraser" data-label="Eraser" data-key="E">
            <svg className="tool-bg" viewBox="0 0 42 42" aria-hidden="true">
              <path d="M5 8 C13 5, 30 6, 37 9 C39 18, 39 28, 36 37 C26 40, 12 39, 5 35 C3 25, 3 16, 5 8 Z" />
            </svg>
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="13" width="16" height="7" rx="1" />
              <path d="M8 13 L13 5 L20 9 L15 13" />
            </svg>
          </button>

          <svg className="tb-sep" viewBox="0 0 24 8" preserveAspectRatio="none" aria-hidden="true">
            <path d="M1 4 C6 3, 18 5, 23 4" />
          </svg>

          <button className="tool" data-tool="clear" data-label="Clear marks">
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5 L19 19" />
              <path d="M19 5 L5 19" />
            </svg>
          </button>
        </div>

        <button className="tb-collapse" id="tbCollapse" title="Collapse toolbar">‹</button>
      </div>

      {/* drawOverlay: geometric draw zone, see globals.css for the reserved-strip layout */}
      <div id="drawOverlay" aria-hidden="true" />
      <canvas id="drawCanvas" aria-hidden="true" />
      <canvas id="drawFx" aria-hidden="true" />

      <SvgFilterDefs />
    </>
  )
}

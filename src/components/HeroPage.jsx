'use client'

import { useEffect, useRef } from 'react'

export default function HeroPage() {
  // Prevent React StrictMode from running init twice.
  // StrictMode intentionally mounts→unmounts→remounts in dev, which would
  // create two Playground instances with independent drawMode closures that
  // fight each other and make the toolbar appear unresponsive in draw mode.
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      await import('@/lib/charcoal')
      await import('@/lib/playground')

      // paper grain via inline SVG turbulence (no external asset)
      function noiseURI(freq, oct, alpha) {
        const svg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">' +
          '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="' + freq +
          '" numOctaves="' + oct + '" stitchTiles="stitch"/>' +
          '<feColorMatrix type="matrix" values="0 0 0 0 0.10  0 0 0 0 0.09  0 0 0 0 0.07  0 0 0 ' + alpha + ' 0"/>' +
          '</filter><rect width="300" height="300" filter="url(#n)"/></svg>'
        return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")'
      }
      document.getElementById('grain').style.backgroundImage = noiseURI(0.9, 2, 0.55)
      document.getElementById('tooth').style.backgroundImage = noiseURI(0.18, 3, 0.42)

      const fig = window.Charcoal.FigureCanvas(document.getElementById('figure'))
      window.Charcoal.Dust(document.getElementById('dust'))

      // stagger headline word blooms
      const words = document.querySelectorAll('.headline .w')
      words.forEach((w, i) => {
        w.style.animationDelay = (0.15 + i * 0.16) + 's'
      })

      let revealed = false
      const sheet = document.getElementById('sheet')

      function play() {
        if (revealed) return
        revealed = true
        sheet.classList.add('ink')
        setTimeout(() => {
          fig.init(true)
          sheet.classList.add('reveal')
        }, 420)
      }

      function settle() {
        if (revealed) return
        revealed = true
        sheet.classList.add('ink', 'settled')
        fig.init(false)
      }

      function begin() {
        if (!document.hidden) { play(); return }
        document.addEventListener('visibilitychange', function vh() {
          if (!document.hidden) {
            document.removeEventListener('visibilitychange', vh)
            play()
          }
        })
        setTimeout(() => { if (!revealed) settle() }, 2600)
      }

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(begin)
        setTimeout(begin, 1400)
      } else {
        begin()
      }

      let rt
      window.addEventListener('resize', () => {
        clearTimeout(rt)
        rt = setTimeout(() => { fig.resize() }, 220)
      })

      window.Playground({
        canvas: document.getElementById('drawCanvas'),
        fx: document.getElementById('drawFx'),
        toolbar: document.getElementById('toolbar'),
      })

      // Draggable toolbar — users can pull it next to where they're drawing
      ;(function () {
        const drag = document.getElementById('tbDrag')
        const tb   = document.getElementById('toolbar')
        if (!drag || !tb) return
        let ox = 0, oy = 0

        drag.addEventListener('pointerdown', function (e) {
          e.stopPropagation()
          drag.setPointerCapture(e.pointerId)
          const r = tb.getBoundingClientRect()
          // Switch from right/transform anchoring to free left/top
          tb.style.right     = 'auto'
          tb.style.transform = 'none'
          tb.style.left      = r.left + 'px'
          tb.style.top       = r.top  + 'px'
          ox = e.clientX - r.left
          oy = e.clientY - r.top
          drag.style.cursor = 'grabbing'
        })

        drag.addEventListener('pointermove', function (e) {
          if (!drag.hasPointerCapture(e.pointerId)) return
          e.stopPropagation()
          const maxX = window.innerWidth  - tb.offsetWidth
          const maxY = window.innerHeight - tb.offsetHeight
          tb.style.left = Math.max(0, Math.min(maxX, e.clientX - ox)) + 'px'
          tb.style.top  = Math.max(0, Math.min(maxY, e.clientY - oy)) + 'px'
        })

        drag.addEventListener('pointerup', function (e) {
          drag.releasePointerCapture(e.pointerId)
          drag.style.cursor = 'grab'
        })
      })()
    }

    init()
  }, [])

  return (
    <>
      {/* paper stack */}
      <div id="paper" />
      <div id="grain" />
      <div id="tooth" />
      <div id="vignette" />

      {/* the whole sheet */}
      <div className="sheet" id="sheet">

        <header>
          <div className="brand">Kamlesh<span className="dot" /></div>
          <nav id="nav">
            <a className="nav-item" href="#">Work
              <svg className="ul" viewBox="0 0 60 12" preserveAspectRatio="none">
                <path d="M2 7 C 14 3, 28 10, 58 5" style={{'--len': '64'}} />
              </svg>
            </a>
            <a className="nav-item" href="#">Studio
              <svg className="ul" viewBox="0 0 70 12" preserveAspectRatio="none">
                <path d="M2 6 C 18 10, 40 2, 68 7" style={{'--len': '74'}} />
              </svg>
            </a>
            <a className="nav-item" href="#">Process
              <svg className="ul" viewBox="0 0 80 12" preserveAspectRatio="none">
                <path d="M2 7 C 22 2, 50 11, 78 5" style={{'--len': '84'}} />
              </svg>
            </a>
            <a className="nav-item" href="#">Contact
              <svg className="ul" viewBox="0 0 80 12" preserveAspectRatio="none">
                <path d="M2 6 C 26 11, 54 2, 78 8" style={{'--len': '84'}} />
              </svg>
            </a>
          </nav>
        </header>

        <svg className="rule" viewBox="0 0 1500 14" preserveAspectRatio="none">
          <path d="M2 8 C 200 4, 360 11, 560 7 S 920 3, 1140 9 S 1380 5, 1498 7" style={{'--rlen': '1560'}} />
        </svg>

        <div className="hero">
          <div className="figure-wrap">
            <canvas id="figure" />
          </div>

          <div className="hero-text">
            <div className="eyebrow">Charcoal &amp; Graphite — Figurative Work</div>
            <h1 className="headline" id="headline">
              <span className="ln"><span className="w">Drawn</span> <span className="w">from</span></span>
              <span className="ln"><span className="w accent">shadow</span></span>
              <span className="ln"><span className="w">&amp;</span> <span className="w">dust.</span></span>
            </h1>
            <p className="lede">
              A body of work pressed into paper by hand —{' '}
              <em>smudge, line, and erasure</em> chasing the figure out of the dark.
            </p>
            <div className="cta-row">
              <a className="btn" href="#">
                View the work
                <svg className="ring" viewBox="0 0 200 64" preserveAspectRatio="none">
                  <path
                    d="M14 10 C 70 4, 150 6, 188 12 C 196 26, 194 44, 186 54 C 130 60, 50 58, 12 52 C 4 38, 6 20, 14 10 Z"
                    style={{'--blen': '640'}}
                  />
                </svg>
              </a>
              <a className="link-plain" href="#">About the studio</a>
            </div>
          </div>
        </div>

        <div className="foot">
          <div className="scroll"><span className="stem" /> scroll</div>
          <div className="signature">Kamlesh</div>
          <div className="meta">No.&nbsp;01 — Charcoal on paper<br />Studio &nbsp;·&nbsp; MMXXVI</div>
        </div>

      </div>

      {/* mode indicator */}
      <div id="modeIndicator" />

      {/* Draw-mode quick bar — visible only in draw mode (CSS).
          Every button here shares the EXACT same styling & event treatment as
          the exit button, which is proven to work in all environments. */}
      <div id="drawQuickBar">
        <button id="drawExitBtn" aria-label="Exit draw mode">
          ← Exit draw mode
        </button>
        <span className="qb-sep" />
        <button className="qt" data-qt="soft"   aria-label="Soft charcoal">Soft</button>
        <button className="qt" data-qt="heavy"  aria-label="Heavy charcoal">Heavy</button>
        <button className="qt" data-qt="pencil" aria-label="Fine pencil">Pencil</button>
        <button className="qt" data-qt="smudge" aria-label="Smudge">Smudge</button>
        <button className="qt" data-qt="eraser" aria-label="Eraser">Eraser</button>
        <span className="qb-sep" />
        <button className="qt" data-qt="size-down" aria-label="Smaller brush">−</button>
        <button className="qt" data-qt="size-up"   aria-label="Larger brush">+</button>
        <span className="qb-sep" />
        <button className="qt qt-clear" data-qt="clear" aria-label="Clear marks">✕ Clear</button>
      </div>

      {/* toolbar */}
      <div className="toolbar" id="toolbar">

        {/* Drag handle — grab here to reposition the toolbar */}
        <div className="tb-drag" id="tbDrag" title="Drag to move toolbar">
          <svg viewBox="0 0 24 14" fill="none">
            <path d="M3 2 C8 1,16 3,21 2"  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" filter="url(#rough)"/>
            <path d="M3 7 C8 6,16 8,21 7"  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" filter="url(#rough)"/>
            <path d="M3 12 C8 11,16 13,21 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" filter="url(#rough)"/>
          </svg>
        </div>

        <button id="modeToggle" title="Toggle draw mode">
          <svg className="mt-bg" viewBox="0 0 48 48">
            <path d="M7 9 C18 5, 34 7, 42 10 C44 20, 44 32, 41 40 C30 44, 14 43, 7 39 C4 28, 5 18, 7 9 Z" />
          </svg>
          <svg className="mt-icon" viewBox="0 0 28 28">
            <path d="M6 22 L17 6 L22 9 L11 25 Z" />
            <path d="M6 22 L10 21 L11 25 Z" />
            <path d="M17 6 L22 9" />
          </svg>
          <span className="mt-label">Click to draw</span>
        </button>

        <div className="tool-group">
          <div className="tb-note">The paper is yours.</div>

          <button className="tool active" data-tool="soft" data-label="Soft charcoal" data-key="2">
            <svg className="tool-bg" viewBox="0 0 42 42">
              <path d="M5 8 C13 5, 30 6, 37 9 C39 18, 39 28, 36 37 C26 40, 12 39, 5 35 C3 25, 3 16, 5 8 Z" />
            </svg>
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M4 20 L9 7 L13 7 L19 20" strokeWidth="3" />
              <path d="M6 16 L16 16" />
            </svg>
          </button>

          <button className="tool" data-tool="heavy" data-label="Heavy charcoal" data-key="3">
            <svg className="tool-bg" viewBox="0 0 42 42">
              <path d="M5 8 C13 5, 30 6, 37 9 C39 18, 39 28, 36 37 C26 40, 12 39, 5 35 C3 25, 3 16, 5 8 Z" />
            </svg>
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M3 20 L9 5 L15 5 L20 20" strokeWidth="4.5" />
              <path d="M5.5 15 L17.5 15" />
            </svg>
          </button>

          <button className="tool" data-tool="pencil" data-label="Fine pencil" data-key="1">
            <svg className="tool-bg" viewBox="0 0 42 42">
              <path d="M5 8 C13 5, 30 6, 37 9 C39 18, 39 28, 36 37 C26 40, 12 39, 5 35 C3 25, 3 16, 5 8 Z" />
            </svg>
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M6 19 L16 4" />
              <path d="M14 6 L18 4 L20 8 L10 22 Z" />
            </svg>
          </button>

          <svg className="tb-sep" viewBox="0 0 24 8" preserveAspectRatio="none">
            <path d="M1 4 C6 3, 18 5, 23 4" />
          </svg>

          <button className="tool" data-tool="smudge" data-label="Smudge" data-key="4">
            <svg className="tool-bg" viewBox="0 0 42 42">
              <path d="M5 8 C13 5, 30 6, 37 9 C39 18, 39 28, 36 37 C26 40, 12 39, 5 35 C3 25, 3 16, 5 8 Z" />
            </svg>
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M5 14 C8 8, 17 8, 19 14 C21 19, 14 21, 12 17" />
              <path d="M8 16 C9 13, 15 12, 16 16" />
            </svg>
          </button>

          <button className="tool" data-tool="eraser" data-label="Eraser" data-key="E">
            <svg className="tool-bg" viewBox="0 0 42 42">
              <path d="M5 8 C13 5, 30 6, 37 9 C39 18, 39 28, 36 37 C26 40, 12 39, 5 35 C3 25, 3 16, 5 8 Z" />
            </svg>
            <svg className="icon" viewBox="0 0 24 24">
              <rect x="4" y="13" width="16" height="7" rx="1" />
              <path d="M8 13 L13 5 L20 9 L15 13" />
            </svg>
          </button>

          <svg className="tb-sep" viewBox="0 0 24 8" preserveAspectRatio="none">
            <path d="M1 4 C6 3, 18 5, 23 4" />
          </svg>

          <button className="tool" data-tool="clear" data-label="Clear marks">
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M5 5 L19 19" />
              <path d="M19 5 L5 19" />
            </svg>
          </button>
        </div>

        <button className="tb-collapse" id="tbCollapse" title="Collapse toolbar">‹</button>
      </div>

      <canvas id="dust" />
      {/* drawOverlay: z-index 10, below toolbar (z-index 1000).
          JS toggles pointer-events: none↔auto to capture draw events.
          Toolbar always wins the hit-test so its buttons always work. */}
      <div id="drawOverlay" />
      <canvas id="drawCanvas" />
      <canvas id="drawFx" />

      {/* SVG filter definitions */}
      <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden="true">
        <defs>
          <filter id="rough" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014 0.02" numOctaves={2} seed={7} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={3.2} xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <filter id="charcoalText" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" numOctaves={2} seed={11} result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale={5} xChannelSelector="R" yChannelSelector="G" result="disp" />
            <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves={3} seed={4} result="grain" />
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.06" result="ga" />
            <feComposite in="disp" in2="ga" operator="out" result="dry" />
            <feMerge><feMergeNode in="dry" /></feMerge>
          </filter>

          <filter id="smudgeDot" x="-80%" y="-80%" width="260%" height="260%">
            <feTurbulence type="fractalNoise" baseFrequency="0.3" numOctaves={2} seed={2} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={9} />
          </filter>
        </defs>
      </svg>
    </>
  )
}

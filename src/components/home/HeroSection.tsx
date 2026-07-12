'use client'

import { useEffect, useRef } from 'react'

/**
 * Home-only hero: the divider rule, figure canvas + headline + lede + CTA,
 * and the font-ready-gated reveal choreography. Nothing here is referenced
 * by id from the canvas engines except #figure and #headline, which only
 * ever exist on this page.
 */
export default function HeroSection() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      await import('@/lib/charcoal')

      const figureEl = document.getElementById('figure') as HTMLCanvasElement | null
      if (!figureEl || !window.Charcoal) return
      const fig = window.Charcoal.FigureCanvas(figureEl)

      // stagger the headline word blooms
      const words = document.querySelectorAll('.headline .w')
      words.forEach((w, i) => {
        ;(w as HTMLElement).style.animationDelay = 0.15 + i * 0.16 + 's'
      })

      let revealed = false
      const heroEl = document.getElementById('homeHero')

      function play() {
        if (revealed) return
        revealed = true
        heroEl?.classList.add('ink')
        setTimeout(() => {
          fig.init(true)
          heroEl?.classList.add('reveal')
        }, 420)
      }

      function settle() {
        if (revealed) return
        revealed = true
        heroEl?.classList.add('ink', 'settled')
        fig.init(false)
      }

      function begin() {
        if (!document.hidden) {
          play()
          return
        }
        document.addEventListener('visibilitychange', function vh() {
          if (!document.hidden) {
            document.removeEventListener('visibilitychange', vh)
            play()
          }
        })
        setTimeout(() => {
          if (!revealed) settle()
        }, 2600)
      }

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(begin)
        setTimeout(begin, 1400)
      } else {
        begin()
      }

      let rt: ReturnType<typeof setTimeout>
      window.addEventListener('resize', () => {
        clearTimeout(rt)
        rt = setTimeout(() => {
          fig.resize()
        }, 220)
      })
    }

    init()
  }, [])

  return (
    <div className="home-hero" id="homeHero">
      <svg className="rule" viewBox="0 0 1500 14" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 8 C 200 4, 360 11, 560 7 S 920 3, 1140 9 S 1380 5, 1498 7" style={{ '--rlen': '1560' } as React.CSSProperties} />
      </svg>

      <div className="hero">
        <div className="figure-wrap">
          <canvas id="figure" aria-hidden="true" />
        </div>

        <div className="hero-text">
          <div className="eyebrow">Founding Engineer &middot; Backend &amp; AI Infrastructure</div>
          <h1 className="headline" id="headline">
            <span className="ln"><span className="w">Backend</span> <span className="w">depth.</span></span>
            <span className="ln"><span className="w accent">Product</span></span>
            <span className="ln"><span className="w">ownership.</span></span>
          </h1>
          <p className="lede">
            I architect backend systems at massive scale, and as founding engineer on Lumen,
            took a product from an <em>empty repository to paying customers</em> — alone.
            If you need someone who can own the whole build, that&apos;s the work I do best.
          </p>
          <div className="cta-row">
            <a className="btn" href="/projects">
              See what I&apos;ve built
              <svg className="ring" viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M14 10 C 70 4, 150 6, 188 12 C 196 26, 194 44, 186 54 C 130 60, 50 58, 12 52 C 4 38, 6 20, 14 10 Z"
                  style={{ '--blen': '640' } as React.CSSProperties}
                />
              </svg>
            </a>
            <a className="link-plain" href="/contact">Let&apos;s talk</a>
          </div>
        </div>
      </div>

      <div className="scroll" aria-hidden="true">
        <span className="stem" /> scroll
      </div>
    </div>
  )
}

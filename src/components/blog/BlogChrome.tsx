'use client'

import { useEffect } from 'react'

/**
 * One small client island that enhances the server-rendered article: reading
 * progress, code copy buttons, active-heading tracking in the TOC, and image
 * lightbox. Deliberately ONE component using event delegation rather than
 * hydrating every code block / image — the article body stays a pure static
 * HTML string, and the JS cost is a single listener set regardless of post size.
 *
 * Everything degrades gracefully: without JS the article is fully readable,
 * code is still highlighted, and the TOC still navigates via anchors.
 */
export default function BlogChrome() {
  useEffect(() => {
    const article = document.getElementById('post-body')
    const bar = document.getElementById('read-progress')

    /* ---- reading progress ---- */
    const onScroll = () => {
      if (!bar || !article) return
      const start = article.offsetTop
      const total = article.offsetHeight - window.innerHeight
      const pct = total <= 0 ? 1 : (window.scrollY - start) / total
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, pct))})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    /* ---- copy buttons (delegated) ---- */
    const onClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement

      const copyBtn = target.closest('.code-copy') as HTMLButtonElement | null
      if (copyBtn) {
        const pre = copyBtn.closest('.code-block')?.querySelector('pre')
        if (!pre) return
        try {
          await navigator.clipboard.writeText(pre.textContent ?? '')
          copyBtn.textContent = 'Copied'
          copyBtn.classList.add('is-copied')
          setTimeout(() => {
            copyBtn.textContent = 'Copy'
            copyBtn.classList.remove('is-copied')
          }, 1600)
        } catch {
          copyBtn.textContent = 'Press ⌘C'
        }
        return
      }

      const linkBtn = target.closest('.copy-link') as HTMLButtonElement | null
      if (linkBtn) {
        try {
          await navigator.clipboard.writeText(window.location.href)
          const label = linkBtn.querySelector('.copy-link-label')
          if (label) {
            label.textContent = 'Link copied'
            setTimeout(() => { label.textContent = 'Copy link' }, 1600)
          }
        } catch { /* clipboard unavailable: the visible URL is still selectable */ }
        return
      }

      /* ---- image lightbox ---- */
      const img = target.closest('.post-figure img') as HTMLImageElement | null
      if (img) {
        const box = document.createElement('div')
        box.className = 'lightbox'
        box.innerHTML = `<img src="${img.src}" alt="${img.alt}" />`
        box.addEventListener('click', () => box.remove())
        document.body.appendChild(box)
        requestAnimationFrame(() => box.classList.add('is-open'))
      }
    }
    document.addEventListener('click', onClick)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') document.querySelector('.lightbox')?.remove()
    }
    document.addEventListener('keydown', onKey)

    /* ---- active heading in the TOC ---- */
    const links = [...document.querySelectorAll<HTMLAnchorElement>('.toc-link')]
    const headings = links
      .map((l) => document.getElementById(decodeURIComponent(l.hash.slice(1))))
      .filter((h): h is HTMLElement => !!h)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          links.forEach((l) => l.classList.remove('is-active'))
          document.querySelector(`.toc-link[href="#${CSS.escape(entry.target.id)}"]`)?.classList.add('is-active')
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    )
    headings.forEach((h) => observer.observe(h))

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
      observer.disconnect()
    }
  }, [])

  return null
}

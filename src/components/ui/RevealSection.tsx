'use client'

import { useEffect, useRef, useState } from 'react'

interface RevealSectionProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section'
  id?: string
}

/**
 * Scroll-into-view ink-in wrapper for below-the-fold content on the 6
 * non-Home pages. Deliberately separate from Home's font-ready-gated load
 * choreography (HeroSection.tsx) — different trigger (IntersectionObserver
 * vs document.fonts.ready), different classes (.reveal-section/.in-view vs
 * .ink/.reveal/.settled), no shared state or timers with it whatsoever.
 */
export default function RevealSection({ children, className, as = 'div', id }: RevealSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Tag = as
  return (
    <Tag
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      id={id}
      className={`reveal-section${inView ? ' in-view' : ''}${className ? ' ' + className : ''}`}
    >
      {children}
    </Tag>
  )
}

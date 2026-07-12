import Link from 'next/link'

interface HandDrawnButtonProps {
  href: string
  children: React.ReactNode
  external?: boolean
  download?: boolean | string
}

/**
 * The hand-drawn-ring button used throughout the site (reuses the existing
 * .btn/.ring styles from the Home CTA, generalized for any destination).
 */
export default function HandDrawnButton({ href, children, external, download }: HandDrawnButtonProps) {
  const ring = (
    <svg className="ring" viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M14 10 C 70 4, 150 6, 188 12 C 196 26, 194 44, 186 54 C 130 60, 50 58, 12 52 C 4 38, 6 20, 14 10 Z"
        style={{ '--blen': '640' } as React.CSSProperties}
      />
    </svg>
  )

  if (external || download) {
    return (
      <a
        className="btn is-drawn"
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        download={download}
      >
        {children}
        {ring}
      </a>
    )
  }

  return (
    <Link className="btn is-drawn" href={href}>
      {children}
      {ring}
    </Link>
  )
}

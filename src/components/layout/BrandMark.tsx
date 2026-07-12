/**
 * Inline KC monogram for site chrome (header). Uses the simplified
 * stroke set (echo passes and charcoal grain vanish below ~48px) and
 * reuses the global #rough filter from SvgFilterDefs instead of
 * embedding its own defs. Master asset: /public/brand/kc-mark.svg
 */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'brand-mark'}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#rough)"
      >
        <path d="M 27 18 C 25.5 35, 26.5 61, 24.5 82" strokeWidth="9" />
        <path d="M 53 20 C 45 30, 39 38, 27.5 50" strokeWidth="8.5" />
        <path d="M 30 48 C 39 58, 48 70, 56 82" strokeWidth="9" />
        <path d="M 84 28 C 74 14, 60 21, 58 40 C 56 54, 57 64, 61 74 C 67 88, 81 83, 86 70" strokeWidth="9" />
      </g>
    </svg>
  )
}

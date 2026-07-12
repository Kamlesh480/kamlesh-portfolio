const variants = [
  'M2 8 C 200 4, 360 11, 560 7 S 920 3, 1140 9 S 1380 5, 1498 7',
  'M2 6 C 220 10, 340 3, 560 8 S 900 10, 1140 5 S 1360 9, 1498 6',
  'M2 9 C 210 5, 350 10, 560 6 S 910 4, 1140 8 S 1370 6, 1498 8',
]

interface InkRuleProps {
  /** Picks a fixed path variant (0-2) — deterministic, no randomness at render. */
  variant?: 0 | 1 | 2
}

/** Static hand-drawn divider for content pages — always drawn-in, no load
 * animation (that's reserved for Home's `.rule`, a separate CSS class). */
export default function InkRule({ variant = 0 }: InkRuleProps) {
  return (
    <svg className="ink-rule" viewBox="0 0 1500 14" preserveAspectRatio="none" aria-hidden="true">
      <path d={variants[variant]} />
    </svg>
  )
}

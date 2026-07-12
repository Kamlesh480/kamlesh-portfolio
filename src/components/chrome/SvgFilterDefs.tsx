/**
 * Hand-drawn filter definitions used throughout the charcoal design system
 * via `filter: url(#rough)` etc. in globals.css. Rendered once, globally,
 * by SiteChrome — every page and primitive on the site depends on these
 * three ids existing exactly once in the DOM.
 */
export default function SvgFilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
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
  )
}

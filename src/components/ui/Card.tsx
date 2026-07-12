interface CardProps {
  children: React.ReactNode
  className?: string
}

/**
 * A rough-bordered card — the same "stretchy hand-drawn frame" technique
 * used by the toolbar buttons (.tool-bg/.mt-bg): an SVG path with
 * preserveAspectRatio="none" stretched to fill the card regardless of its
 * actual content size, so the frame always looks freshly drawn.
 */
export default function Card({ children, className }: CardProps) {
  return (
    <div className={`card${className ? ' ' + className : ''}`}>
      {/* preserveAspectRatio="none" stretches the viewBox non-uniformly to fill
          whatever size the card actually renders at (often much wider than
          tall). Without vectorEffect="non-scaling-stroke", that non-uniform
          stretch also distorts the stroke itself — vertical-ish segments pick
          up the (usually much larger) horizontal scale factor and render far
          thicker than the horizontal segments. non-scaling-stroke keeps the
          drawn line a constant screen-pixel width regardless of that stretch. */}
      <svg className="card-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M2 4 C 40 1, 75 3, 98 5 C 99 40, 99 70, 97 96 C 60 99, 25 98, 3 95 C 1 60, 1 30, 2 4 Z"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="card-content">{children}</div>
    </div>
  )
}

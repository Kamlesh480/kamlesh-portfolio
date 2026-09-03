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
          stretch also distorts the stroke itself: vertical-ish segments pick
          up the (usually much larger) horizontal scale factor and render far
          thicker than the horizontal segments. non-scaling-stroke keeps the
          drawn line a constant screen-pixel width regardless of that stretch. */}
      {/* Top/bottom edges hug the border tightly (≈1.5% inset) on purpose:
          preserveAspectRatio="none" scales any vertical waviness by the card's
          height, so a wavier top edge dips proportionally deeper into the
          content and collides with the title on tall cards. The #rough filter
          still supplies the hand-drawn wobble, so near-straight geometry here
          still reads as a sketched frame. */}
      <svg className="card-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M1.5 1.6 C 30 0.8, 70 1, 98.5 1.6 C 99.2 30, 99.2 70, 98.5 98.4 C 70 99.2, 30 99, 1.5 98.4 C 0.8 70, 0.8 30, 1.5 1.6 Z"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="card-content">{children}</div>
    </div>
  )
}

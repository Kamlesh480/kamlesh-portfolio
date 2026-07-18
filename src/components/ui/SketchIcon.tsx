export type SketchIconName =
  | 'server'
  | 'spark'
  | 'layers'
  | 'cloud'
  | 'pipeline'
  | 'pencil'

/**
 * Hand-drawn icon set in the charcoal language: single-stroke sketches,
 * roughened by the global #rough filter (styled via .sketch-icon in
 * globals.css — stroke: currentColor). Sized by the parent via width/height
 * or a wrapper class like .capability-icon.
 */
const paths: Record<SketchIconName, React.ReactNode> = {
  // database cylinder — backend & data platforms
  server: (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5 C 4.3 10, 4.4 14, 4.5 18.5 C 4.5 20.4, 8 21.8, 12 21.8 C 16 21.8, 19.5 20.4, 19.5 18.5 C 19.6 14, 19.7 10, 19.5 5.5" />
      <path d="M4.5 12 C 6 13.8, 18 13.8, 19.5 12" />
    </>
  ),
  // energy bolt in a burst — AI / LLM infrastructure
  spark: (
    <>
      <path d="M13.5 3 L 8 13 L 11.5 13 L 10.5 21 L 16.5 10.5 L 12.8 10.5 Z" />
      <path d="M4.5 6.5 L 6.2 8" />
      <path d="M19.8 16 L 18.2 14.8" />
      <path d="M18.5 4.5 L 17 6.2" />
    </>
  ),
  // stacked planes — full-stack product
  layers: (
    <>
      <path d="M12 3.5 L 21 8 L 12 12.5 L 3 8 Z" />
      <path d="M4.5 12.2 L 12 16 L 19.5 12.2" />
      <path d="M4.5 16.2 L 12 20 L 19.5 16.2" />
    </>
  ),
  // cloud with base line — cloud & devops
  cloud: (
    <>
      <path d="M6.5 17.5 C 3.8 17.5, 2.5 15.4, 2.8 13.5 C 3.1 11.7, 4.6 10.7, 6.2 10.8 C 6.5 7.8, 9 6, 11.8 6.2 C 14.4 6.4, 16.4 8.2, 16.8 10.6 C 19 10.5, 21 12, 21.1 14 C 21.2 16, 19.6 17.5, 17.4 17.5 Z" />
      <path d="M7.5 21 L 16.5 21" />
    </>
  ),
  // flowing pipeline — data pipelines
  pipeline: (
    <>
      <circle cx="4.5" cy="6" r="2.2" />
      <circle cx="19.5" cy="12" r="2.2" />
      <circle cx="4.5" cy="18" r="2.2" />
      <path d="M6.7 6 C 12 6, 13 12, 17.3 12" />
      <path d="M17.3 12 C 13 12, 12 18, 6.7 18" />
    </>
  ),
  // pencil — writing / drawing
  pencil: (
    <>
      <path d="M5 19 L 6.2 15 L 16.5 4.5 L 19.5 7.5 L 9 18 Z" />
      <path d="M14.8 6.2 L 17.8 9.2" />
    </>
  ),
}

export default function SketchIcon({
  name,
  className,
}: {
  name: SketchIconName
  className?: string
}) {
  return (
    <svg
      className={`sketch-icon${className ? ' ' + className : ''}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}

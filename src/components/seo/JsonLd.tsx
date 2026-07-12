/**
 * Renders a JSON-LD structured-data block as a Server Component. Escapes
 * `<` in the serialized JSON so a string field can never prematurely close
 * the <script> tag (JSON.stringify does not escape it by default) — the
 * standard mitigation for inline structured data. No `next/script` here:
 * that component controls *loading strategy* for external/behavioral
 * scripts, which is irrelevant for static inline JSON with no network cost.
 */
export default function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}

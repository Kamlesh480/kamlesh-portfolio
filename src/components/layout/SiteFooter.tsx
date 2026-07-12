import Link from 'next/link'
import { footerRoutes } from '@/lib/routes'

export default function SiteFooter() {
  return (
    <footer className="site-foot page-shell">
      <nav className="foot-sitemap" aria-label="Footer">
        {footerRoutes.map((route) => (
          <Link key={route.path} href={route.path} className="foot-link">
            {route.label}
          </Link>
        ))}
      </nav>

      <div className="foot">
        <div className="signature">Kamlesh</div>
        <div className="meta">
          No.&nbsp;01 — Charcoal on paper
          <br />
          Studio&nbsp;&middot;&nbsp;MMXXVI
        </div>
      </div>
    </footer>
  )
}

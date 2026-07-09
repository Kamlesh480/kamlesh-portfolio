import type { Metadata } from 'next'
import { Caveat, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-caveat',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kamlesh — Charcoal',
  description: 'Charcoal & Graphite — Figurative Work',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  )
}

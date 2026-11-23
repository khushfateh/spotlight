import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/layout/AppShell'

const cormorant = Cormorant_Garamond({
  subsets:  ['latin'],
  weight:   ['300', '400', '500'],
  display:  'swap',
  variable: '--font-cormorant',
})

export const metadata: Metadata = {
  title: 'SPOTLIGHT – The Private Market for Cultural Icons',
  description: 'Discover and back the next generation of cultural icons. The private market where talent meets capital.',
  keywords: ['creator economy', 'cultural investing', 'music', 'emerging talent', 'cultural icons'],
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cormorant.variable}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}

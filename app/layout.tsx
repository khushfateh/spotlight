import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppShell from '@/components/layout/AppShell'

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
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}

'use client'

import dynamic from 'next/dynamic'
import SaxophoneHero from '@/components/experience/emergent/SaxophoneHero'
import HomeFeed from '@/components/home/HomeFeed'

// Both canvases are browser-only
const GlobalSparkles = dynamic(
  () => import('@/components/experience/emergent/GlobalSparkles'),
  { ssr: false },
)

export default function RootPage() {
  return (
    <>
      {/* Fixed starfield — sits behind ALL page content, cursor-responsive everywhere */}
      <GlobalSparkles />

      {/* Cinematic hero */}
      <SaxophoneHero />

      {/* Transition bridge: overlaps the hero's bottom gradient, fades into HomeFeed */}
      <div style={{ position: 'relative', marginTop: '-80px', zIndex: 5 }}>
        {/* Dark curtain from above — pulls the hero fade through into HomeFeed */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            background: 'linear-gradient(to bottom, #050505, transparent)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
        <HomeFeed />
      </div>
    </>
  )
}

'use client'

import dynamic from 'next/dynamic'
import SaxophoneHero from '@/components/experience/emergent/SaxophoneHero'
import HomeFeed from '@/components/home/HomeFeed'

const GlobalSparkles = dynamic(
  () => import('@/components/experience/emergent/GlobalSparkles'),
  { ssr: false },
)

export default function RootPage() {
  return (
    <>
      {/* Fixed starfield behind everything — cursor-responsive on any page area */}
      <GlobalSparkles />

      {/* Hero sits on top of the page stack */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <SaxophoneHero />
      </div>

      {/*
        HomeFeed slides 320px under the hero.
        The bridge gradient covers the exposed top of HomeFeed,
        pulling it flush with the hero's black before revealing content.
      */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: '-320px' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            bottom: 'auto',
            height: 380,
            background:
              'linear-gradient(to bottom, #050505 0%, #050505 45%, rgba(5,5,5,0.85) 65%, rgba(5,5,5,0.4) 85%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
        <HomeFeed />
      </div>
    </>
  )
}

'use client'

import dynamic from 'next/dynamic'
import FixedBackground from '@/components/experience/emergent/FixedBackground'
import SaxophoneHero from '@/components/experience/emergent/SaxophoneHero'
import CinematicHome from '@/components/experience/emergent/CinematicHome'

// Layer 1: cursor-responsive sparkle field (WebGL — browser only)
const GlobalSparkles = dynamic(
  () => import('@/components/experience/emergent/GlobalSparkles'),
  { ssr: false },
)

export default function RootPage() {
  return (
    <>
      {/*
        ┌─────────────────────────────────────────────────────┐
        │  L0  FixedBackground  z:0   persistent gold glows   │
        │  L1  GlobalSparkles   z:-1  sparkle field, fixed    │
        │  L2  SaxophoneHero    z:10  3-D hero, 100svh        │
        │  L3  CinematicHome    flow  glass sections, no bg   │
        │  L4  body::before     z:9995  film grain (CSS)      │
        └─────────────────────────────────────────────────────┘
        CinematicHome has no background-color anywhere.
        Sparkles (L1) and gold glows (L0) show through the
        glass cards. One dark world, top to bottom.
      */}

      {/* L0: persistent ambient canvas */}
      <FixedBackground />

      {/* L1: full-page starfield */}
      <GlobalSparkles />

      {/* L2: saxophone hero — has its own #050505 bg + 3D sparkles */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <SaxophoneHero />
      </div>

      {/* L3: cinematic content — slight overlap with hero bottom gradient */}
      <div style={{ marginTop: '-60px', position: 'relative' }}>
        <CinematicHome />
      </div>
    </>
  )
}

'use client'

import dynamic from 'next/dynamic'
import FixedBackground from '@/components/experience/emergent/FixedBackground'
import ScrollContent from '@/components/experience/emergent/ScrollContent'

// WebGL components — browser only, no SSR
const GlobalSparkles = dynamic(
  () => import('@/components/experience/emergent/GlobalSparkles'),
  { ssr: false },
)
const StickyScene = dynamic(
  () => import('@/components/experience/emergent/StickyScene'),
  { ssr: false },
)

export default function RootPage() {
  return (
    <>
      {/*
        Layer stack (back → front):
          body bg  #0A0A0A
          L0  FixedBackground   z:0    fixed gold ambient glows
          L1  GlobalSparkles    z:-1   full-page sparkle field (fixed)
          L2  StickyScene       z:2    sticky 3D canvas — saxophone + dust
          L3  ScrollContent     z:5    all content, scrolls over canvas
          L4  body::before      z:9995 film grain (CSS)
      */}

      {/* L0 */}
      <FixedBackground />

      {/* L1 */}
      <GlobalSparkles />

      {/* L2 — sticky: stays at top:0 for the full scroll journey */}
      <StickyScene />

      {/* L3 — content starts at the same visual Y as the canvas via -100svh margin */}
      <div style={{ marginTop: '-100svh', position: 'relative', zIndex: 5 }}>
        <ScrollContent />
      </div>
    </>
  )
}

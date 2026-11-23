'use client'

import dynamic from 'next/dynamic'

const HomeScene = dynamic(
  () => import('@/components/experience/exhibition/HomeScene'),
  { ssr: false },
)

export default function RootPage() {
  return (
    <>
      {/* The exhibition — sticky 3D canvas occupying 100svh.
          Scroll spacer drives orbit rotation via homeState.scrollProgress. */}
      <HomeScene />

      {/* 500vh of scrollable space — scroll listeners map
          scrollY to orbit angle and storytelling sections. */}
      <div aria-hidden style={{ height: '500vh', pointerEvents: 'none' }} />
    </>
  )
}

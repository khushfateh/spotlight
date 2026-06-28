'use client'

import { useReducedMotionSafe } from '@/lib/motion/useReducedMotionSafe'

// Lightweight ambient haze — five blurred blobs drifting slowly.
// Complements SpotlightParticles without adding canvas overhead.
// Uses CSS animations + blur only.

const BLOBS = [
  { w: 240, color: 'rgba(201,168,76,0.025)', l: '8%',  t: '12%', dur: 14, delay: 0 },
  { w: 180, color: 'rgba(107,33,168,0.02)',  l: '62%', t: '28%', dur: 11, delay: 2 },
  { w: 300, color: 'rgba(201,168,76,0.018)', l: '35%', t: '55%', dur: 17, delay: 5 },
  { w: 160, color: 'rgba(29,78,216,0.02)',   l: '75%', t: '70%', dur: 13, delay: 1 },
  { w: 200, color: 'rgba(201,168,76,0.02)',  l: '20%', t: '80%', dur: 15, delay: 3.5 },
]

export function FloatingField() {
  const reduced = useReducedMotionSafe()

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.w,
            height: b.w,
            left: b.l,
            top: b.t,
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animation: reduced ? 'none' : `float-slow ${b.dur}s ease-in-out infinite alternate`,
            animationDelay: `${b.delay}s`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}

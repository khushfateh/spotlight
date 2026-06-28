'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotionSafe } from '@/lib/motion/useReducedMotionSafe'

// A soft champagne-gold spotlight that follows the cursor within its container.
// Uses direct DOM manipulation + lerp for zero-overhead smooth tracking.
// On mobile: static gold bloom centred on the container.
export function SpotlightBeam({
  className,
  intensity = 1,
}: {
  className?: string
  intensity?: number   // 0.5 = subtle, 1 = default, 1.5 = strong
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotionSafe()

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return

    // Check touch device — no cursor tracking needed
    const isTouch = !window.matchMedia('(hover: hover)').matches
    if (isTouch) return

    let tx = 50, ty = 40
    let cx = 50, cy = 40
    let rafId: number

    const alpha = 0.12 * intensity
    const alpha2 = 0.04 * intensity

    const onMove = (e: MouseEvent) => {
      const rect = el.parentElement?.getBoundingClientRect()
      if (!rect) return
      tx = ((e.clientX - rect.left) / rect.width) * 100
      ty = ((e.clientY - rect.top) / rect.height) * 100
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    function tick() {
      cx = lerp(cx, tx, 0.05)
      cy = lerp(cy, ty, 0.05)
      el!.style.background = `radial-gradient(ellipse 50% 40% at ${cx}% ${cy}%, rgba(201,168,76,${alpha}) 0%, rgba(201,168,76,${alpha2}) 45%, transparent 70%)`
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [reduced, intensity])

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className ?? ''}`}
      style={{
        background: `radial-gradient(ellipse 50% 40% at 50% 40%, rgba(201,168,76,${0.08 * intensity}) 0%, rgba(201,168,76,${0.025 * intensity}) 45%, transparent 70%)`,
      }}
    />
  )
}

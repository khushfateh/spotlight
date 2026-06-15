'use client'

import { useEffect, useRef } from 'react'

// The brand signature: a soft gold spotlight that follows your cursor.
// Uses RAF lerp (not Framer Motion) for zero-overhead performance.
// Desktop only — activates when a pointer device is available.
export function SpotlightCursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia('(hover: hover)').matches) return

    let tx = -500, ty = -500
    let cx = -500, cy = -500
    let rafId: number
    const node = el

    function onMove(e: MouseEvent) {
      tx = e.clientX
      ty = e.clientY
    }

    function frame() {
      cx += (tx - cx) * 0.072
      cy += (ty - cy) * 0.072
      node.style.background = `radial-gradient(circle 440px at ${cx}px ${cy}px, rgba(201,168,76,0.068) 0%, rgba(201,168,76,0.02) 40%, transparent 70%)`
      rafId = requestAnimationFrame(frame)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    rafId = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[55] mix-blend-screen"
    />
  )
}

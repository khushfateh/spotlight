'use client'

import { useEffect, useRef } from 'react'

// Subtle ambient gold glow that follows the cursor — no visible icon.
// Desktop only.
export function SpotlightCursor() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return

    let tx = -500, ty = -500
    let gx = -500, gy = -500
    let rafId: number
    const glow = glowRef.current

    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY }

    function frame() {
      gx += (tx - gx) * 0.055
      gy += (ty - gy) * 0.055
      if (glow) {
        glow.style.background = `radial-gradient(circle 400px at ${gx}px ${gy}px, rgba(201,168,76,0.058) 0%, rgba(201,168,76,0.014) 45%, transparent 70%)`
      }
      rafId = requestAnimationFrame(frame)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    rafId = requestAnimationFrame(frame)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(rafId) }
  }, [])

  return (
    <div ref={glowRef} aria-hidden className="pointer-events-none fixed inset-0 z-[53] mix-blend-screen" />
  )
}

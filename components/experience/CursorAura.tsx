'use client'

import { useEffect, useRef } from 'react'

// Premium dual-ring cursor aura.
// — Primary: large soft gold glow (slow lerp, mix-blend: screen)
// — Secondary: precise 40px ring that tracks tightly; expands on hover
// Desktop only. Respects prefers-reduced-motion.
export function CursorAura() {
  const glowRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch = !window.matchMedia('(hover: hover)').matches
    if (isTouch) return

    let tx = -600, ty = -600
    // Primary glow: slow follow
    let gx = -600, gy = -600
    // Ring: medium follow
    let rx = -600, ry = -600

    let isHovering = false
    let rafId: number
    const glow = glowRef.current
    const ring = ringRef.current

    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY }

    // Detect when cursor is over an interactive element
    const onEnter = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.closest('button, a, [role="button"], input, select, textarea, label')) {
        isHovering = true
      }
    }
    const onLeave = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.closest('button, a, [role="button"], input, select, textarea, label')) {
        isHovering = false
      }
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    function frame() {
      if (prefersReduced) {
        // Still track but skip animation
        gx = tx; gy = ty; rx = tx; ry = ty
      } else {
        gx = lerp(gx, tx, 0.04)
        gy = lerp(gy, ty, 0.04)
        rx = lerp(rx, tx, 0.12)
        ry = lerp(ry, ty, 0.12)
      }

      if (glow) {
        glow.style.background = `radial-gradient(circle 420px at ${gx}px ${gy}px, rgba(201,168,76,0.065) 0%, rgba(201,168,76,0.018) 50%, transparent 72%)`
      }

      if (ring) {
        const size = isHovering ? 56 : 36
        ring.style.width = `${size}px`
        ring.style.height = `${size}px`
        ring.style.transform = `translate(${rx - size / 2}px, ${ry - size / 2}px)`
        ring.style.borderColor = isHovering
          ? 'rgba(201,168,76,0.55)'
          : 'rgba(255,255,255,0.16)'
        ring.style.boxShadow = isHovering
          ? '0 0 12px rgba(201,168,76,0.3), inset 0 0 8px rgba(201,168,76,0.12)'
          : 'none'
      }

      rafId = requestAnimationFrame(frame)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onEnter, { passive: true })
    document.addEventListener('mouseout', onLeave, { passive: true })
    rafId = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onEnter)
      document.removeEventListener('mouseout', onLeave)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      {/* Primary: large ambient glow */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[52] mix-blend-screen"
        style={{ transition: 'none' }}
      />
      {/* Secondary: precision ring */}
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed z-[53] rounded-full"
        style={{
          top: 0, left: 0,
          width: 36, height: 36,
          border: '1px solid rgba(255,255,255,0.16)',
          transition: 'width 0.25s cubic-bezier(0.34,1.56,0.64,1), height 0.25s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s ease, box-shadow 0.2s ease',
          willChange: 'transform',
          mixBlendMode: 'screen',
        }}
      />
    </>
  )
}

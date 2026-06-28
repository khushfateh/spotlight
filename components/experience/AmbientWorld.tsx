'use client'

import { useEffect, useRef } from 'react'

// Layered ambient background world.
// Three drift layers of colored light + a scan-line overlay.
// All CSS-driven, GPU transform-only — zero layout thrash.
export function AmbientWorld() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* ── Depth layer 1: gold dome (top) ──────────────────────────── */}
      <div
        className="aurora-orb-1 absolute"
        style={{
          width: 1000, height: 1000,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.55) 0%, rgba(201,168,76,0.12) 40%, transparent 70%)',
          filter: 'blur(140px)',
          top: '-30%', left: '20%',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Depth layer 2: purple (bottom-right) ─────────────────────── */}
      <div
        className="aurora-orb-2 absolute"
        style={{
          width: 800, height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107,33,168,0.55) 0%, rgba(107,33,168,0.08) 50%, transparent 70%)',
          filter: 'blur(150px)',
          bottom: '0%', right: '-20%',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Depth layer 3: indigo (mid-left) ─────────────────────────── */}
      <div
        className="aurora-orb-3 absolute"
        style={{
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,78,216,0.4) 0%, transparent 65%)',
          filter: 'blur(130px)',
          top: '35%', left: '-18%',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Depth layer 4: subtle teal accent (mid-right) ─────────────── */}
      <div
        className="aurora-orb-1 absolute"
        style={{
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15,118,110,0.22) 0%, transparent 70%)',
          filter: 'blur(120px)',
          top: '55%', right: '5%',
          animationDelay: '-8s',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Horizontal scan lines (subtle depth texture) ──────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.012) 2px,
            rgba(255,255,255,0.012) 3px
          )`,
          pointerEvents: 'none',
        }}
      />

      {/* ── Vignette darkening edges ──────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 95% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)',
        }}
      />
    </div>
  )
}

// A vertical scan sweep that moves slowly top to bottom — cinematic feel
export function ScanSweep() {
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let pos = -5
    let rafId: number
    const el = lineRef.current

    function tick() {
      pos += 0.015
      if (pos > 105) pos = -5
      if (el) el.style.transform = `translateY(${pos}vh)`
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div
      ref={lineRef}
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 z-[1]"
      style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.06) 30%, rgba(201,168,76,0.12) 50%, rgba(201,168,76,0.06) 70%, transparent 100%)',
        willChange: 'transform',
      }}
    />
  )
}

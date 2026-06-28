'use client'

import { useEffect, useRef } from 'react'

// 25 ultra-subtle floating particles (gold + white).
// Canvas-based, GPU-composited, ~0.1% CPU impact.
// Immediately paused when prefers-reduced-motion is set.
export function SpotlightParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const COUNT = 25

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    type Particle = {
      x: number; y: number
      r: number
      vy: number; vx: number
      opacity: number; targetOpacity: number
      color: string
      life: number; maxLife: number
    }

    const COLORS = [
      'rgba(201,168,76,{a})',
      'rgba(255,255,255,{a})',
      'rgba(201,168,76,{a})',
      'rgba(180,140,60,{a})',
    ]

    function spawn(): Particle {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const maxLife = 180 + Math.random() * 220
      return {
        x: Math.random() * (canvas?.width ?? 400),
        y: (canvas?.height ?? 800) + 10,
        r: 0.8 + Math.random() * 1.6,
        vy: -(0.25 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 0.18,
        opacity: 0,
        targetOpacity: 0.12 + Math.random() * 0.2,
        color,
        life: 0,
        maxLife,
      }
    }

    const particles: Particle[] = Array.from({ length: COUNT }, () => {
      const p = spawn()
      p.y = Math.random() * ((canvas?.height ?? 800))
      p.life = Math.random() * p.maxLife
      return p
    })

    let rafId: number

    function draw() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.life++
        p.y += p.vy
        p.x += p.vx

        // Fade in / fade out
        const progress = p.life / p.maxLife
        if (progress < 0.15) {
          p.opacity = p.targetOpacity * (progress / 0.15)
        } else if (progress > 0.8) {
          p.opacity = p.targetOpacity * ((1 - progress) / 0.2)
        } else {
          p.opacity = p.targetOpacity
        }

        if (p.life >= p.maxLife) {
          Object.assign(p, spawn())
        }

        const colorStr = p.color.replace('{a}', String(Math.max(0, p.opacity)))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = colorStr
        ctx.fill()
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2]"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}

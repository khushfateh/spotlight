'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  spin: number
  life: number
  maxLife: number
}

// Draw a 4-pointed star (✦ shape) centred at origin.
function drawStar(ctx: CanvasRenderingContext2D, size: number, alpha: number) {
  const outer = size
  const inner = size * 0.22
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2
    const r = i % 2 === 0 ? outer : inner
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, outer)
  grad.addColorStop(0,   `rgba(255, 245, 190, ${alpha})`)
  grad.addColorStop(0.4, `rgba(201, 168, 76,  ${alpha * 0.85})`)
  grad.addColorStop(1,   `rgba(201, 168, 76,  0)`)
  ctx.fillStyle = grad
  ctx.fill()

  // Tiny glow ring around the star centre
  ctx.beginPath()
  ctx.arc(0, 0, outer * 0.55, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255, 250, 210, ${alpha * 0.35})`
  ctx.fill()
}

export function SparkleTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      canvas!.width  = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    let mx = -999, my = -999
    let lastMx = -999, lastMy = -999
    let lastSpawn = 0
    let rafId: number
    const particles: Particle[] = []

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }

    function spawn() {
      const angle  = Math.random() * Math.PI * 2
      const speed  = 0.4 + Math.random() * 1.2
      const maxLife = 45 + Math.random() * 35
      particles.push({
        x:       mx + (Math.random() - 0.5) * 14,
        y:       my + (Math.random() - 0.5) * 14,
        vx:      Math.cos(angle) * speed * 0.5,
        vy:      Math.sin(angle) * speed - 0.9,   // biased upward
        size:    2.5 + Math.random() * 4.5,
        rotation: Math.random() * Math.PI * 2,
        spin:    (Math.random() - 0.5) * 0.18,
        life:    0,
        maxLife,
      })
    }

    function frame(now: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      // Spawn when cursor is moving
      const moved = Math.hypot(mx - lastMx, my - lastMy) > 1.5
      if (moved && now - lastSpawn > 22) {
        const count = 2 + (Math.random() > 0.45 ? 1 : 0)
        for (let i = 0; i < count; i++) spawn()
        lastSpawn = now
        lastMx = mx
        lastMy = my
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x  += p.vx
        p.y  += p.vy
        p.vy += 0.032     // gentle gravity
        p.vx *= 0.97      // air drag
        p.rotation += p.spin

        const t = p.life / p.maxLife
        // Fast fade-in, then smooth fade-out
        const alpha = t < 0.15
          ? t / 0.15
          : 1 - ((t - 0.15) / 0.85)

        if (p.life >= p.maxLife) { particles.splice(i, 1); continue }

        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.rotation)
        drawStar(ctx!, p.size, alpha * 0.9)
        ctx!.restore()
      }

      rafId = requestAnimationFrame(frame)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    rafId = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 9996, mixBlendMode: 'screen' }}
    />
  )
}

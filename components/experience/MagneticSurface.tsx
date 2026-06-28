'use client'

import { useRef, type ReactNode, type CSSProperties } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useTouchDevice, useReducedMotionSafe } from '@/lib/motion/useReducedMotionSafe'

// Wraps children with:
//  - Magnetic pull (element shifts slightly toward cursor) — desktop only
//  - 3D tilt based on cursor position — desktop only
//  - Smooth spring return on mouse leave
//  - On mobile/touch: just a tap scale, no translate/tilt

type Props = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  strength?: number   // magnetic translation multiplier (0–1), default 0.28
  tiltMax?: number    // max tilt in degrees, default 5
  disabled?: boolean
}

export function MagneticSurface({
  children,
  className,
  style,
  strength = 0.28,
  tiltMax = 5,
  disabled = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isTouch = useTouchDevice()
  const reduced = useReducedMotionSafe()

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const nx = useMotionValue(0) // normalised -0.5..0.5
  const ny = useMotionValue(0)

  const cfg = { stiffness: 240, damping: 22 }
  const sx = useSpring(mx, cfg)
  const sy = useSpring(my, cfg)
  const snx = useSpring(nx, cfg)
  const sny = useSpring(ny, cfg)

  const rotateX = useTransform(sny, [-0.5, 0.5], [tiltMax, -tiltMax])
  const rotateY = useTransform(snx, [-0.5, 0.5], [-tiltMax, tiltMax])

  if (disabled || reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  // On touch devices: skip translate + tilt, just do whileTap scale
  if (isTouch) {
    return (
      <motion.div
        whileTap={{ scale: 0.97 }}
        className={className}
        style={style}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={ref}
      style={{
        x: sx,
        y: sy,
        rotateX,
        rotateY,
        transformPerspective: 700,
        willChange: 'transform',
        ...style,
      }}
      className={className}
      onMouseMove={e => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const cx = rect.width / 2
        const cy = rect.height / 2
        const dx = e.clientX - rect.left - cx
        const dy = e.clientY - rect.top - cy
        mx.set(dx * strength)
        my.set(dy * strength)
        nx.set((e.clientX - rect.left) / rect.width - 0.5)
        ny.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onMouseLeave={() => {
        mx.set(0); my.set(0); nx.set(0); ny.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

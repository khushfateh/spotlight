'use client'

import { useRef, type ReactNode, type CSSProperties } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useReducedMotionSafe } from '@/lib/motion/useReducedMotionSafe'
import { depthDrift } from '@/lib/motion/easing'

// Scroll-driven parallax wrapper.
// depth 0.06 = subtle, 0.18 = noticeable. Used on sections and hero layers.
export function DepthLayer({
  children,
  depth = 0.08,
  className,
  style,
  as: Tag = 'div',
}: {
  children: ReactNode
  depth?: number
  className?: string
  style?: CSSProperties
  as?: 'div' | 'section'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotionSafe()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const raw = useTransform(scrollYProgress, [0, 1], [depth * 60, -depth * 60])
  const y = useSpring(raw, depthDrift)

  if (reduced) {
    return Tag === 'section'
      ? <section ref={ref} className={className} style={style}>{children}</section>
      : <div ref={ref} className={className} style={style}>{children}</div>
  }

  return Tag === 'section'
    ? (
      <motion.section
        ref={ref as React.RefObject<HTMLElement>}
        style={{ y, ...style }}
        className={className}
      >
        {children}
      </motion.section>
    )
    : (
      <motion.div
        ref={ref}
        style={{ y, ...style }}
        className={className}
      >
        {children}
      </motion.div>
    )
}

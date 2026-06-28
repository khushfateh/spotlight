'use client'

import { useRef } from 'react'
import { useScroll, useTransform, useSpring } from 'framer-motion'
import { depthDrift } from './easing'

// Returns a ref + spring y-offset driven by how far the element has scrolled
// through the viewport. depth=0.1 → ±6px at default, depth=0.3 → ±18px.
export function useParallaxDepth(depth = 0.1) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const raw = useTransform(scrollYProgress, [0, 1], [depth * 60, -depth * 60])
  const y = useSpring(raw, depthDrift)
  return { ref, y }
}

// Simpler version — offsets a child relative to a parent ref's scroll progress.
export function useScrollReveal(once = false) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.92', 'start 0.4'],
  })
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1]),
    { stiffness: 60, damping: 20 }
  )
  const y = useSpring(
    useTransform(scrollYProgress, [0, 1], [32, 0]),
    { stiffness: 60, damping: 20 }
  )
  return { ref, opacity, y }
}

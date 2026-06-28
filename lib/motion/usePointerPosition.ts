'use client'

import { useEffect } from 'react'
import { useMotionValue, type MotionValue } from 'framer-motion'

export type PointerPosition = {
  x: MotionValue<number>
  y: MotionValue<number>
}

// Returns MotionValues for the current pointer/touch position.
// Single global listener — safe to call from multiple components.
export function usePointerPosition(): PointerPosition {
  const x = useMotionValue(-600)
  const y = useMotionValue(-600)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const onTouch = (e: TouchEvent) => {
      x.set(e.touches[0].clientX)
      y.set(e.touches[0].clientY)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [x, y])

  return { x, y }
}

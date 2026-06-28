'use client'

import { useEffect, useState } from 'react'

// SSR-safe hook that reads prefers-reduced-motion and reacts to changes.
export function useReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}

// SSR-safe hook that detects a touch-primary device (no hover).
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    setIsTouch(!window.matchMedia('(hover: hover)').matches)
  }, [])
  return isTouch
}

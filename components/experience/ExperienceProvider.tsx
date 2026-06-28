'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useMotionValue, type MotionValue } from 'framer-motion'

type ExperienceState = {
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
  reducedMotion: boolean
  isTouch: boolean
}

const ExperienceCtx = createContext<ExperienceState | null>(null)

// Central context for the global experience layer.
// Provides shared pointer MotionValues so components don't each add listeners.
export function ExperienceProvider({ children }: { children: ReactNode }) {
  const pointerX = useMotionValue(-600)
  const pointerY = useMotionValue(-600)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    setIsTouch(!window.matchMedia('(hover: hover)').matches)

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)

    if (!mq.matches) {
      const onMove = (e: MouseEvent) => {
        pointerX.set(e.clientX)
        pointerY.set(e.clientY)
      }
      window.addEventListener('mousemove', onMove, { passive: true })
      return () => {
        mq.removeEventListener('change', handler)
        window.removeEventListener('mousemove', onMove)
      }
    }
    return () => mq.removeEventListener('change', handler)
  }, [pointerX, pointerY])

  return (
    <ExperienceCtx.Provider value={{ pointerX, pointerY, reducedMotion, isTouch }}>
      {children}
    </ExperienceCtx.Provider>
  )
}

export function useExperience() {
  const ctx = useContext(ExperienceCtx)
  if (!ctx) throw new Error('useExperience must be inside ExperienceProvider')
  return ctx
}

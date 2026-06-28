'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'
import { premiumEase } from '@/lib/motion/easing'

// Smooth blur-fade transition for swapping between Home states
// (loading → content, empty → populated, etc.).
// Wrap different state branches and pass a unique id for each.

export function SceneTransition({
  children,
  id,
  className,
}: {
  children: ReactNode
  id: string
  className?: string
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={id}
        initial={{ opacity: 0, filter: 'blur(10px)', y: 12 }}
        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        exit={{ opacity: 0, filter: 'blur(6px)', y: -8 }}
        transition={{ duration: 0.38, ease: premiumEase }}
        style={{ willChange: 'opacity, filter, transform' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

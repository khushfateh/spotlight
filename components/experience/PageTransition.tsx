'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// Cinematic route transition wrapper.
// Combines: blur out → gold sweep → blur in.
// Used in app/template.tsx — remounts on every navigation.

const ease = [0.16, 1, 0.3, 1] as const

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(6px)', y: 8 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.45, ease }}
      style={{ willChange: 'opacity, filter, transform' }}
    >
      {/* Gold sweep bar — exits as content enters */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[9000]"
        initial={{ scaleX: 1, transformOrigin: 'left center' }}
        animate={{ scaleX: 0, transformOrigin: 'right center' }}
        transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1], delay: 0.05 }}
        style={{
          background: 'linear-gradient(90deg, #0A0A0A 0%, rgba(201,168,76,0.04) 40%, rgba(201,168,76,0.08) 60%, #0A0A0A 100%)',
        }}
      />
      {children}
    </motion.div>
  )
}

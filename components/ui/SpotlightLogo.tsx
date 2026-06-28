'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function SpotlightMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.15)}
      viewBox="0 0 20 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('spotlight-mark', className)}
      style={{ filter: 'drop-shadow(0 0 6px rgba(201,168,76,0.55))' }}
    >
      <style>{`
        @keyframes mark-pulse {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(201,168,76,0.5)); }
          50% { filter: drop-shadow(0 0 12px rgba(201,168,76,0.85)) drop-shadow(0 0 24px rgba(201,168,76,0.35)); }
        }
        .spotlight-mark { animation: mark-pulse 3s ease-in-out infinite; }
      `}</style>
      <path d="M10 6 L2 22 L18 22 Z" fill="currentColor" fillOpacity={0.15} />
      <line x1="10" y1="6" x2="2" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="6" x2="18" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="3.5" r="3" fill="currentColor" />
    </svg>
  )
}

const LETTERS = 'Spotlight'.split('')

export function SpotlightWordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      >
        <SpotlightMark size={16} className="text-hype-gold" />
      </motion.div>

      {/* Character-by-character reveal — Active Theory wordmark style */}
      <span className="flex overflow-hidden" aria-label="Spotlight" style={{ letterSpacing: '0.22em' }}>
        {LETTERS.map((char, i) => (
          <motion.span
            key={i}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.12 + i * 0.038,
            }}
            className="text-hype-text font-semibold uppercase font-display"
            style={{ fontSize: 11, display: 'inline-block' }}
          >
            {char}
          </motion.span>
        ))}
      </span>
    </div>
  )
}

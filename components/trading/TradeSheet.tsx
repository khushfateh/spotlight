'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Creator, TradeOrder } from '@/types'
import { cn } from '@/lib/utils'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'

type TradeStep = 'form' | 'confirm' | 'success' | 'error'
type Cinematic = 'spotlight' | 'curtains' | null

type TradeSheetProps = {
  isOpen: boolean
  creator: Creator | null
  tradeType: 'buy' | 'sell'
  step: TradeStep
  pendingOrder: TradeOrder | null
  isSubmitting: boolean
  onClose: () => void
  onSubmitOrder: (order: TradeOrder) => void
  onConfirmOrder: () => void
  onReset: () => void
}

// ── Deterministic particle data ───────────────────────────────────────────────

// Spotlight dust motes in the beam (fixed positions, no Math.random)
const DUST_MOTES = [
  { left: '44%', top: '22%', dur: 3.2, delay: 0,   size: 2 },
  { left: '56%', top: '31%', dur: 2.8, delay: 0.5, size: 1.5 },
  { left: '48%', top: '46%', dur: 3.7, delay: 0.9, size: 2.5 },
  { left: '52%', top: '58%', dur: 2.5, delay: 0.2, size: 1 },
  { left: '46%', top: '38%', dur: 4.0, delay: 1.3, size: 2 },
  { left: '54%', top: '68%', dur: 3.3, delay: 0.7, size: 1.5 },
  { left: '50%', top: '52%', dur: 2.9, delay: 1.1, size: 1 },
  { left: '43%', top: '75%', dur: 3.5, delay: 0.4, size: 2 },
  { left: '57%', top: '18%', dur: 2.6, delay: 1.6, size: 1.5 },
]

// Gold burst particles for success screen
const BURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  const dist = 30 + (i % 4) * 7
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    size: i % 3 === 0 ? 6 : 4,
    delay: i * 0.022,
  }
})

// Velvet curtain fold positions
const CURTAIN_FOLDS = [11, 24, 37, 51, 64, 77]

// ── Sub-components ────────────────────────────────────────────────────────────

function ParticleBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      {BURST.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: p.delay }}
          className="absolute rounded-full bg-hype-gold"
          style={{
            width: p.size, height: p.size,
            top: '50%', left: '50%',
            marginTop: -p.size / 2, marginLeft: -p.size / 2,
          }}
        />
      ))}
    </div>
  )
}

// ── Cinematic: SPOTLIGHT (spot) ───────────────────────────────────────────────

function SpotlightEffect({ creator }: { creator: Creator }) {
  return (
    <motion.div
      key="spotlight"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 overflow-hidden bg-black"
      style={{ zIndex: 65 }}
    >
      {/* Creator image — dim, slightly blurred */}
      {creator.imageUrl && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.22 }}
          transition={{ duration: 1.2 }}
        >
          <img
            src={creator.imageUrl}
            alt=""
            className="w-full h-full object-cover object-top"
            style={{ filter: 'blur(3px)' }}
          />
        </motion.div>
      )}

      {/* OUTER CONE — wide, soft, warm glow */}
      <motion.div
        className="absolute"
        style={{
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          height: '110vh',
          background:
            'linear-gradient(to bottom, rgba(255,245,200,0.55) 0%, rgba(255,220,130,0.28) 18%, rgba(201,168,76,0.12) 45%, transparent 100%)',
          clipPath: 'polygon(40% 0%, 60% 0%, 92% 100%, 8% 100%)',
          filter: 'blur(18px)',
          transformOrigin: '50% 0%',
        }}
        initial={{ scaleX: 0.015, scaleY: 0, opacity: 0 }}
        animate={{ scaleX: 1, scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
      />

      {/* INNER CONE — tight, crisp, brighter */}
      <motion.div
        className="absolute"
        style={{
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          height: '80vh',
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.75) 0%, rgba(255,240,190,0.38) 14%, rgba(201,168,76,0.15) 42%, transparent 100%)',
          clipPath: 'polygon(45% 0%, 55% 0%, 76% 100%, 24% 100%)',
          transformOrigin: '50% 0%',
        }}
        initial={{ scaleX: 0.01, scaleY: 0, opacity: 0 }}
        animate={{ scaleX: 1, scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      />

      {/* Light source — the fixture at the top */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 80,
          height: 80,
          marginTop: -20,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,245,200,0.7) 35%, transparent 70%)',
          filter: 'blur(10px)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Warm halo ring around source */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: 160,
          height: 80,
          marginTop: -24,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(255,220,120,0.35) 0%, rgba(201,168,76,0.12) 50%, transparent 100%)',
          filter: 'blur(20px)',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      />

      {/* Dust motes floating in the beam */}
      {DUST_MOTES.map((m, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            backgroundColor: 'rgba(255,240,190,0.7)',
          }}
          animate={{ y: [-18, 18, -18], opacity: [0, 0.8, 0] }}
          transition={{
            duration: m.dur,
            delay: m.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Creator name + SPOTTED text */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
      >
        <p
          className="text-white/55 font-semibold uppercase mb-3"
          style={{ fontSize: 10, letterSpacing: '0.35em' }}
        >
          You spotted
        </p>
        <h2
          className="text-white font-black tracking-tight text-center px-8"
          style={{
            fontSize: 'clamp(1.9rem, 9vw, 3.2rem)',
            lineHeight: 1.05,
            textShadow:
              '0 0 50px rgba(201,168,76,0.55), 0 0 20px rgba(255,240,190,0.3), 0 2px 24px rgba(0,0,0,0.9)',
          }}
        >
          {creator.name}
        </h2>

        {/* Gold divider + "First" */}
        <motion.div
          className="flex items-center gap-3 mt-5"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'center' }}
        >
          <div className="w-10 h-px bg-hype-gold/50" />
          <span
            className="text-hype-gold font-bold uppercase"
            style={{ fontSize: 9, letterSpacing: '0.22em' }}
          >
            First
          </span>
          <div className="w-10 h-px bg-hype-gold/50" />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ── Cinematic: CURTAINS (release) ─────────────────────────────────────────────

function CurtainsEffect({ creator }: { creator: Creator }) {
  // Rich velvet gradient (multiple shade stops simulate fabric)
  const velvetLeft =
    'linear-gradient(to right, #0d0202 0%, #3a0606 9%, #651010 18%, #4a0808 27%, #7a1212 36%, #5c0a0a 45%, #8c1212 53%, #6b0e0e 60%, #4d0808 68%, #7a1212 76%, #5c0a0a 85%, #6b0e0e 92%, #3a0606 97%, #190303 100%)'
  const velvetRight =
    'linear-gradient(to left, #0d0202 0%, #3a0606 9%, #651010 18%, #4a0808 27%, #7a1212 36%, #5c0a0a 45%, #8c1212 53%, #6b0e0e 60%, #4d0808 68%, #7a1212 76%, #5c0a0a 85%, #6b0e0e 92%, #3a0606 97%, #190303 100%)'

  return (
    <motion.div
      key="curtains"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeIn' } }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 65 }}
    >
      {/* Stage — creator image visible before curtains arrive */}
      {creator.imageUrl && (
        <div className="absolute inset-0">
          <img
            src={creator.imageUrl}
            alt=""
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-black/35" />
        </div>
      )}
      {!creator.imageUrl && (
        <div className={cn('absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
      )}

      {/* ── LEFT CURTAIN ── */}
      <motion.div
        className="absolute top-0 left-0 bottom-0"
        style={{ width: '53%' }}
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Velvet base */}
        <div className="absolute inset-0" style={{ background: velvetLeft }} />

        {/* Fold shadow lines */}
        {CURTAIN_FOLDS.map((pos, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: `${pos}%`,
              width: i % 2 === 0 ? 2 : 3,
              background:
                i % 2 === 0
                  ? 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.42) 20%, rgba(0,0,0,0.52) 50%, rgba(0,0,0,0.42) 80%, transparent 100%)'
                  : 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.055) 30%, rgba(255,255,255,0.075) 50%, rgba(255,255,255,0.055) 70%, transparent 100%)',
            }}
          />
        ))}

        {/* Gold fringe — inner edge */}
        <div
          className="absolute top-0 right-0 bottom-0 pointer-events-none"
          style={{
            width: 20,
            background:
              'linear-gradient(to right, transparent 0%, rgba(201,168,76,0.1) 40%, rgba(201,168,76,0.28) 80%, rgba(201,168,76,0.18) 100%)',
          }}
        />

        {/* Top rod shadow */}
        <div
          className="absolute top-0 left-0 right-0 h-2 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
          }}
        />

        {/* Bottom hem */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: 40,
            background:
              'linear-gradient(to bottom, transparent, rgba(0,0,0,0.45))',
            borderTop: '1px solid rgba(201,168,76,0.15)',
          }}
        />
      </motion.div>

      {/* ── RIGHT CURTAIN ── */}
      <motion.div
        className="absolute top-0 right-0 bottom-0"
        style={{ width: '53%' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0" style={{ background: velvetRight }} />

        {CURTAIN_FOLDS.map((pos, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              right: `${pos}%`,
              width: i % 2 === 0 ? 2 : 3,
              background:
                i % 2 === 0
                  ? 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.42) 20%, rgba(0,0,0,0.52) 50%, rgba(0,0,0,0.42) 80%, transparent 100%)'
                  : 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.055) 30%, rgba(255,255,255,0.075) 50%, rgba(255,255,255,0.055) 70%, transparent 100%)',
            }}
          />
        ))}

        <div
          className="absolute top-0 left-0 bottom-0 pointer-events-none"
          style={{
            width: 20,
            background:
              'linear-gradient(to left, transparent 0%, rgba(201,168,76,0.1) 40%, rgba(201,168,76,0.28) 80%, rgba(201,168,76,0.18) 100%)',
          }}
        />

        <div
          className="absolute top-0 left-0 right-0 h-2 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: 40,
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.45))',
            borderTop: '1px solid rgba(201,168,76,0.15)',
          }}
        />
      </motion.div>

      {/* Center seam where curtains meet — gold line */}
      <motion.div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 1,
          background:
            'linear-gradient(to bottom, rgba(201,168,76,0.7) 0%, rgba(201,168,76,0.45) 30%, rgba(201,168,76,0.55) 70%, rgba(201,168,76,0.4) 100%)',
          zIndex: 1,
          transformOrigin: 'top',
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.4, delay: 0.78, ease: 'easeOut' }}
      />

      {/* "The Show's Over" text — appears after curtains land */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 2 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <p
          className="text-hype-gold/75 font-light"
          style={{
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            fontStyle: 'italic',
            marginBottom: 14,
          }}
        >
          The Show&apos;s Over
        </p>
        <h2
          className="text-white/88 font-black text-center px-10 tracking-tight"
          style={{
            fontSize: 'clamp(1.6rem, 8vw, 2.8rem)',
            lineHeight: 1.1,
            textShadow: '0 2px 24px rgba(0,0,0,0.9)',
          }}
        >
          {creator.name}
        </h2>
        <motion.div
          className="flex items-center gap-4 mt-5"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.45, delay: 1.5 }}
          style={{ transformOrigin: 'center' }}
        >
          <div className="w-8 h-px" style={{ background: 'rgba(201,168,76,0.35)' }} />
          <p
            className="text-white/25 font-medium uppercase"
            style={{ fontSize: 8, letterSpacing: '0.2em' }}
          >
            Released from Discoveries
          </p>
          <div className="w-8 h-px" style={{ background: 'rgba(201,168,76,0.35)' }} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ── Main TradeSheet ───────────────────────────────────────────────────────────

export default function TradeSheet({
  isOpen, creator, tradeType, step, pendingOrder, isSubmitting,
  onClose, onSubmitOrder, onConfirmOrder, onReset,
}: TradeSheetProps) {
  const [cinematic, setCinematic] = useState<Cinematic>(null)

  // Clear cinematic when success state arrives (after ~2.1s total)
  useEffect(() => {
    if (cinematic) {
      const t = setTimeout(() => setCinematic(null), 2100)
      return () => clearTimeout(t)
    }
  }, [cinematic])

  // Reset cinematic if sheet is closed
  useEffect(() => {
    if (!isOpen) setCinematic(null)
  }, [isOpen])

  if (!creator) return null

  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isDeltaUp = delta >= 0
  const firstName = creator.name.split(' ')[0]

  function handleSpot() {
    onSubmitOrder({ type: 'buy', orderType: 'market', shares: 1, estimatedTotal: 0 })
  }

  function handleRelease() {
    onSubmitOrder({ type: 'sell', orderType: 'market', shares: 1, estimatedTotal: 0 })
  }

  function handleConfirm() {
    // Trigger cinematic effect first, then the actual confirm (1.5s to success)
    setCinematic(pendingOrder?.type === 'buy' ? 'spotlight' : 'curtains')
    onConfirmOrder()
  }

  return (
    <>
      {/* ── Backdrop — slightly lower z than sheet ──────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 bg-black/72 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        style={{ zIndex: 50 }}
        onClick={onClose}
      />

      {/* ── Sheet — z-51 so it is definitively above backdrop ──────────── */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 max-w-lg mx-auto transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ zIndex: 51 }}
      >
        <div className="bg-hype-surface border-t border-hype-border rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.65)] max-h-[88vh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-hype-surface z-10">
            <div className="w-8 h-0.5 bg-hype-border rounded-full" />
          </div>

          {/* ── Spot form ────────────────────────────────────────────────── */}
          {step === 'form' && tradeType === 'buy' && (
            <div className="px-5 pt-1 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="section-label text-hype-gold mb-1">Spot This Creator</p>
                  <p className="text-hype-text font-black text-xl tracking-tight">{creator.name}</p>
                  <p className="text-hype-muted text-xs font-mono mt-0.5">${creator.ticker} · {creator.category}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-hype-surface-2 flex items-center justify-center text-hype-muted hover:text-hype-text transition-colors mt-1"
                >
                  <X size={14} />
                </button>
              </div>

              {creator.imageUrl && (
                <div className="relative h-36 rounded-2xl overflow-hidden mb-5">
                  <img
                    src={creator.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-end gap-2">
                    <span className="text-white font-black text-3xl tabular leading-none">{score}</span>
                    <div className="pb-0.5">
                      <p className="text-hype-gold text-[9px] font-bold uppercase tracking-wider leading-none">{tier}</p>
                      <p className={cn('text-[10px] font-bold tabular leading-none mt-0.5', isDeltaUp ? 'text-hype-green' : 'text-hype-red')}>
                        {isDeltaUp ? '+' : ''}{delta} pts this week
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {creator.story && (
                <p className="text-hype-secondary text-sm leading-relaxed mb-5">{creator.story}</p>
              )}

              <Button variant="buy" size="xl" fullWidth onClick={handleSpot}>
                Spot {firstName}
              </Button>
              <p className="text-hype-dim text-[10px] text-center mt-3">
                Add to your discovery list · Not financial advice
              </p>
            </div>
          )}

          {/* ── Release form ─────────────────────────────────────────────── */}
          {step === 'form' && tradeType === 'sell' && (
            <div className="px-5 pt-1 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="section-label text-hype-muted mb-1">Release Discovery</p>
                  <p className="text-hype-text font-black text-xl tracking-tight">{creator.name}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-hype-surface-2 flex items-center justify-center text-hype-muted hover:text-hype-text transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="premium-card rounded-2xl p-4 mb-5">
                <p className="text-hype-secondary text-sm leading-relaxed">
                  Releasing {firstName} removes them from your discovery list. You can spot them again later.
                </p>
              </div>
              <Button variant="sell" size="xl" fullWidth onClick={handleRelease}>
                Release {firstName}
              </Button>
              <p className="text-hype-dim text-[10px] text-center mt-3">
                Removes from your Discoveries
              </p>
            </div>
          )}

          {/* ── Confirm ──────────────────────────────────────────────────── */}
          {step === 'confirm' && pendingOrder && (
            <div className="px-5 pt-1 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-hype-text font-semibold text-base">
                  {pendingOrder.type === 'buy' ? 'Confirm Spot' : 'Confirm Release'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-hype-surface-2 flex items-center justify-center text-hype-muted"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="premium-card rounded-2xl p-4 mb-6">
                <p className="text-hype-muted text-xs mb-2">
                  {pendingOrder.type === 'buy' ? "You're spotting" : "You're releasing"}
                </p>
                <p className="text-hype-text font-black text-xl tracking-tight">{creator.name}</p>
                <p className="text-hype-muted text-[10px] font-mono mt-0.5 mb-4">${creator.ticker}</p>
                <div className="flex items-end gap-3 pt-3 border-t border-hype-border">
                  <span className="text-hype-gold font-black text-3xl tabular leading-none">{score}</span>
                  <div className="pb-0.5">
                    <p className="text-hype-gold text-[9px] font-bold uppercase tracking-wider">Momentum · {tier}</p>
                    <p className={cn('text-[10px] font-bold tabular', isDeltaUp ? 'text-hype-green' : 'text-hype-red')}>
                      {isDeltaUp ? '+' : ''}{delta} pts this week
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-hype-dim text-[10px] text-center mb-5">
                {pendingOrder.type === 'buy' ? 'Early discovery claim' : 'Removes from your Discoveries'} · Not financial advice
              </p>

              <div className="flex gap-3">
                <Button variant="secondary" size="lg" fullWidth onClick={onReset}>Back</Button>
                <Button
                  variant={pendingOrder.type === 'buy' ? 'buy' : 'sell'}
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  onClick={handleConfirm}
                >
                  {pendingOrder.type === 'buy' ? 'Confirm Spot' : 'Confirm Release'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Success ──────────────────────────────────────────────────── */}
          {step === 'success' && pendingOrder && (
            <div className="px-5 pt-4 pb-8 flex flex-col items-center text-center" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}>
              <div className="relative w-14 h-14 mb-4">
                <div className="w-full h-full rounded-full bg-hype-green/10 border border-hype-green/20 flex items-center justify-center">
                  <CheckCircle size={28} className="text-hype-green" />
                </div>
                <ParticleBurst />
              </div>

              {pendingOrder.type === 'buy' ? (
                <>
                  <h2 className="text-hype-text font-black text-3xl tracking-tight mb-2">Spotted.</h2>
                  <p className="text-hype-secondary text-sm mb-5 leading-relaxed">
                    You&apos;re ahead of the curve on{' '}
                    <span className="text-hype-text font-semibold">{creator.name}</span>.
                  </p>
                  <div className="w-full p-4 bg-hype-gold/[0.08] border border-hype-gold/20 rounded-2xl mb-6">
                    <p className="text-hype-gold/60 text-[10px] font-semibold uppercase tracking-wider mb-1">
                      Momentum at discovery
                    </p>
                    <p className="text-hype-gold font-black text-4xl tabular leading-none">{score}</p>
                    <p className="text-hype-gold/50 text-xs mt-1">{tier}</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-hype-text font-bold text-xl mb-2">Released</h2>
                  <p className="text-hype-secondary text-sm mb-6 leading-relaxed">
                    <span className="text-hype-text font-semibold">{creator.name}</span>{' '}
                    removed from your Discoveries.
                  </p>
                </>
              )}

              <Button variant="primary" size="lg" fullWidth onClick={onClose}>Done</Button>
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────────── */}
          {step === 'error' && (
            <div className="px-5 pt-4 pb-8 flex flex-col items-center text-center" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}>
              <div className="w-14 h-14 rounded-full bg-hype-red/10 border border-hype-red/20 flex items-center justify-center mb-4">
                <AlertCircle size={28} className="text-hype-red" />
              </div>
              <h2 className="text-hype-text font-bold text-xl mb-2">Something went wrong</h2>
              <p className="text-hype-secondary text-sm mb-6">Please try again.</p>
              <Button variant="secondary" size="lg" fullWidth onClick={onReset}>Try Again</Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Cinematic effects — rendered above everything ───────────────── */}
      <AnimatePresence>
        {cinematic === 'spotlight' && <SpotlightEffect key="spotlight" creator={creator} />}
        {cinematic === 'curtains' && <CurtainsEffect key="curtains" creator={creator} />}
      </AnimatePresence>
    </>
  )
}

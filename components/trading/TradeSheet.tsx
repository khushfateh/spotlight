'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import SpotCinematic from '@/components/trading/SpotCinematic'
import type { Creator, TradeOrder } from '@/types'
import { cn } from '@/lib/utils'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import { useRouter } from 'next/navigation'

type TradeStep = 'form' | 'confirm' | 'success' | 'error'
type Cinematic = 'curtains' | null

type TradeSheetProps = {
  isOpen: boolean
  creator: Creator | null
  tradeType: 'buy' | 'sell'
  step: TradeStep
  pendingOrder: TradeOrder | null
  isSubmitting: boolean
  onClose: () => void
  onSpotNow: () => void
  onSubmitOrder: (order: TradeOrder) => void
  onConfirmOrder: () => void
  onReset: () => void
}

// ── Deterministic particle data ───────────────────────────────────────────────

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
        transition={{ duration: 1.15, ease: [0.25, 0.8, 0.3, 1] }}
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
        transition={{ duration: 1.15, ease: [0.25, 0.8, 0.3, 1], delay: 0.06 }}
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
        transition={{ duration: 0.45, delay: 1.05, ease: 'easeOut' }}
      />

      {/* "The Show's Over" text — appears after curtains land */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 2 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
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
            Moved On · Discovery Archived
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
  onClose, onSpotNow, onSubmitOrder, onConfirmOrder, onReset,
}: TradeSheetProps) {
  const [cinematic, setCinematic] = useState<Cinematic>(null)
  const router = useRouter()

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
    // Skip confirm — cinematic starts immediately
    onSpotNow()
  }

  function handleMoveOn() {
    onSubmitOrder({ type: 'sell', orderType: 'market', shares: 1, estimatedTotal: 0 })
  }

  function handleConfirm() {
    // Only sell orders reach here; curtains play then success
    setCinematic('curtains')
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
            <div className="px-5 pt-1" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
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

              {/* View Artist — premium ghost CTA */}
              <button
                onClick={() => { onClose(); router.push(`/creator/${creator.ticker.toLowerCase()}`) }}
                className="group relative w-full mt-3 flex items-center justify-center gap-2 rounded-2xl overflow-hidden"
                style={{
                  padding: '13px 0',
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.07) 0%, rgba(201,168,76,0.03) 100%)',
                  border: '1px solid rgba(201,168,76,0.22)',
                  boxShadow: '0 0 20px rgba(201,168,76,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                  transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                }}
                onMouseEnter={e => {
                  const b = e.currentTarget
                  b.style.borderColor = 'rgba(201,168,76,0.45)'
                  b.style.boxShadow = '0 0 28px rgba(201,168,76,0.14), inset 0 1px 0 rgba(255,255,255,0.06)'
                  b.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.05) 100%)'
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget
                  b.style.borderColor = 'rgba(201,168,76,0.22)'
                  b.style.boxShadow = '0 0 20px rgba(201,168,76,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
                  b.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.07) 0%, rgba(201,168,76,0.03) 100%)'
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: 'rgba(201,168,76,0.82)',
                  }}
                >
                  View Artist
                </span>
                <ArrowRight
                  size={13}
                  style={{
                    color: 'rgba(201,168,76,0.6)',
                    transform: 'translateX(0)',
                    transition: 'transform 0.2s',
                  }}
                  className="group-hover:translate-x-0.5"
                />
              </button>

              <p className="text-hype-dim text-[10px] text-center mt-3">
                Add to your discovery list · Not financial advice
              </p>
            </div>
          )}

          {/* ── Move On form ─────────────────────────────────────────────── */}
          {step === 'form' && tradeType === 'sell' && (
            <div className="px-5 pt-1" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="section-label text-hype-muted mb-1">Move On</p>
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
                  Moving on from {firstName} archives your discovery. Your chapter with them is preserved in your vault.
                </p>
              </div>
              <Button variant="sell" size="xl" fullWidth onClick={handleMoveOn}>
                Move On from {firstName}
              </Button>
              <p className="text-hype-dim text-[10px] text-center mt-3">
                Archives to your Discovery Vault
              </p>
            </div>
          )}

          {/* ── Confirm ──────────────────────────────────────────────────── */}
          {step === 'confirm' && pendingOrder && (
            <div className="px-5 pt-1" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-hype-text font-semibold text-base">
                  {pendingOrder.type === 'buy' ? 'Confirm Spot' : 'Archive Discovery'}
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
                  {pendingOrder.type === 'buy' ? "You're spotting" : "You're moving on from"}
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
                {pendingOrder.type === 'buy' ? 'Early discovery claim' : 'Archives to your Discovery Vault'} · Not financial advice
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
                  {pendingOrder.type === 'buy' ? 'Confirm Spot' : 'Archive Discovery'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Success: buy → cinematic; sell → simple ───────────────────── */}
          {step === 'success' && pendingOrder?.type === 'buy' && (
            <SpotCinematic creator={creator} onDone={onClose} />
          )}

          {step === 'success' && pendingOrder?.type === 'sell' && (
            <div className="px-5 pt-4 flex flex-col items-center text-center" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
              <div className="relative w-14 h-14 mb-4">
                <div className="w-full h-full rounded-full bg-hype-green/10 border border-hype-green/20 flex items-center justify-center">
                  <CheckCircle size={28} className="text-hype-green" />
                </div>
                <ParticleBurst />
              </div>
              <h2 className="text-hype-text font-bold text-xl mb-2">Moved On</h2>
              <p className="text-hype-secondary text-sm mb-6 leading-relaxed">
                Your chapter with{' '}
                <span className="text-hype-text font-semibold">{creator.name}</span>{' '}
                has been archived to your Vault.
              </p>
              <Button variant="primary" size="lg" fullWidth onClick={onClose}>Done</Button>
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────────── */}
          {step === 'error' && (
            <div className="px-5 pt-4 flex flex-col items-center text-center" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
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

      {/* ── Curtains cinematic — rendered above everything (sell only) ──── */}
      <AnimatePresence>
        {cinematic === 'curtains' && <CurtainsEffect key="curtains" creator={creator} />}
      </AnimatePresence>
    </>
  )
}

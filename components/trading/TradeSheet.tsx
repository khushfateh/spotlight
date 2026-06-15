'use client'
/* eslint-disable @next/next/no-img-element */

import { motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Creator, TradeOrder } from '@/types'
import { cn } from '@/lib/utils'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'

type TradeStep = 'form' | 'confirm' | 'success' | 'error'

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

// Deterministic gold burst — 12 particles radiating from success icon
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

export default function TradeSheet({
  isOpen, creator, tradeType, step, pendingOrder, isSubmitting,
  onClose, onSubmitOrder, onConfirmOrder, onReset,
}: TradeSheetProps) {
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

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/70 z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="bg-hype-surface border-t border-hype-border rounded-t-3xl pb-8 safe-bottom shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-8 h-0.5 bg-hype-border rounded-full" />
          </div>

          {/* ── Spot form ──────────────────────────────────────────────── */}
          {step === 'form' && tradeType === 'buy' && (
            <div className="px-5 pt-1">
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

              {/* Creator photo with momentum overlay */}
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

          {/* ── Release form (sell — deprioritised) ────────────────────── */}
          {step === 'form' && tradeType === 'sell' && (
            <div className="px-5 pt-1">
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

          {/* ── Confirm ────────────────────────────────────────────────── */}
          {step === 'confirm' && pendingOrder && (
            <div className="px-5 pt-1">
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
                  onClick={onConfirmOrder}
                >
                  {pendingOrder.type === 'buy' ? 'Confirm Spot' : 'Confirm Release'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Success ────────────────────────────────────────────────── */}
          {step === 'success' && pendingOrder && (
            <div className="px-5 pt-4 flex flex-col items-center text-center">
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

          {/* ── Error ──────────────────────────────────────────────────── */}
          {step === 'error' && (
            <div className="px-5 pt-4 flex flex-col items-center text-center">
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
    </>
  )
}

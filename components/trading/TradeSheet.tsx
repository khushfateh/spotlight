'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

// Deterministic burst — 12 gold particles radiating from trade icon on success
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
            width: p.size,
            height: p.size,
            top: '50%',
            left: '50%',
            marginTop: -p.size / 2,
            marginLeft: -p.size / 2,
          }}
        />
      ))}
    </div>
  )
}
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import type { Creator, TradeOrder } from '@/types'
import { formatPrice, formatPercent, cn } from '@/lib/utils'

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

export default function TradeSheet({
  isOpen, creator, tradeType, step, pendingOrder, isSubmitting,
  onClose, onSubmitOrder, onConfirmOrder, onReset,
}: TradeSheetProps) {
  const [shares, setShares] = useState('')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [limitPrice, setLimitPrice] = useState('')

  if (!creator) return null

  const shareCount = parseFloat(shares) || 0
  const price = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : creator.price
  const estimatedTotal = shareCount * price
  const isUp = creator.priceChangePercent24h >= 0

  function handleSubmit() {
    if (!shareCount || shareCount <= 0) return
    onSubmitOrder({ type: tradeType, orderType, shares: shareCount, limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined, estimatedTotal })
  }

  const quickAmounts = [5, 10, 25, 50]

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

          {/* Form */}
          {step === 'form' && (
            <div className="px-5 pt-1">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Avatar initials={creator.avatar} gradientClass={creator.coverColor} size="sm" />
                  <div>
                    <p className="text-hype-text font-semibold text-sm">{creator.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-hype-dim text-[10px] font-mono">${creator.ticker}</span>
                      <span className={cn('text-[10px] font-medium', isUp ? 'text-hype-green' : 'text-hype-red')}>
                        {formatPercent(creator.priceChangePercent24h)}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-full bg-hype-surface-2 flex items-center justify-center text-hype-muted hover:text-hype-text transition-colors">
                  <X size={14} />
                </button>
              </div>

              {/* Order type toggle */}
              <div className="flex gap-1 p-0.5 bg-hype-surface-2 rounded-xl mb-5 border border-hype-border">
                {(['market', 'limit'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={cn(
                      'flex-1 py-2 rounded-[10px] text-xs font-medium transition-all capitalize',
                      orderType === type ? 'bg-hype-surface-3 text-hype-text border border-hype-border' : 'text-hype-muted',
                    )}
                  >
                    {type} Order
                  </button>
                ))}
              </div>

              {/* Price display */}
              <div className="flex items-center justify-between mb-4 px-3 py-2.5 bg-hype-surface-2 rounded-xl border border-hype-border">
                <span className="text-hype-muted text-xs">Market Price</span>
                <span className="text-hype-text font-semibold tabular text-sm">{formatPrice(creator.price)}</span>
              </div>

              {/* Limit price input */}
              {orderType === 'limit' && (
                <div className="mb-4">
                  <label className="text-hype-muted text-xs mb-1.5 block">Limit Price</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-hype-secondary text-sm">$</span>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={e => setLimitPrice(e.target.value)}
                      placeholder={creator.price.toFixed(2)}
                      className="w-full bg-hype-surface-2 border border-hype-border rounded-xl px-4 pl-7 py-3 text-hype-text text-sm outline-none focus:border-hype-border-light transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Shares input */}
              <div className="mb-3">
                <label className="text-hype-muted text-xs mb-1.5 block">Shares</label>
                <input
                  type="number"
                  value={shares}
                  onChange={e => setShares(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full bg-hype-surface-2 border border-hype-border rounded-xl px-4 py-3 text-hype-text text-xl font-semibold tabular outline-none focus:border-hype-border-light transition-colors"
                />
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-5">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setShares(String(amt))}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium text-hype-muted bg-hype-surface-2 border border-hype-border hover:text-hype-secondary hover:border-hype-border-light transition-colors"
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {/* Estimated total */}
              <div className="flex justify-between items-center px-3 py-3 bg-hype-surface-2 rounded-xl border border-hype-border mb-4">
                <span className="text-hype-muted text-sm">Estimated Total</span>
                <span className="text-hype-text font-bold text-lg tabular">{formatPrice(estimatedTotal)}</span>
              </div>

              <p className="text-hype-dim text-[10px] text-center mb-4">
                Mock trading only · Not financial advice · For demo purposes
              </p>

              <Button
                variant={tradeType === 'buy' ? 'buy' : 'sell'}
                size="xl"
                fullWidth
                onClick={handleSubmit}
                disabled={!shareCount || shareCount <= 0}
              >
                {tradeType === 'buy' ? 'Review Buy Order' : 'Review Sell Order'}
              </Button>
            </div>
          )}

          {/* Confirm */}
          {step === 'confirm' && pendingOrder && (
            <div className="px-5 pt-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-hype-text font-semibold text-base">Review Order</h2>
                <button onClick={onClose} className="w-7 h-7 rounded-full bg-hype-surface-2 flex items-center justify-center text-hype-muted">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-0 mb-6 border border-hype-border rounded-xl overflow-hidden">
                {[
                  { label: 'Action', value: pendingOrder.type === 'buy' ? 'Buy' : 'Sell' },
                  { label: 'Creator', value: creator.name },
                  { label: 'Ticker', value: `$${creator.ticker}` },
                  { label: 'Shares', value: pendingOrder.shares.toLocaleString() },
                  { label: 'Price', value: formatPrice(creator.price) },
                  { label: 'Order Type', value: pendingOrder.orderType === 'market' ? 'Market Order' : `Limit @ ${formatPrice(pendingOrder.limitPrice ?? 0)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-3 border-b border-hype-border last:border-0">
                    <span className="text-hype-secondary text-sm">{label}</span>
                    <span className="text-hype-text text-sm font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center px-4 py-3.5 bg-hype-surface-2">
                  <span className="text-hype-text font-semibold">Total</span>
                  <span className="text-hype-gold font-bold text-xl tabular">{formatPrice(pendingOrder.estimatedTotal)}</span>
                </div>
              </div>

              <p className="text-hype-dim text-[10px] text-center mb-5">
                Simulated trade · No real money involved
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
                  Confirm
                </Button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && pendingOrder && (
            <div className="px-5 pt-4 flex flex-col items-center text-center">
              <div className="relative w-14 h-14 mb-4">
                <div className="w-full h-full rounded-full bg-hype-green/10 border border-hype-green/20 flex items-center justify-center">
                  <CheckCircle size={28} className="text-hype-green" />
                </div>
                <ParticleBurst />
              </div>
              <h2 className="text-hype-text font-bold text-xl mb-1">Order Executed</h2>
              <p className="text-hype-secondary text-sm mb-6 leading-relaxed">
                {pendingOrder.type === 'buy' ? 'Purchased' : 'Sold'}{' '}
                <span className="text-hype-text font-semibold">{pendingOrder.shares} shares</span> of{' '}
                <span className="text-hype-text font-semibold">{creator.name}</span>
              </p>
              <div className="w-full p-3.5 bg-hype-surface-2 border border-hype-border rounded-xl mb-6">
                <p className="text-hype-secondary text-xs">Total {pendingOrder.type === 'buy' ? 'spent' : 'received'}</p>
                <p className="text-hype-gold font-bold text-2xl tabular mt-1">{formatPrice(pendingOrder.estimatedTotal)}</p>
              </div>
              <Button variant="primary" size="lg" fullWidth onClick={onClose}>Done</Button>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="px-5 pt-4 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-hype-red/10 border border-hype-red/20 flex items-center justify-center mb-4">
                <AlertCircle size={28} className="text-hype-red" />
              </div>
              <h2 className="text-hype-text font-bold text-xl mb-2">Order Failed</h2>
              <p className="text-hype-secondary text-sm mb-6">Something went wrong. Please try again.</p>
              <Button variant="secondary" size="lg" fullWidth onClick={onReset}>Try Again</Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

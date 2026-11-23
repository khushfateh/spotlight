'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import SpotCinematic from '@/components/trading/SpotCinematic'
import type { Creator, TradeOrder } from '@/types'
import { cn } from '@/lib/utils'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — SPOTLIGHT aesthetic
// ─────────────────────────────────────────────────────────────────────────────
const GOLD       = '#C9A84C'
const VOID       = '#050508'
const GLASS_BG   = 'rgba(5,5,8,0.96)'
const GLASS_BLUR = 'blur(32px)'
const MONO       = 'JetBrains Mono, monospace'
const SERIF      = '"Cormorant Garamond", Georgia, serif'

// Bottom nav height + safe area — enough clearance so the CTA is never clipped
const BOTTOM_CLEAR = 'max(104px, calc(88px + env(safe-area-inset-bottom, 12px)))'

type TradeStep = 'form' | 'confirm' | 'success' | 'error'
type Cinematic = 'curtains' | null

type TradeSheetProps = {
  isOpen:          boolean
  creator:         Creator | null
  tradeType:       'buy' | 'sell'
  step:            TradeStep
  pendingOrder:    TradeOrder | null
  isSubmitting:    boolean
  onClose:         () => void
  onSpotNow:       () => void
  onSubmitOrder:   (order: TradeOrder) => void
  onConfirmOrder:  () => void
  onReset:         () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Particle burst (success screen)
// ─────────────────────────────────────────────────────────────────────────────
const BURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  const dist  = 30 + (i % 4) * 7
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: i % 3 === 0 ? 6 : 4, delay: i * 0.022 }
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
          className="absolute rounded-full"
          style={{ background: GOLD, width: p.size, height: p.size, top: '50%', left: '50%', marginTop: -p.size / 2, marginLeft: -p.size / 2 }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Velvet curtain cinematic (sell / move-on)
// ─────────────────────────────────────────────────────────────────────────────
const CURTAIN_FOLDS = [11, 24, 37, 51, 64, 77]

function CurtainsEffect({ creator }: { creator: Creator }) {
  const velvetLeft  = 'linear-gradient(to right,  #0d0202 0%,#3a0606 9%,#651010 18%,#4a0808 27%,#7a1212 36%,#5c0a0a 45%,#8c1212 53%,#6b0e0e 60%,#4d0808 68%,#7a1212 76%,#5c0a0a 85%,#6b0e0e 92%,#3a0606 97%,#190303 100%)'
  const velvetRight = 'linear-gradient(to left,   #0d0202 0%,#3a0606 9%,#651010 18%,#4a0808 27%,#7a1212 36%,#5c0a0a 45%,#8c1212 53%,#6b0e0e 60%,#4d0808 68%,#7a1212 76%,#5c0a0a 85%,#6b0e0e 92%,#3a0606 97%,#190303 100%)'
  const foldStyle = (even: boolean) => even
    ? 'linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.42) 20%,rgba(0,0,0,0.52) 50%,rgba(0,0,0,0.42) 80%,transparent 100%)'
    : 'linear-gradient(to bottom,transparent 0%,rgba(255,255,255,0.055) 30%,rgba(255,255,255,0.075) 50%,rgba(255,255,255,0.055) 70%,transparent 100%)'

  return (
    <motion.div
      key="curtains"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeIn' } }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 200 }}
    >
      {creator.imageUrl
        ? <><img src={creator.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" /><div className="absolute inset-0 bg-black/35" /></>
        : <div className={cn('absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
      }

      {[{ side: 'left', style: velvetLeft }, { side: 'right', style: velvetRight }].map(({ side, style }) => (
        <motion.div
          key={side}
          className="absolute top-0 bottom-0"
          style={{ [side]: 0, width: '53%' }}
          initial={{ x: side === 'left' ? '-100%' : '100%' }}
          animate={{ x: 0 }}
          transition={{ duration: 1.15, ease: [0.25, 0.8, 0.3, 1], delay: side === 'right' ? 0.06 : 0 }}
        >
          <div className="absolute inset-0" style={{ background: style }} />
          {CURTAIN_FOLDS.map((pos, i) => (
            <div key={i} className="absolute top-0 bottom-0 pointer-events-none"
              style={{ [side === 'left' ? 'left' : 'right']: `${pos}%`, width: i % 2 === 0 ? 2 : 3, background: foldStyle(i % 2 === 0) }} />
          ))}
          <div className="absolute top-0 bottom-0 pointer-events-none"
            style={{ [side === 'left' ? 'right' : 'left']: 0, width: 20, background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'},transparent 0%,rgba(201,168,76,0.28) 80%,rgba(201,168,76,0.18) 100%)` }} />
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{ height: 40, background: 'linear-gradient(to bottom,transparent,rgba(0,0,0,0.45))', borderTop: '1px solid rgba(201,168,76,0.15)' }} />
        </motion.div>
      ))}

      <motion.div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: 1, background: 'linear-gradient(to bottom,rgba(201,168,76,0.7) 0%,rgba(201,168,76,0.45) 30%,rgba(201,168,76,0.55) 70%,rgba(201,168,76,0.4) 100%)', zIndex: 1, transformOrigin: 'top' }}
        initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.45, delay: 1.05, ease: 'easeOut' }} />

      <motion.div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 2 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.65, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', fontStyle: 'italic', color: 'rgba(201,168,76,0.75)', marginBottom: 14 }}>
          The Show&apos;s Over
        </p>
        <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(1.6rem,8vw,2.8rem)', lineHeight: 1.1, color: 'rgba(255,255,255,0.90)', textAlign: 'center', padding: '0 40px', textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}>
          {creator.name}
        </h2>
        <motion.div className="flex items-center gap-4 mt-5"
          initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.45, delay: 1.5 }} style={{ transformOrigin: 'center' }}
        >
          <div className="w-8 h-px" style={{ background: 'rgba(201,168,76,0.35)' }} />
          <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            Moved On · Discovery Archived
          </p>
          <div className="w-8 h-px" style={{ background: 'rgba(201,168,76,0.35)' }} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared close button
// ─────────────────────────────────────────────────────────────────────────────
function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      style={{
        width: 30, height: 30, borderRadius: 2, flexShrink: 0,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.40)', cursor: 'pointer', transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => { const t=e.currentTarget; t.style.background='rgba(255,255,255,0.10)'; t.style.color='rgba(255,255,255,0.80)' }}
      onMouseLeave={e => { const t=e.currentTarget; t.style.background='rgba(255,255,255,0.05)'; t.style.color='rgba(255,255,255,0.40)' }}
    >
      <X size={13} />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Gold primary CTA button
// ─────────────────────────────────────────────────────────────────────────────
function GoldButton({ label, onClick, isLoading = false }: { label: string; onClick: () => void; isLoading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        width: '100%', padding: '15px 0', borderRadius: 2, border: 'none',
        background: isLoading ? 'rgba(201,168,76,0.60)' : GOLD,
        color: VOID, cursor: isLoading ? 'default' : 'pointer',
        fontFamily: MONO, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        boxShadow: `0 0 24px rgba(201,168,76,0.28), 0 2px 8px rgba(0,0,0,0.40)`,
        transition: 'background 0.15s ease, box-shadow 0.15s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
      onMouseEnter={e => { if (!isLoading) { const t=e.currentTarget; t.style.boxShadow='0 0 36px rgba(201,168,76,0.45), 0 2px 12px rgba(0,0,0,0.50)' } }}
      onMouseLeave={e => { const t=e.currentTarget; t.style.boxShadow='0 0 24px rgba(201,168,76,0.28), 0 2px 8px rgba(0,0,0,0.40)' }}
    >
      {isLoading
        ? <span style={{ display:'inline-block', width:14, height:14, borderRadius:'50%', border:`1.5px solid ${VOID}`, borderTop:'1.5px solid rgba(0,0,0,0.30)', animation:'spin 0.8s linear infinite' }} />
        : label
      }
    </button>
  )
}

// Ghost secondary button
function GhostButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '14px 0', borderRadius: 2,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
        fontFamily: MONO, fontSize: 11, fontWeight: 600,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => { const t=e.currentTarget; t.style.borderColor='rgba(255,255,255,0.22)'; t.style.color='rgba(255,255,255,0.70)' }}
      onMouseLeave={e => { const t=e.currentTarget; t.style.borderColor='rgba(255,255,255,0.10)'; t.style.color='rgba(255,255,255,0.45)' }}
    >
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main TradeSheet
// ─────────────────────────────────────────────────────────────────────────────
export default function TradeSheet({
  isOpen, creator, tradeType, step, pendingOrder, isSubmitting,
  onClose, onSpotNow, onSubmitOrder, onConfirmOrder, onReset,
}: TradeSheetProps) {
  const [cinematic, setCinematic] = useState<Cinematic>(null)
  const router = useRouter()

  useEffect(() => {
    if (cinematic) {
      const t = setTimeout(() => setCinematic(null), 2100)
      return () => clearTimeout(t)
    }
  }, [cinematic])

  useEffect(() => { if (!isOpen) setCinematic(null) }, [isOpen])

  if (!creator) return null

  const { score, delta } = getMomentum(creator.ticker)
  const tier      = getMomentumTier(score)
  const isDeltaUp = delta >= 0
  const firstName = creator.name.split(' ')[0]

  function handleSpot()   { onSpotNow() }
  function handleMoveOn() { onSubmitOrder({ type: 'sell', orderType: 'market', shares: 1, estimatedTotal: 0 }) }
  function handleConfirm() { setCinematic('curtains'); onConfirmOrder() }

  // ── Sheet body padding clears the bottom nav bar on all devices
  const contentPad: React.CSSProperties = { padding: `0 20px`, paddingBottom: BOTTOM_CLEAR }

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Backdrop — z-150 to sit above bottom nav (z-40) reliably ──── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 150,
          background: 'rgba(0,0,0,0.76)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
      />

      {/* ── Sheet — z-151 ────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 151,
          maxWidth: 520, margin: '0 auto',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <div style={{
          background: GLASS_BG,
          backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR,
          borderTop: `1px solid rgba(201,168,76,0.22)`,
          borderLeft: '1px solid rgba(201,168,76,0.10)',
          borderRight: '1px solid rgba(201,168,76,0.10)',
          borderRadius: '6px 6px 0 0',
          boxShadow: '0 -12px 60px rgba(0,0,0,0.80), 0 0 0 0.5px rgba(201,168,76,0.08)',
          maxHeight: '90svh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>

          {/* Handle */}
          <div style={{ display:'flex', justifyContent:'center', padding:'14px 0 12px', position:'sticky', top:0, background:GLASS_BG, zIndex:1, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: 36, height: 2, borderRadius: 1, background: 'rgba(201,168,76,0.28)' }} />
          </div>

          {/* ══════════════════════════════════════════════════════════
              SPOT form (buy)
          ══════════════════════════════════════════════════════════ */}
          {step === 'form' && tradeType === 'buy' && (
            <div>
              {/* Creator hero image */}
              <div style={{ position: 'relative', height: 230, overflow: 'hidden' }}>
                {creator.imageUrl
                  ? <img src={creator.imageUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
                  : <div className={cn('absolute inset-0 bg-gradient-to-br', creator.coverColor)} />
                }
                {/* Multi-layer cinematic gradient */}
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(5,5,8,1) 0%, rgba(5,5,8,0.70) 38%, rgba(5,5,8,0.10) 70%, rgba(5,5,8,0) 100%)' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(5,5,8,0.35) 0%, rgba(5,5,8,0) 55%)' }} />

                {/* Close button — top right */}
                <div style={{ position:'absolute', top:14, right:14 }}>
                  <CloseBtn onClose={onClose} />
                </div>

                {/* Score — bottom left overlay on image */}
                <div style={{ position:'absolute', bottom:16, left:20, display:'flex', alignItems:'flex-end', gap:10 }}>
                  <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 56, lineHeight: 1, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em' }}>{score}</span>
                  <div style={{ paddingBottom: 6 }}>
                    <p style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: GOLD }}>{tier}</p>
                    <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: isDeltaUp ? '#52d78a' : '#e05555', marginTop: 2 }}>
                      {isDeltaUp ? '+' : ''}{delta} pts this week
                    </p>
                  </div>
                </div>
              </div>

              {/* Content below image */}
              <div style={{ ...contentPad, paddingTop: 20 }}>
                {/* Eyebrow */}
                <p style={{ fontFamily: MONO, fontSize: 8, fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.50)', marginBottom: 6 }}>
                  ◆ Spot This Creator
                </p>

                {/* Name + ticker */}
                <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.93)', marginBottom: 4 }}>
                  {creator.name}
                </p>
                <p style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(201,168,76,0.40)', marginBottom: creator.story ? 16 : 24 }}>
                  ${creator.ticker} · {creator.category}
                </p>

                {/* Story */}
                {creator.story && (
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.45)', marginBottom: 24, letterSpacing: '0.01em' }}>
                    {creator.story}
                  </p>
                )}

                {/* Gold hairline divider */}
                <div style={{ height: 1, background: 'linear-gradient(to right, rgba(201,168,76,0.25), rgba(201,168,76,0.06), rgba(201,168,76,0))', marginBottom: 20 }} />

                {/* Primary CTA */}
                <GoldButton label={`Spot ${firstName.toUpperCase()}`} onClick={handleSpot} />

                {/* View Artist ghost CTA */}
                <button
                  onClick={() => { onClose(); router.push(`/creator/${creator.ticker.toLowerCase()}`) }}
                  style={{
                    width: '100%', marginTop: 10, padding: '13px 0', borderRadius: 2,
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.18)',
                    color: 'rgba(201,168,76,0.70)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    fontFamily: MONO, fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { const t=e.currentTarget; t.style.borderColor='rgba(201,168,76,0.40)'; t.style.background='rgba(201,168,76,0.12)'; t.style.color='rgba(201,168,76,0.90)' }}
                  onMouseLeave={e => { const t=e.currentTarget; t.style.borderColor='rgba(201,168,76,0.18)'; t.style.background='rgba(201,168,76,0.06)'; t.style.color='rgba(201,168,76,0.70)' }}
                >
                  View Artist Profile
                  <ArrowRight size={11} />
                </button>

                <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.15)', textAlign: 'center', marginTop: 14, letterSpacing: '0.06em' }}>
                  Add to your discovery list · Not financial advice
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              MOVE ON form (sell)
          ══════════════════════════════════════════════════════════ */}
          {step === 'form' && tradeType === 'sell' && (
            <div style={{ ...contentPad, paddingTop: 22 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontFamily: MONO, fontSize: 8, fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 6 }}>
                    Move On
                  </p>
                  <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 26, color: 'rgba(255,255,255,0.90)', lineHeight: 1.1 }}>{creator.name}</p>
                </div>
                <CloseBtn onClose={onClose} />
              </div>

              <div style={{ padding: '16px 18px', borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 24 }}>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.01em' }}>
                  Moving on from {firstName} archives your discovery. Your chapter with them is preserved in your vault.
                </p>
              </div>

              <button
                onClick={handleMoveOn}
                style={{
                  width: '100%', padding: '15px 0', borderRadius: 2, border: 'none',
                  background: 'rgba(224,85,85,0.90)', color: '#fff', cursor: 'pointer',
                  fontFamily: MONO, fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  boxShadow: '0 0 20px rgba(224,85,85,0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                Move On from {firstName.toUpperCase()}
              </button>
              <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.15)', textAlign: 'center', marginTop: 12, letterSpacing: '0.06em' }}>
                Archives to your Discovery Vault
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              CONFIRM step
          ══════════════════════════════════════════════════════════ */}
          {step === 'confirm' && pendingOrder && (
            <div style={{ ...contentPad, paddingTop: 22 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 20 }}>
                <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 22, color: 'rgba(255,255,255,0.88)' }}>
                  {pendingOrder.type === 'buy' ? 'Confirm Spot' : 'Archive Discovery'}
                </p>
                <CloseBtn onClose={onClose} />
              </div>

              <div style={{ padding: '18px', borderRadius: 2, background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.14)', marginBottom: 22 }}>
                <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.30)', marginBottom: 8, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                  {pendingOrder.type === 'buy' ? 'You\'re spotting' : 'You\'re moving on from'}
                </p>
                <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: 'rgba(255,255,255,0.92)', marginBottom: 2 }}>{creator.name}</p>
                <p style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(201,168,76,0.40)', marginBottom: 16 }}>${creator.ticker}</p>
                <div style={{ borderTop: '1px solid rgba(201,168,76,0.10)', paddingTop: 14, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                  <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 44, lineHeight: 1, color: GOLD }}>{score}</span>
                  <div style={{ paddingBottom: 4 }}>
                    <p style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD }}>{tier}</p>
                    <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: isDeltaUp ? '#52d78a' : '#e05555', marginTop: 2 }}>
                      {isDeltaUp ? '+' : ''}{delta} pts this week
                    </p>
                  </div>
                </div>
              </div>

              <p style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginBottom: 18, letterSpacing: '0.06em' }}>
                {pendingOrder.type === 'buy' ? 'Early discovery claim' : 'Archives to your Discovery Vault'} · Not financial advice
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <GhostButton label="Back" onClick={onReset} />
                {pendingOrder.type === 'buy'
                  ? <GoldButton label="Confirm Spot" onClick={handleConfirm} isLoading={isSubmitting} />
                  : <button
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                      style={{ flex:1, padding:'15px 0', borderRadius:2, border:'none', background:'rgba(224,85,85,0.90)', color:'#fff', fontFamily:MONO, fontSize:11, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', cursor:'pointer' }}
                    >
                      {isSubmitting ? 'Archiving…' : 'Archive Discovery'}
                    </button>
                }
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SUCCESS: buy → cinematic  |  sell → confirmation
          ══════════════════════════════════════════════════════════ */}
          {step === 'success' && pendingOrder?.type === 'buy' && (
            <SpotCinematic creator={creator} onDone={onClose} />
          )}

          {step === 'success' && pendingOrder?.type === 'sell' && (
            <div style={{ ...contentPad, paddingTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 56, height: 56, marginBottom: 20 }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 2, background: 'rgba(82,215,138,0.10)', border: '1px solid rgba(82,215,138,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={26} style={{ color: '#52d78a' }} />
                </div>
                <ParticleBurst />
              </div>
              <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 28, color: 'rgba(255,255,255,0.90)', marginBottom: 10 }}>Moved On</p>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.42)', marginBottom: 28, maxWidth: 280 }}>
                Your chapter with <strong style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{creator.name}</strong> has been archived to your Vault.
              </p>
              <GoldButton label="Done" onClick={onClose} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              ERROR
          ══════════════════════════════════════════════════════════ */}
          {step === 'error' && (
            <div style={{ ...contentPad, paddingTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 2, background: 'rgba(224,85,85,0.10)', border: '1px solid rgba(224,85,85,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <AlertCircle size={26} style={{ color: '#e05555' }} />
              </div>
              <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 24, color: 'rgba(255,255,255,0.90)', marginBottom: 8 }}>Something went wrong</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginBottom: 28 }}>Please try again.</p>
              <GhostButton label="Try Again" onClick={onReset} />
            </div>
          )}

        </div>
      </div>

      {/* ── Curtains cinematic ─────────────────────────────────────────── */}
      <AnimatePresence>
        {cinematic === 'curtains' && <CurtainsEffect key="curtains" creator={creator} />}
      </AnimatePresence>
    </>
  )
}

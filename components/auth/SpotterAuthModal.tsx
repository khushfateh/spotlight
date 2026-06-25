'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Creator } from '@/types'

type Phase = 'pause' | 'card' | 'exiting'

const BENEFITS = [
  'Spotter Rank',
  'Discovery Timeline',
  'Discovery Record',
  'Discovery Accuracy',
  'Breakout Recognition',
  'Shareable Discovery Cards',
]

function useIsIOS() {
  const [isIOS, setIsIOS] = useState(false)
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
  }, [])
  return isIOS
}

// Floating dust particle
function Particle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: '-8px',
        background: 'rgba(201,168,76,0.25)',
        boxShadow: '0 0 4px rgba(201,168,76,0.3)',
      }}
      animate={{
        y: [0, -320, -480],
        opacity: [0, 0.6, 0],
        x: [0, (Math.random() - 0.5) * 60],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3,
        ease: 'easeOut',
      }}
    />
  )
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  delay: i * 0.5,
  x: 8 + Math.floor(Math.random() * 84),
  size: 2 + Math.floor(Math.random() * 3),
}))

// Slow sweeping spotlight beam across the backdrop
function SpotlightBeam() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'linear-gradient(105deg, transparent 20%, rgba(201,168,76,0.07) 45%, rgba(201,168,76,0.12) 50%, rgba(201,168,76,0.07) 55%, transparent 80%)',
        backgroundSize: '200% 100%',
      }}
      animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
    />
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-167.8-103.6c-60.6-64-116.2-163.3-131.4-212.5-16.6-52.8-20.3-112.7-20.3-171.6 0-226.5 147.4-346.1 292.3-346.1 74.3 0 136.2 49 184.1 49 45.7 0 118.1-52 203.7-52 32.5 0 108.1 2.6 168.1 97.7zm-202.7-183.6c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
    </svg>
  )
}

type Props = {
  creator: Creator
  onClose: () => void
}

export default function SpotterAuthModal({ creator, onClose }: Props) {
  const router = useRouter()
  const isIOS = useIsIOS()
  const [phase, setPhase] = useState<Phase>('pause')
  const [showDismissText, setShowDismissText] = useState(false)
  const [benefitCount, setBenefitCount] = useState(0)

  // Phase 1 → 2 after 1250ms
  useEffect(() => {
    const t = setTimeout(() => setPhase('card'), 1250)
    return () => clearTimeout(t)
  }, [])

  // Stagger benefits in after card appears
  useEffect(() => {
    if (phase !== 'card') return
    let i = 0
    const iv = setInterval(() => {
      i++
      setBenefitCount(i)
      if (i >= BENEFITS.length) clearInterval(iv)
    }, 110)
    return () => clearInterval(iv)
  }, [phase])

  const dismiss = useCallback(() => {
    setPhase('exiting')
    setShowDismissText(true)
    setTimeout(() => {
      setShowDismissText(false)
      onClose()
    }, 1100)
  }, [onClose])

  async function handleGoogle() {
    if (!supabase) { router.push('/signup'); return }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  async function handleApple() {
    if (!supabase) { router.push('/signup'); return }
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'exiting' ? 0 : 1 }}
      transition={{ duration: phase === 'exiting' ? 0.5 : 0.35 }}
      className="fixed inset-0 z-[200]"
      style={{ isolation: 'isolate' }}
    >
      {/* ── Backdrop ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden">
        {creator.imageUrl && (
          <div
            className="absolute inset-[-12px]"
            style={{
              backgroundImage: `url(${creator.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              filter: 'blur(14px) saturate(0.7)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/80" />
        {/* Vignette edge-blur */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 120px rgba(0,0,0,0.85)',
          }}
        />
        <SpotlightBeam />
        {PARTICLES.map(p => (
          <Particle key={p.id} delay={p.delay} x={p.x} size={p.size} />
        ))}
      </div>

      {/* ── Phase 1: Pause text ──────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'pause' && (
          <motion.div
            key="pause-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center px-8 pointer-events-none"
          >
            <p
              style={{
                fontSize: 26,
                fontWeight: 300,
                color: 'rgba(255,255,255,0.88)',
                textAlign: 'center',
                letterSpacing: '0.015em',
                lineHeight: 1.55,
                textShadow: '0 2px 48px rgba(0,0,0,0.9)',
                fontStyle: 'italic',
              }}
            >
              Claim your place in<br />{creator.name}&apos;s journey to success.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase 2: Glass card ──────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'card' && (
          <motion.div
            key="card"
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 bottom-0 overflow-y-auto"
            style={{ maxHeight: '94vh' }}
          >
            <div
              style={{
                background: 'linear-gradient(170deg, rgba(18,16,12,0.98) 0%, rgba(10,9,7,0.99) 100%)',
                borderTop: '1px solid rgba(201,168,76,0.22)',
                borderLeft: '1px solid rgba(201,168,76,0.06)',
                borderRight: '1px solid rgba(201,168,76,0.06)',
                borderRadius: '24px 24px 0 0',
                backdropFilter: 'blur(48px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(48px) saturate(1.3)',
                boxShadow:
                  '0 -32px 80px rgba(0,0,0,0.75), 0 0 80px rgba(201,168,76,0.05), inset 0 1px 0 rgba(201,168,76,0.12)',
                padding: '28px 24px 16px',
                paddingBottom: 'max(32px, env(safe-area-inset-bottom, 16px))',
                position: 'relative',
              }}
            >
              {/* Dismiss */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <X size={14} style={{ color: 'rgba(255,255,255,0.45)' }} />
              </button>

              {/* Spotlight glow bar */}
              <div
                className="mx-auto mb-5"
                style={{
                  width: 36,
                  height: 3,
                  borderRadius: 99,
                  background: 'linear-gradient(90deg, rgba(201,168,76,0.15), rgba(201,168,76,0.5), rgba(201,168,76,0.15))',
                }}
              />

              {/* Creator pill */}
              <div className="flex justify-center mb-5">
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '5px 12px 5px 7px',
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.16)',
                    borderRadius: 100,
                  }}
                >
                  {creator.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.imageUrl}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover object-top flex-shrink-0"
                    />
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(201,168,76,0.75)', letterSpacing: '0.07em' }}>
                    ${creator.ticker}
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h2
                style={{
                  fontSize: 27,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.18,
                  marginBottom: 10,
                }}
              >
                Ready to make<br />this official?
              </h2>

              {/* Subtext */}
              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.38)',
                  textAlign: 'center',
                  lineHeight: 1.65,
                  marginBottom: 22,
                }}
              >
                Spotting isn&apos;t anonymous.<br />
                Your discovery becomes part of this creator&apos;s story forever.
              </p>

              {/* Benefits grid */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.065)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  marginBottom: 22,
                }}
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {BENEFITS.map((benefit, i) => (
                    <motion.div
                      key={benefit}
                      initial={{ opacity: 0, y: 5 }}
                      animate={i < benefitCount ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="flex items-center gap-2"
                    >
                      <div
                        style={{
                          width: 15,
                          height: 15,
                          borderRadius: '50%',
                          background: 'rgba(201,168,76,0.1)',
                          border: '1px solid rgba(201,168,76,0.28)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={8} style={{ color: 'rgba(201,168,76,0.85)' }} />
                      </div>
                      <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', fontWeight: 500, lineHeight: 1 }}>
                        {benefit}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Auth buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <button
                  onClick={handleGoogle}
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 14,
                    background: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#1A1A1A',
                    cursor: 'pointer',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                {isIOS && (
                  <button
                    onClick={handleApple}
                    style={{
                      width: '100%',
                      height: 52,
                      borderRadius: 14,
                      background: '#050505',
                      border: '1px solid rgba(255,255,255,0.14)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <AppleIcon />
                    Continue with Apple
                  </button>
                )}

                <button
                  onClick={() => router.push('/signup')}
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 14,
                    background: 'rgba(201,168,76,0.07)',
                    border: '1.5px solid rgba(201,168,76,0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'rgba(201,168,76,0.88)',
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Continue with Email
                </button>
              </div>

              {/* Existing user */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Already a Spotter?
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <button
                onClick={() => router.push('/login')}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 14,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.09)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.42)',
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                Continue Your Journey
              </button>

              {/* Social proof */}
              <p
                style={{
                  fontSize: 10.5,
                  color: 'rgba(255,255,255,0.15)',
                  textAlign: 'center',
                  marginTop: 18,
                  letterSpacing: '0.04em',
                }}
              >
                18,472 discoveries have already been preserved.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dismiss text ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDismissText && (
          <motion.div
            key="dismiss-text"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <p
              style={{
                fontSize: 17,
                fontWeight: 300,
                color: 'rgba(255,255,255,0.38)',
                letterSpacing: '0.04em',
                fontStyle: 'italic',
              }}
            >
              Maybe next discovery.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

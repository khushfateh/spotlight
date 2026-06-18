'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import { getSpotterRank } from '@/lib/mock-data/spots'
import GoldDiscoveryCard from '@/components/trading/GoldDiscoveryCard'
import type { Creator } from '@/types'

type Phase = 'reveal' | 'card' | 'vault'

export default function SpotCinematic({
  creator,
  onDone,
}: {
  creator: Creator
  onDone: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>('reveal')
  const [visible, setVisible] = useState(true)
  const [spotTime] = useState(() => new Date())
  const { currentUser } = useAuth()

  const userName = currentUser?.name?.split(' ')[0] ?? 'You'
  const { score } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const rank = getSpotterRank(creator.ticker)

  useEffect(() => { setMounted(true) }, [])

  // Auto-advance from reveal to card
  useEffect(() => {
    const t = setTimeout(() => setPhase('card'), 2800)
    return () => clearTimeout(t)
  }, [])

  function handleDone() {
    setPhase('vault')
    setTimeout(() => setVisible(false), 950)
  }

  if (!mounted) return null

  const overlay = (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="spot-cinematic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ zIndex: 200, background: '#000' }}
        >
          {/* Full-screen artist image */}
          {creator.imageUrl ? (
            <motion.div
              className="absolute inset-0"
              animate={{
                filter: phase === 'card' || phase === 'vault'
                  ? 'blur(18px) brightness(0.22) saturate(0.6)'
                  : 'brightness(0.82)',
              }}
              transition={{ duration: 1.0, ease: 'easeInOut' }}
            >
              <img
                src={creator.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: 'blur(28px) brightness(0.45)', transform: 'scale(1.12)' }}
              />
              <img
                src={creator.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${creator.coverColor}`}
              animate={{ filter: phase !== 'reveal' ? 'brightness(0.18)' : 'brightness(0.55)' }}
              transition={{ duration: 1.0 }}
            />
          )}

          {/* Dark vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 100%)',
              zIndex: 2,
            }}
          />

          {/* ── REVEAL PHASE ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                key="reveal"
                className="absolute inset-0 flex flex-col items-center pointer-events-none"
                exit={{ opacity: 0, transition: { duration: 0.55 } }}
                style={{ zIndex: 5 }}
              >
                {/* Outer spotlight cone */}
                <motion.div
                  style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '110%', height: '90%',
                    background: 'linear-gradient(to bottom, rgba(255,245,200,0.38) 0%, rgba(255,220,140,0.2) 22%, rgba(201,168,76,0.09) 55%, transparent 100%)',
                    clipPath: 'polygon(38% 0%, 62% 0%, 88% 100%, 12% 100%)',
                    filter: 'blur(22px)', transformOrigin: '50% 0%',
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 1.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
                />
                {/* Inner beam */}
                <motion.div
                  style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '80%', height: '70%',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.26) 0%, rgba(255,245,200,0.12) 28%, rgba(201,168,76,0.04) 65%, transparent 100%)',
                    clipPath: 'polygon(44% 0%, 56% 0%, 72% 100%, 28% 100%)',
                    filter: 'blur(6px)', transformOrigin: '50% 0%',
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 1.7, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                />
                {/* Light fixture glow */}
                <motion.div
                  style={{
                    position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
                    width: 90, height: 90, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,252,230,0.92) 0%, rgba(255,240,180,0.55) 38%, transparent 70%)',
                    filter: 'blur(14px)',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.55, delay: 0.28 }}
                />
                {/* Halo ring */}
                <motion.div
                  style={{
                    position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
                    width: 160, height: 80, borderRadius: '50%',
                    background: 'radial-gradient(ellipse at 50% 40%, rgba(255,225,130,0.32) 0%, rgba(201,168,76,0.1) 55%, transparent 100%)',
                    filter: 'blur(20px)',
                  }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.32 }}
                />
                {/* Text */}
                <motion.div
                  className="absolute text-center px-10"
                  style={{ bottom: '18%' }}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 1.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p style={{ fontSize: 13, letterSpacing: '0.18em', color: 'rgba(201,168,76,0.6)', fontStyle: 'italic', fontWeight: 300, marginBottom: 18 }}>
                    Remember the moment.
                  </p>
                  <h1
                    className="text-white font-black tracking-tight"
                    style={{
                      fontSize: 'clamp(2rem, 10vw, 3.6rem)', lineHeight: 1.05,
                      textShadow: '0 0 70px rgba(201,168,76,0.45), 0 0 24px rgba(201,168,76,0.2), 0 3px 30px rgba(0,0,0,0.95)',
                    }}
                  >
                    {creator.name}
                  </h1>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CARD PHASE ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'card' && (
              <motion.div
                key="card-phase"
                className="relative flex flex-col items-center"
                style={{ zIndex: 10, gap: '1.5rem' }}
              >
                {/* Card entrance */}
                <motion.div
                  style={{ perspective: '900px' }}
                  initial={{ opacity: 0, scale: 0.1, x: 170, y: 300, rotateZ: -65 }}
                  animate={{
                    opacity: [0, 1, 1, 1],
                    scale: [0.1, 1.06, 0.97, 1],
                    x: [170, -18, 6, 0],
                    y: [300, -22, 8, 0],
                    rotateZ: [-65, 4, -1.5, 0],
                  }}
                  transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], times: [0, 0.72, 0.88, 1] }}
                >
                  <motion.div
                    animate={{ rotateY: [-4, 4, -4], rotateX: [1.5, -1.5, 1.5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <GoldDiscoveryCard
                      creator={creator}
                      rank={rank}
                      score={score}
                      tier={tier}
                      userName={userName}
                      spotTime={spotTime}
                    />
                  </motion.div>
                </motion.div>

                {/* Gold aura */}
                <motion.div
                  className="absolute pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  style={{
                    inset: -40, borderRadius: 60,
                    background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(201,168,76,0.14) 0%, transparent 70%)',
                    filter: 'blur(20px)', zIndex: -1,
                  }}
                />

                {/* Vault confirm + Done */}
                <motion.div
                  className="flex flex-col items-center gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p style={{ fontSize: 12, color: 'rgba(201,168,76,0.7)', letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase' }}>
                    ✦ Added to your Vault
                  </p>
                  <button
                    onClick={handleDone}
                    className="font-bold text-[#0A0A0A] tracking-wide"
                    style={{
                      fontSize: 13,
                      padding: '14px 36px',
                      borderRadius: 20,
                      background: 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 48%, #C9A84C 100%)',
                      boxShadow: '0 4px 28px rgba(201,168,76,0.38), 0 1px 0 rgba(255,255,255,0.15) inset',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Done
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── VAULT PHASE (theatrical close) ──────────────────────────── */}
          <AnimatePresence>
            {phase === 'vault' && (
              <motion.div
                key="vault-phase"
                className="absolute inset-0 flex items-center justify-center"
                style={{ zIndex: 10 }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
              >
                {/* Gold flash pulse — full screen */}
                <motion.div
                  className="absolute inset-0"
                  style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,235,150,0.55) 0%, rgba(201,168,76,0.25) 45%, transparent 75%)', zIndex: 1 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.55, times: [0, 0.2, 1], ease: 'easeOut' }}
                />

                {/* Expanding gold ring */}
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 120, height: 120,
                    border: '2px solid rgba(201,168,76,0.8)',
                    boxShadow: '0 0 32px rgba(201,168,76,0.5), inset 0 0 32px rgba(201,168,76,0.2)',
                    zIndex: 2,
                  }}
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 5.5, opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.2, 0, 0.4, 1] }}
                />

                {/* Second ring — staggered */}
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 80, height: 80,
                    border: '1.5px solid rgba(255,240,180,0.6)',
                    zIndex: 2,
                  }}
                  initial={{ scale: 0.8, opacity: 0.7 }}
                  animate={{ scale: 5, opacity: 0 }}
                  transition={{ duration: 0.65, ease: [0.2, 0, 0.4, 1], delay: 0.06 }}
                />

                {/* Card locks into vault — bounce up then shoot */}
                <motion.div
                  style={{ perspective: '900px', zIndex: 3 }}
                  initial={{ scale: 1, y: 0, rotateZ: 0, opacity: 1, filter: 'blur(0px)' }}
                  animate={{
                    scale: [1, 1.06, 0.0],
                    y: [0, -10, -140],
                    rotateZ: [0, 2, 4],
                    opacity: [1, 1, 0],
                    filter: ['blur(0px)', 'blur(0px)', 'blur(5px)'],
                  }}
                  transition={{ duration: 0.75, times: [0, 0.22, 1], ease: [0.4, 0, 0.2, 1] }}
                >
                  <GoldDiscoveryCard
                    creator={creator}
                    rank={rank}
                    score={score}
                    tier={tier}
                    userName={userName}
                    spotTime={spotTime}
                  />
                </motion.div>

                {/* "Sealed" confirmation text */}
                <motion.div
                  className="absolute flex flex-col items-center"
                  style={{ bottom: 80, zIndex: 4 }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 0.85, times: [0, 0.2, 0.7, 1] }}
                >
                  <p style={{ fontSize: 11, letterSpacing: '0.28em', color: 'rgba(201,168,76,0.65)', fontWeight: 700, textTransform: 'uppercase' }}>
                    ✦ Sealed in your Vault
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(overlay, document.body)
}

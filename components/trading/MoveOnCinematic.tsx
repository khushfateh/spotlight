'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Creator } from '@/types'
import type { VaultEntry } from '@/hooks/useVault'

type Phase = 'fade' | 'reflection' | 'breakout' | 'archive' | 'vault'

// ── Archive Card ──────────────────────────────────────────────────────────────

function ArchiveCard({
  creator,
  entry,
  movedOnDate,
  daysSpotted,
}: {
  creator: Creator
  entry: VaultEntry
  movedOnDate: Date
  daysSpotted: number
}) {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const isBreakout = (entry.currentScore - entry.momentumAtSpot) >= 28

  const corner = (pos: Record<string, number | undefined>) => ({
    position: 'absolute' as const,
    width: 10, height: 10, ...pos, zIndex: 12, pointerEvents: 'none' as const,
    borderTop: pos.bottom === undefined ? '1.5px solid rgba(180,175,215,0.55)' : 'none',
    borderBottom: pos.top === undefined ? '1.5px solid rgba(180,175,215,0.55)' : 'none',
    borderLeft: pos.right === undefined ? '1.5px solid rgba(180,175,215,0.55)' : 'none',
    borderRight: pos.left === undefined ? '1.5px solid rgba(180,175,215,0.55)' : 'none',
  })

  return (
    <div style={{
      width: 'min(78vw, 280px)',
      aspectRatio: '5 / 7',
      borderRadius: 16,
      background: 'linear-gradient(160deg, #0d0b13 0%, #080609 45%, #0d0b13 100%)',
      border: '2px solid rgba(180,175,215,0.5)',
      boxShadow: '0 0 0 1px rgba(160,155,205,0.1), 0 0 40px rgba(160,155,205,0.14), 0 28px 80px rgba(0,0,0,0.97)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ARCHIVED watermark */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%) rotate(-35deg)',
        fontSize: 46, fontWeight: 900, color: 'rgba(160,155,205,0.035)',
        letterSpacing: '0.08em', zIndex: 1, pointerEvents: 'none', userSelect: 'none',
      }}>ARCHIVED</div>

      {/* Image section */}
      <div style={{ height: '38%', position: 'relative', overflow: 'hidden' }}>
        {creator.imageUrl ? (
          <>
            <img src={creator.imageUrl} alt="" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', transform: 'scale(1.1)',
              filter: 'blur(8px) brightness(0.22) saturate(0.2)',
            }} />
            <img src={creator.imageUrl} alt="" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'contain', filter: 'brightness(0.38) saturate(0.3)',
            }} />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${creator.coverColor}`}
            style={{ filter: 'brightness(0.22) saturate(0.2)' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, #080609 0%, rgba(8,6,9,0.5) 38%, transparent 72%)',
        }} />
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center', zIndex: 5 }}>
          <p style={{ fontSize: 7, letterSpacing: '0.30em', color: 'rgba(195,190,230,0.6)', fontWeight: 700, textTransform: 'uppercase' }}>
            Discovery Archived
          </p>
        </div>
        {isBreakout && (
          <div style={{ position: 'absolute', top: 8, right: 10, zIndex: 5 }}>
            <span style={{ fontSize: 7, color: 'rgba(201,168,76,0.75)', fontWeight: 700, letterSpacing: '0.1em' }}>✦ BREAKOUT</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ height: '52%', padding: '8px 14px 4px', position: 'relative', zIndex: 10 }}>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{creator.name}</p>
        <p style={{ fontSize: 8, color: 'rgba(175,170,210,0.4)', letterSpacing: '0.1em', marginTop: 1, fontFamily: 'monospace' }}>${creator.ticker}</p>

        <div style={{ height: 1, background: 'linear-gradient(to right, rgba(180,175,215,0.55), rgba(180,175,215,0.16) 50%, rgba(180,175,215,0.55))', margin: '7px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px', marginBottom: 8 }}>
          {([
            { label: 'SPOTTED', date: fmt(entry.spotDate), time: fmtTime(entry.spotDate), muted: false },
            { label: 'MOVED ON', date: fmt(movedOnDate), time: fmtTime(movedOnDate), muted: true },
          ] as const).map(({ label, date, time, muted }) => (
            <div key={label}>
              <p style={{ fontSize: 6, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.16)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 9.5, color: muted ? 'rgba(195,190,230,0.75)' : 'rgba(255,255,255,0.7)', fontWeight: 600, lineHeight: 1.3 }}>{date}</p>
              <p style={{ fontSize: 7.5, color: muted ? 'rgba(195,190,230,0.26)' : 'rgba(255,255,255,0.26)', fontWeight: 400 }}>{time}</p>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: 'linear-gradient(to right, rgba(180,175,215,0.55), rgba(180,175,215,0.16) 50%, rgba(180,175,215,0.55))', marginBottom: 8 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
          {([
            { label: 'DISCOVERY DURATION', value: `${daysSpotted} days`, hi: false },
            { label: 'SPOTTER RANK', value: `#${entry.spotterRank}`, hi: true },
            { label: 'SPOTLIGHT SCORE', value: `${entry.momentumAtSpot}`, hi: false },
            { label: 'MOMENTUM SCORE', value: `${entry.currentScore}`, hi: false },
          ] as const).map(({ label, value, hi }) => (
            <div key={label}>
              <p style={{ fontSize: 5.5, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.14)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 1 }}>{label}</p>
              <p style={{ fontSize: 10, fontWeight: hi ? 800 : 600, color: hi ? 'rgba(200,195,235,0.9)' : 'rgba(255,255,255,0.66)', textShadow: hi ? '0 0 10px rgba(200,195,235,0.25)' : 'none', lineHeight: 1.2 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '10%', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px',
        background: 'linear-gradient(to right, rgba(160,155,205,0.1), rgba(160,155,205,0.04) 50%, rgba(160,155,205,0.1))',
        borderTop: '1px solid rgba(160,155,205,0.16)',
      }}>
        <p style={{ fontSize: 6.5, letterSpacing: '0.22em', color: 'rgba(160,155,205,0.38)', fontWeight: 600, textTransform: 'uppercase' }}>Discovery Vault · Spotlight</p>
        <p style={{ fontSize: 8, color: 'rgba(160,155,205,0.38)', fontWeight: 700 }}>#{entry.spotterRank}</p>
      </div>

      <div style={corner({ top: 6, left: 6 })} />
      <div style={corner({ top: 6, right: 6 })} />
      <div style={corner({ bottom: 6, left: 6 })} />
      <div style={corner({ bottom: 6, right: 6 })} />
    </div>
  )
}

// ── Main cinematic ────────────────────────────────────────────────────────────

export default function MoveOnCinematic({
  creator,
  entry,
  onMoveOn,
  onDone,
}: {
  creator: Creator
  entry: VaultEntry
  onMoveOn: (durationDays: number) => void
  onDone: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>('fade')
  const [visible, setVisible] = useState(true)
  const [vaultDone, setVaultDone] = useState(false)

  const movedOnDate = new Date()
  const daysSpotted = Math.max(1, Math.floor((Date.now() - entry.spotDate.getTime()) / (1000 * 60 * 60 * 24)))
  const momentumGain = entry.currentScore - entry.momentumAtSpot
  const isBreakout = momentumGain >= 28
  const othersCount = entry.spotterRank * 33
  const daysBeforeBreakout = Math.round(daysSpotted * 0.6)
  const firstName = creator.name.split(' ')[0]

  useEffect(() => setMounted(true), [])

  // fade → reflection (1.6s)
  useEffect(() => {
    if (phase !== 'fade') return
    const t = setTimeout(() => setPhase('reflection'), 1600)
    return () => clearTimeout(t)
  }, [phase])

  // reflection → breakout/archive (2.2s or tap)
  useEffect(() => {
    if (phase !== 'reflection') return
    const t = setTimeout(() => setPhase(isBreakout ? 'breakout' : 'archive'), 2200)
    return () => clearTimeout(t)
  }, [phase, isBreakout])

  // vault: show Done button after 700ms
  useEffect(() => {
    if (phase !== 'vault') return
    const t = setTimeout(() => setVaultDone(true), 700)
    return () => clearTimeout(t)
  }, [phase])

  const handleMoveOn = useCallback(() => {
    onMoveOn(daysSpotted)
    setPhase('vault')
  }, [onMoveOn, daysSpotted])

  if (!mounted) return null

  const bgOpacity = phase === 'fade' ? 1 : phase === 'reflection' ? 0.08 : 0.04

  const overlay = (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ zIndex: 200 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Black base */}
          <div className="absolute inset-0 bg-black" />

          {/* Creator image — dims by phase */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: bgOpacity }}
            transition={{ duration: phase === 'fade' ? 1.5 : 0.7, ease: 'easeInOut' }}
          >
            {creator.imageUrl ? (
              <>
                <img src={creator.imageUrl} alt="" style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', filter: 'blur(6px) saturate(0.55)', transform: 'scale(1.06)',
                }} />
                <img src={creator.imageUrl} alt="" style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
                }} />
              </>
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${creator.coverColor}`} />
            )}
            <div className="absolute inset-0 bg-black/55" />
          </motion.div>

          {/* ── FADE ────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'fade' && (
              <motion.div
                key="fade"
                className="absolute inset-x-0 bottom-20 flex flex-col items-center px-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
              >
                <p style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 500, color: 'rgba(201,168,76,0.72)', textAlign: 'center', lineHeight: 1.5 }}>
                  Every discovery tells a story.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── REFLECTION ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'reflection' && (
              <motion.div
                key="reflection"
                className="absolute inset-0 flex flex-col items-center justify-center px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                onClick={() => setPhase(isBreakout ? 'breakout' : 'archive')}
              >
                <p style={{ fontSize: 9, letterSpacing: '0.28em', color: 'rgba(200,195,230,0.3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>
                  Your Discovery Journey
                </p>
                <p style={{ fontSize: 70, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 4 }}>
                  {daysSpotted}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.34)', fontWeight: 500, marginBottom: 28 }}>
                  days spotting {firstName}
                </p>
                <div style={{ width: 'min(60vw, 200px)', height: 1, background: 'linear-gradient(to right, transparent, rgba(200,195,230,0.28), transparent)', marginBottom: 28 }} />
                <p style={{ fontSize: 42, fontWeight: 900, color: 'rgba(201,168,76,0.88)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>
                  #{entry.spotterRank}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', textAlign: 'center' }}>
                  You were here before {othersCount.toLocaleString()} others.
                </p>
                <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.14)', fontWeight: 600, marginTop: 36, textTransform: 'uppercase' }}>
                  Tap to continue
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── BREAKOUT LEGACY ─────────────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'breakout' && (
              <motion.div
                key="breakout"
                className="absolute inset-0 flex flex-col items-center justify-center px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,168,76,0.07), transparent)' }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <p style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(201,168,76,0.5)', marginBottom: 24, letterSpacing: '0.04em' }}>
                  Before you move on...
                </p>
                <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginBottom: 6, textAlign: 'center' }}>
                  You spotted {firstName}
                </p>
                <p style={{ fontSize: 38, fontWeight: 900, color: 'rgba(201,168,76,0.88)', lineHeight: 1.1, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: 6 }}>
                  {daysBeforeBreakout} days
                </p>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 6, textAlign: 'center' }}>before breakout.</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', fontStyle: 'italic', textAlign: 'center', marginBottom: 40 }}>
                  while others were still catching on.
                </p>
                <button
                  onClick={() => setPhase('archive')}
                  style={{
                    fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'rgba(201,168,76,0.7)', background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.16)', borderRadius: 28,
                    padding: '10px 28px', cursor: 'pointer',
                  }}
                >
                  Continue
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ARCHIVE CARD ────────────────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'archive' && (
              <motion.div
                key="archive"
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ paddingBottom: 16 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <motion.div
                  className="flex flex-col items-center w-full"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 260, delay: 0.1 }}
                >
                  <p style={{ fontSize: 11, color: 'rgba(200,195,230,0.35)', fontStyle: 'italic', marginBottom: 18, letterSpacing: '0.04em' }}>
                    Your chapter with {firstName} is complete.
                  </p>
                  <ArchiveCard creator={creator} entry={entry} movedOnDate={movedOnDate} daysSpotted={daysSpotted} />
                  <motion.button
                    onClick={handleMoveOn}
                    style={{
                      marginTop: 24,
                      fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: 'rgba(200,195,230,0.75)', background: 'rgba(160,155,205,0.08)',
                      border: '1px solid rgba(160,155,205,0.22)', borderRadius: 28,
                      padding: '12px 40px', cursor: 'pointer', width: 'min(78vw, 280px)',
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Move On
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── VAULT TRANSFER ──────────────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'vault' && (
              <motion.div
                key="vault"
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Card shrinks away */}
                <motion.div
                  initial={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
                  animate={{ scale: 0.15, opacity: 0, y: -50, filter: 'blur(6px)' }}
                  transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
                  style={{ pointerEvents: 'none' }}
                >
                  <ArchiveCard creator={creator} entry={entry} movedOnDate={movedOnDate} daysSpotted={daysSpotted} />
                </motion.div>

                {/* Confirmation */}
                <motion.div
                  className="absolute flex flex-col items-center px-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.55 }}
                >
                  <p style={{ fontSize: 10, letterSpacing: '0.28em', color: 'rgba(200,195,230,0.45)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
                    ✦ Archived to Discovery Vault
                  </p>
                  <p style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(255,255,255,0.24)', textAlign: 'center', lineHeight: 1.6 }}>
                    Your discovery is preserved.
                  </p>
                </motion.div>

                <AnimatePresence>
                  {vaultDone && (
                    <motion.button
                      key="done-btn"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      onClick={() => setVisible(false)}
                      style={{
                        position: 'absolute', bottom: 52,
                        fontSize: 14, fontWeight: 600, letterSpacing: '0.06em',
                        color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28,
                        padding: '12px 40px', cursor: 'pointer',
                      }}
                    >
                      Done
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(overlay, document.body)
}

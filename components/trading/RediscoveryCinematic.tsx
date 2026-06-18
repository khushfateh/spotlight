'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import type { Creator } from '@/types'
import type { VaultEntry } from '@/hooks/useVault'
import SpotSharePrompt from '@/components/sharing/SpotSharePrompt'

type Phase = 'vault' | 'reflection' | 'return' | 'chapter' | 'capsule' | 'done'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Archive card (cold / archival) ─────────────────────────────────────────

function ArchiveCard({ creator, entry }: { creator: Creator; entry: VaultEntry }) {
  return (
    <div style={{
      width: 270,
      background: 'linear-gradient(160deg, #0d1219 0%, #070a0e 55%, #0d1219 100%)',
      border: '1px solid rgba(120,145,185,0.2)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 0 50px rgba(80,110,180,0.07), 0 20px 50px rgba(0,0,0,0.92)',
    }}>
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid rgba(120,145,185,0.1)' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(120,145,185,0.65)', fontWeight: 700, textTransform: 'uppercase' }}>
          ⊡ Archived Discovery
        </div>
        {entry.archivedAt && (
          <div style={{ fontSize: 8, color: 'rgba(120,145,185,0.38)', marginTop: 3, letterSpacing: '0.06em' }}>
            Chapter I · Moved On {fmtDate(entry.archivedAt)}
          </div>
        )}
      </div>
      {creator.imageUrl && (
        <div style={{ height: 95, overflow: 'hidden', position: 'relative' }}>
          <img src={creator.imageUrl} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
            filter: 'grayscale(0.75) brightness(0.5) saturate(0.4)',
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, #070a0e 100%)' }} />
        </div>
      )}
      <div style={{ padding: '10px 14px 12px' }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: 'rgba(170,185,210,0.65)', letterSpacing: '-0.02em' }}>
          {creator.name}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(120,145,185,0.38)', marginTop: 3, fontFamily: 'monospace' }}>
          ${creator.ticker}
        </div>
        {entry.spotDurationDays && (
          <div style={{ fontSize: 8, color: 'rgba(120,145,185,0.3)', marginTop: 5, letterSpacing: '0.08em' }}>
            {entry.spotDurationDays} days in your Vault
          </div>
        )}
      </div>
    </div>
  )
}

// ── Rediscovery capsule card (warm gold) ────────────────────────────────────

function RediscoveryCard({ creator, entry, rediscoveredAt, chapterNum }: {
  creator: Creator
  entry: VaultEntry
  rediscoveredAt: Date
  chapterNum: number
}) {
  const { score } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const chapterLabel = ROMAN[chapterNum - 1] ?? String(chapterNum)

  return (
    <div style={{
      width: 295,
      background: 'linear-gradient(160deg, #1c1304 0%, #0c0901 55%, #1c1304 100%)',
      border: '1px solid rgba(201,168,76,0.42)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 0 60px rgba(201,168,76,0.14), 0 20px 60px rgba(0,0,0,0.88)',
    }}>
      {/* Header */}
      <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid rgba(201,168,76,0.14)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 8, letterSpacing: '0.22em', color: 'rgba(201,168,76,0.88)', fontWeight: 700, textTransform: 'uppercase' }}>
            ✦ Rediscovered
          </span>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
            {fmtDate(rediscoveredAt)}
          </span>
        </div>
        <div style={{ fontSize: 9, color: 'rgba(201,168,76,0.48)', marginTop: 3, letterSpacing: '0.1em', fontWeight: 600 }}>
          Chapter {chapterLabel}
        </div>
      </div>

      {/* Creator image */}
      {creator.imageUrl && (
        <div style={{ height: 105, overflow: 'hidden', position: 'relative' }}>
          <img src={creator.imageUrl} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
            filter: 'brightness(0.88) saturate(1.1)',
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 45%, #0c0901 100%)' }} />
          {/* Warm gold tint overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(201,168,76,0.06) 0%, transparent 60%)', mixBlendMode: 'screen' as const }} />
        </div>
      )}

      {/* Name */}
      <div style={{ padding: '9px 15px 7px' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {creator.name.toUpperCase()}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(201,168,76,0.58)', marginTop: 3, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
          ${creator.ticker}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.22), transparent)', margin: '0 15px' }} />

      {/* Chapter timeline */}
      <div style={{ padding: '9px 15px 7px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.28)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>
            Chapter I
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {fmtDate(entry.spotDate)}
          </div>
          {entry.archivedAt && (
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
              → {fmtDate(entry.archivedAt)}
            </div>
          )}
          {entry.spotDurationDays != null && (
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
              {entry.spotDurationDays} days
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 7, letterSpacing: '0.18em', color: 'rgba(201,168,76,0.72)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>
            Chapter {chapterLabel}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(201,168,76,0.62)', lineHeight: 1.6 }}>
            {fmtDate(rediscoveredAt)}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(201,168,76,0.6)', lineHeight: 1.4 }}>
            → ∞
          </div>
          <div style={{ fontSize: 8, color: 'rgba(201,168,76,0.92)', fontWeight: 700, marginTop: 2 }}>
            Active Now
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.22), transparent)', margin: '0 15px' }} />

      {/* Stats row */}
      <div style={{ padding: '8px 15px 11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'rgba(201,168,76,0.88)' }}>#{entry.spotterRank}</div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Orig Rank</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'rgba(255,255,255,0.78)' }}>{score}</div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Momentum</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(201,168,76,0.65)' }}>{tier}</div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Tier</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '7px 15px 10px', borderTop: '1px solid rgba(201,168,76,0.1)', textAlign: 'center' }}>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Discovery Vault · Spotlight
        </span>
      </div>
    </div>
  )
}

// ── Main cinematic ──────────────────────────────────────────────────────────

export default function RediscoveryCinematic({
  creator,
  entry,
  onRediscover,
  onDone,
  userId,
  userName,
}: {
  creator: Creator
  entry: VaultEntry
  onRediscover: () => void
  onDone: () => void
  userId?: string
  userName?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>('vault')
  const [visible, setVisible] = useState(true)
  const [rediscoveredAt] = useState(() => new Date())
  const [rediscoverTriggered, setRediscoverTriggered] = useState(false)

  const chapterNum = (entry.rediscoveryCount ?? 0) + 2

  useEffect(() => { setMounted(true) }, [])

  // Phase 1 → 2 auto
  useEffect(() => {
    if (phase !== 'vault') return
    const t = setTimeout(() => setPhase('reflection'), 2600)
    return () => clearTimeout(t)
  }, [phase])

  // Phase 2 → 3 auto (or user tap)
  useEffect(() => {
    if (phase !== 'reflection') return
    const t = setTimeout(() => setPhase('return'), 3600)
    return () => clearTimeout(t)
  }, [phase])

  // Phase 3 → 4 auto
  useEffect(() => {
    if (phase !== 'return') return
    const t = setTimeout(() => setPhase('chapter'), 2100)
    return () => clearTimeout(t)
  }, [phase])

  // Phase 4 → 5 auto
  useEffect(() => {
    if (phase !== 'chapter') return
    const t = setTimeout(() => setPhase('capsule'), 1400)
    return () => clearTimeout(t)
  }, [phase])

  // Phase 6: auto-close after brief vault animation
  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(() => setVisible(false), 950)
    return () => clearTimeout(t)
  }, [phase])

  function handleBeginChapter() {
    if (!rediscoverTriggered) {
      setRediscoverTriggered(true)
      onRediscover()
    }
    setPhase('done')
  }

  if (!mounted) return null

  const overlay = (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="rediscovery-cinematic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ zIndex: 200, background: '#000' }}
        >
          {/* ── VAULT PHASE — archive card emerges ─────────────────────── */}
          <AnimatePresence>
            {phase === 'vault' && (
              <motion.div
                key="vault-phase"
                className="absolute inset-0 flex flex-col items-center justify-center"
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                style={{ zIndex: 5 }}
              >
                {/* Cold archival glow */}
                <motion.div
                  style={{
                    position: 'absolute',
                    width: 340, height: 340,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(80,110,200,0.1) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Archive card rising */}
                <motion.div
                  initial={{ opacity: 0, y: 140, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                >
                  <ArchiveCard creator={creator} entry={entry} />
                </motion.div>

                {/* Editorial headline */}
                <motion.p
                  style={{
                    marginTop: 28,
                    fontSize: 13,
                    color: 'rgba(180,195,225,0.52)',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    letterSpacing: '0.06em',
                    textAlign: 'center',
                    maxWidth: 260,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  Some discoveries are worth revisiting.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── REFLECTION PHASE — history surfaces ────────────────────── */}
          <AnimatePresence>
            {phase === 'reflection' && (
              <motion.div
                key="reflection-phase"
                className="absolute inset-0 flex flex-col items-center justify-center px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                style={{ zIndex: 5, cursor: 'pointer' }}
                onClick={() => setPhase('return')}
              >
                {/* Faded archive card at top */}
                <motion.div
                  style={{ opacity: 0.45, transform: 'scale(0.8)', marginBottom: 24 }}
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <ArchiveCard creator={creator} entry={entry} />
                </motion.div>

                {/* Stats */}
                <motion.div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    padding: '18px 24px',
                    width: '100%',
                    maxWidth: 300,
                  }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                >
                  <p style={{ fontSize: 8, letterSpacing: '0.22em', color: 'rgba(180,195,225,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>
                    First Discovery
                  </p>
                  {[
                    { label: 'Spotted', value: fmtDate(entry.spotDate) },
                    { label: 'Moved On', value: entry.archivedAt ? fmtDate(entry.archivedAt) : '—' },
                    { label: 'Duration', value: entry.spotDurationDays != null ? `${entry.spotDurationDays} days` : '—' },
                    { label: 'Spotter Rank', value: `#${entry.spotterRank}` },
                  ].map(({ label, value }, i) => (
                    <motion.div
                      key={label}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 9, marginBottom: 9, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
                    >
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>{label}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.04em' }}>{value}</span>
                    </motion.div>
                  ))}
                  <motion.p
                    style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 6, letterSpacing: '0.1em' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.85 }}
                  >
                    Tap to continue
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── RETURN PHASE — spotlight beam returns ──────────────────── */}
          <AnimatePresence>
            {phase === 'return' && (
              <motion.div
                key="return-phase"
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ zIndex: 5 }}
              >
                {/* Creator image fades in (full color) */}
                {creator.imageUrl && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                  >
                    <img
                      src={creator.imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: 'blur(28px) brightness(0.4)', transform: 'scale(1.12)' }}
                    />
                    <img
                      src={creator.imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ filter: 'brightness(0.72)' }}
                    />
                  </motion.div>
                )}
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, rgba(0,0,0,0.6) 100%)' }} />

                {/* Spotlight cone — more golden than SpotCinematic */}
                <motion.div
                  style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '120%', height: '95%',
                    background: 'linear-gradient(to bottom, rgba(255,235,160,0.42) 0%, rgba(201,168,76,0.22) 22%, rgba(201,168,76,0.08) 55%, transparent 100%)',
                    clipPath: 'polygon(37% 0%, 63% 0%, 89% 100%, 11% 100%)',
                    filter: 'blur(24px)', transformOrigin: '50% 0%',
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                />
                <motion.div
                  style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '85%', height: '72%',
                    background: 'linear-gradient(to bottom, rgba(255,255,220,0.28) 0%, rgba(255,240,160,0.12) 28%, rgba(201,168,76,0.04) 65%, transparent 100%)',
                    clipPath: 'polygon(43% 0%, 57% 0%, 73% 100%, 27% 100%)',
                    filter: 'blur(7px)', transformOrigin: '50% 0%',
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
                />
                {/* Lamp glow */}
                <motion.div
                  style={{
                    position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                    width: 100, height: 100, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,250,220,0.95) 0%, rgba(255,235,160,0.55) 38%, transparent 70%)',
                    filter: 'blur(16px)',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.55, delay: 0.25 }}
                />

                {/* "THE RETURN" editorial text */}
                <motion.div
                  className="absolute flex flex-col items-center text-center"
                  style={{ bottom: '14%', left: 0, right: 0, zIndex: 10 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p style={{ fontSize: 11, letterSpacing: '0.28em', color: 'rgba(201,168,76,0.62)', fontWeight: 600, fontStyle: 'italic', marginBottom: 10, textTransform: 'uppercase' }}>
                    The Return
                  </p>
                  <h1
                    style={{
                      fontSize: 'clamp(2.4rem, 11vw, 4rem)',
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      color: '#ffffff',
                      textShadow: '0 0 80px rgba(201,168,76,0.5), 0 0 28px rgba(201,168,76,0.22), 0 4px 32px rgba(0,0,0,0.95)',
                    }}
                  >
                    {creator.name}
                  </h1>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CHAPTER PHASE — the declaration ───────────────────────── */}
          <AnimatePresence>
            {phase === 'chapter' && (
              <motion.div
                key="chapter-phase"
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ zIndex: 5 }}
              >
                <motion.p
                  style={{
                    fontSize: 13, fontStyle: 'italic', fontWeight: 300,
                    color: 'rgba(201,168,76,0.78)', letterSpacing: '0.1em', marginBottom: 10,
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  Welcome back.
                </motion.p>
                <motion.h2
                  style={{
                    fontSize: 'clamp(1.6rem, 8vw, 2.4rem)',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    textShadow: '0 2px 28px rgba(0,0,0,0.9)',
                  }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  A new chapter begins.
                </motion.h2>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CAPSULE PHASE — rediscovery card ──────────────────────── */}
          <AnimatePresence>
            {phase === 'capsule' && (
              <motion.div
                key="capsule-phase"
                className="relative flex flex-col items-center"
                style={{ zIndex: 10, gap: '1.4rem' }}
              >
                {/* Card entrance — same trajectory as SpotCinematic */}
                <motion.div
                  style={{ perspective: '900px' }}
                  initial={{ opacity: 0, scale: 0.12, x: 160, y: 290, rotateZ: -60 }}
                  animate={{
                    opacity: [0, 1, 1, 1],
                    scale: [0.12, 1.06, 0.97, 1],
                    x: [160, -16, 6, 0],
                    y: [290, -20, 8, 0],
                    rotateZ: [-60, 4, -1.5, 0],
                  }}
                  transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], times: [0, 0.72, 0.88, 1] }}
                >
                  <motion.div
                    animate={{ rotateY: [-3, 3, -3], rotateX: [1.5, -1.5, 1.5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <RediscoveryCard
                      creator={creator}
                      entry={entry}
                      rediscoveredAt={rediscoveredAt}
                      chapterNum={chapterNum}
                    />
                  </motion.div>
                </motion.div>

                {/* Warm gold aura */}
                <motion.div
                  className="absolute pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  style={{
                    inset: -40, borderRadius: 60,
                    background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(201,168,76,0.12) 0%, transparent 70%)',
                    filter: 'blur(22px)', zIndex: -1,
                  }}
                />

                {/* Begin chapter button */}
                <motion.div
                  className="flex flex-col items-center gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p style={{ fontSize: 11, color: 'rgba(201,168,76,0.65)', letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase' }}>
                    ✦ Rediscovery Time Capsule
                  </p>
                  <button
                    onClick={handleBeginChapter}
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
                    Begin Chapter {ROMAN[chapterNum - 1] ?? chapterNum}
                  </button>
                  {userId && userName && (
                    <SpotSharePrompt
                      creator={creator}
                      userId={userId}
                      userName={userName}
                      shareType="rediscovered"
                    />
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DONE PHASE — theatrical close ─────────────────────────── */}
          <AnimatePresence>
            {phase === 'done' && (
              <motion.div
                key="done-phase"
                className="absolute inset-0 flex items-center justify-center"
                style={{ zIndex: 10 }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
              >
                {/* Gold flash */}
                <motion.div
                  className="absolute inset-0"
                  style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,235,150,0.5) 0%, rgba(201,168,76,0.22) 45%, transparent 75%)', zIndex: 1 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.55, times: [0, 0.2, 1], ease: 'easeOut' }}
                />

                {/* Expanding ring */}
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: 120, height: 120, border: '2px solid rgba(201,168,76,0.8)', zIndex: 2 }}
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 5.5, opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.2, 0, 0.4, 1] }}
                />
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: 80, height: 80, border: '1.5px solid rgba(255,240,180,0.6)', zIndex: 2 }}
                  initial={{ scale: 0.8, opacity: 0.7 }}
                  animate={{ scale: 5, opacity: 0 }}
                  transition={{ duration: 0.65, ease: [0.2, 0, 0.4, 1], delay: 0.06 }}
                />

                {/* Card rockets to vault */}
                <motion.div
                  style={{ perspective: '900px', zIndex: 3 }}
                  initial={{ scale: 1, y: 0, rotateZ: 0, opacity: 1, filter: 'blur(0px)' }}
                  animate={{
                    scale: [1, 1.06, 0],
                    y: [0, -10, -140],
                    rotateZ: [0, 2, 4],
                    opacity: [1, 1, 0],
                    filter: ['blur(0px)', 'blur(0px)', 'blur(5px)'],
                  }}
                  transition={{ duration: 0.75, times: [0, 0.22, 1], ease: [0.4, 0, 0.2, 1] }}
                >
                  <RediscoveryCard
                    creator={creator}
                    entry={entry}
                    rediscoveredAt={rediscoveredAt}
                    chapterNum={chapterNum}
                  />
                </motion.div>

                {/* Confirmation text */}
                <motion.div
                  className="absolute flex flex-col items-center"
                  style={{ bottom: 80, zIndex: 4 }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 0.85, times: [0, 0.2, 0.7, 1] }}
                >
                  <p style={{ fontSize: 11, letterSpacing: '0.28em', color: 'rgba(201,168,76,0.68)', fontWeight: 700, textTransform: 'uppercase' }}>
                    ✦ Rediscovered · Chapter {ROMAN[chapterNum - 1] ?? chapterNum} Begins
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

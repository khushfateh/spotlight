'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Creator } from '@/types'
import type { VaultEntry } from '@/hooks/useVault'
import SpotSharePrompt from '@/components/sharing/SpotSharePrompt'

type Phase = 'ambient' | 'opening' | 'achieve' | 'detail'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

// ── Achievement logic ─────────────────────────────────────────────────────────

function getAchievement(entry: VaultEntry): { headline: string; sub: string } {
  const gain = entry.currentScore - entry.momentumAtSpot
  const days = entry.spotDurationDays ??
    Math.max(1, Math.floor((Date.now() - entry.spotDate.getTime()) / 86400000))

  if (entry.spotterRank <= 10)
    return { headline: 'FIRST WAVE', sub: `Spotter #${entry.spotterRank} · One of the first to discover` }
  if (gain >= 28)
    return { headline: 'BEFORE THE BREAKOUT', sub: `+${gain} pts gained since your spot` }
  if (entry.spotterRank <= 50)
    return { headline: 'DISCOVERED EARLY', sub: `Spotter #${entry.spotterRank} · Before the wave` }
  if (days >= 120)
    return { headline: 'FAITHFUL DISCOVERY', sub: `${days} days of cultural discovery` }
  const dateStr = entry.spotDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  return { headline: 'FIRST SPOTTED', sub: dateStr }
}

// ── Vault Detail Card ─────────────────────────────────────────────────────────

function VaultDetailCard({
  creator,
  entry,
}: {
  creator: Creator
  entry: VaultEntry
}) {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const achievement = getAchievement(entry)
  const gain = entry.currentScore - entry.momentumAtSpot
  const isBreakout = gain >= 28
  const days = entry.spotDurationDays ??
    Math.max(1, Math.floor((Date.now() - entry.spotDate.getTime()) / 86400000))
  const chapters = (entry.rediscoveryCount ?? 0) + 1
  const movedOnAt = entry.archivedAt ?? new Date()

  const corners = [
    { top: 6, left: 6 },
    { top: 6, right: 6 },
    { bottom: 6, left: 6 },
    { bottom: 6, right: 6 },
  ] as const

  return (
    <div style={{
      width: 'min(78vw, 280px)',
      aspectRatio: '5 / 7',
      borderRadius: 16,
      background: 'linear-gradient(160deg, #0d0b09 0%, #080609 45%, #0d0b09 100%)',
      border: '2px solid rgba(201,168,76,0.6)',
      boxShadow: [
        '0 0 0 1px rgba(201,168,76,0.1)',
        '0 0 55px rgba(201,168,76,0.25)',
        '0 0 110px rgba(201,168,76,0.1)',
        '0 32px 80px rgba(0,0,0,0.98)',
        'inset 0 0 30px rgba(201,168,76,0.03)',
      ].join(', '),
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Holographic sweep */}
      <motion.div
        style={{
          position: 'absolute', inset: 0, zIndex: 15,
          borderRadius: 14, overflow: 'hidden', mixBlendMode: 'overlay',
        }}
        initial={{ x: '-110%' }}
        animate={{ x: '110%' }}
        transition={{ duration: 2.6, ease: 'easeInOut', delay: 0.6 }}
      >
        <div style={{
          width: '55%', height: '100%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,220,90,0.4) 18%, rgba(210,90,255,0.32) 36%, rgba(70,200,255,0.32) 54%, rgba(255,180,60,0.28) 88%, transparent 100%)',
        }} />
      </motion.div>

      {/* Fine gold grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, opacity: 0.042,
        pointerEvents: 'none',
        backgroundImage: [
          'repeating-linear-gradient(0deg, rgba(201,168,76,1) 0px, transparent 1px, transparent 9px)',
          'repeating-linear-gradient(90deg, rgba(201,168,76,1) 0px, transparent 1px, transparent 9px)',
        ].join(', '),
      }} />

      {/* Top gloss */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '38%', borderRadius: '14px 14px 0 0', zIndex: 14, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
      }} />

      {/* Creator image */}
      <div style={{ height: '40%', position: 'relative', overflow: 'hidden' }}>
        {creator.imageUrl ? (
          <>
            <img src={creator.imageUrl} alt="" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', transform: 'scale(1.08)',
              filter: 'blur(6px) brightness(0.26) saturate(0.35)',
            }} />
            <img src={creator.imageUrl} alt="" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'contain', filter: 'brightness(0.5) saturate(0.5)',
            }} />
          </>
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${creator.coverColor}`}
            style={{ filter: 'brightness(0.26) saturate(0.35)' }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, #080609 0%, rgba(8,6,9,0.55) 35%, transparent 70%)',
        }} />

        {/* Achievement badge */}
        <div style={{
          position: 'absolute', top: 9, left: 0, right: 0, textAlign: 'center', zIndex: 5,
        }}>
          <div style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 20,
            background: 'rgba(201,168,76,0.09)', border: '1px solid rgba(201,168,76,0.3)',
          }}>
            <p style={{
              fontSize: 6.5, letterSpacing: '0.22em', fontWeight: 800,
              color: 'rgba(201,168,76,0.9)', textTransform: 'uppercase',
            }}>
              ✦ {achievement.headline}
            </p>
          </div>
        </div>

        {chapters > 1 && (
          <div style={{ position: 'absolute', top: 9, right: 10, zIndex: 5 }}>
            <span style={{ fontSize: 7, color: 'rgba(200,210,225,0.7)', fontWeight: 700 }}>
              Ch. {ROMAN[Math.min(chapters - 1, ROMAN.length - 1)]}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '8px 14px 0', position: 'relative', zIndex: 10 }}>
        <p style={{
          color: '#fff', fontWeight: 900, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.02em',
        }}>
          {creator.name}
        </p>
        <p style={{
          fontSize: 7.5, color: 'rgba(201,168,76,0.5)', letterSpacing: '0.12em',
          marginTop: 1, fontFamily: 'monospace',
        }}>
          ${creator.ticker}
        </p>
        <p style={{
          fontSize: 7.5, color: 'rgba(255,255,255,0.16)', fontStyle: 'italic', marginTop: 2,
        }}>
          {achievement.sub}
        </p>

        <div style={{
          height: 1,
          background: 'linear-gradient(to right, rgba(201,168,76,0.65), rgba(201,168,76,0.22) 50%, rgba(201,168,76,0.65))',
          margin: '7px 0',
        }} />

        {/* Dates grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px', marginBottom: 7 }}>
          {([
            { label: 'SPOTTED', date: fmt(entry.spotDate), time: fmtTime(entry.spotDate) },
            { label: 'MOVED ON', date: fmt(movedOnAt), time: fmtTime(movedOnAt) },
          ] as const).map(({ label, date, time }) => (
            <div key={label}>
              <p style={{
                fontSize: 6, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.14)',
                fontWeight: 700, textTransform: 'uppercase', marginBottom: 2,
              }}>{label}</p>
              <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>{date}</p>
              <p style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.24)', fontWeight: 400 }}>{time}</p>
            </div>
          ))}
        </div>

        <div style={{
          height: 1,
          background: 'linear-gradient(to right, rgba(201,168,76,0.65), rgba(201,168,76,0.22) 50%, rgba(201,168,76,0.65))',
          marginBottom: 7,
        }} />

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px' }}>
          {([
            { label: 'SPOTTER RANK', value: `#${entry.spotterRank}`, gold: true },
            { label: 'DURATION', value: `${days} days`, gold: false },
            {
              label: 'MOMENTUM GAIN',
              value: `${gain >= 0 ? '+' : ''}${gain} pts${isBreakout ? ' ✦' : ''}`,
              gold: isBreakout,
            },
            {
              label: 'CHAPTERS',
              value: chapters > 1
                ? `${ROMAN[Math.min(chapters - 1, ROMAN.length - 1)]} chapters`
                : 'Chapter I',
              gold: chapters > 1,
            },
          ] as const).map(({ label, value, gold }) => (
            <div key={label}>
              <p style={{
                fontSize: 5.5, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.13)',
                fontWeight: 700, textTransform: 'uppercase', marginBottom: 1,
              }}>{label}</p>
              <p style={{
                fontSize: 10,
                fontWeight: gold ? 800 : 600,
                color: gold ? 'rgba(201,168,76,0.92)' : 'rgba(255,255,255,0.66)',
                textShadow: gold ? '0 0 12px rgba(201,168,76,0.35)' : 'none',
              }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '9%', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px',
        background: 'linear-gradient(to right, rgba(201,168,76,0.1), rgba(201,168,76,0.04) 50%, rgba(201,168,76,0.1))',
        borderTop: '1px solid rgba(201,168,76,0.2)',
      }}>
        <p style={{
          fontSize: 6.5, letterSpacing: '0.22em', color: 'rgba(201,168,76,0.42)',
          fontWeight: 600, textTransform: 'uppercase',
        }}>
          Discovery Vault · Spotlight
        </p>
        <p style={{ fontSize: 8, color: 'rgba(201,168,76,0.42)', fontWeight: 700 }}>
          #{entry.spotterRank}
        </p>
      </div>

      {/* Corner accents */}
      {corners.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos, width: 10, height: 10, zIndex: 20, pointerEvents: 'none',
          borderTop: 'bottom' in pos ? 'none' : '1.5px solid rgba(201,168,76,0.6)',
          borderBottom: 'top' in pos ? 'none' : '1.5px solid rgba(201,168,76,0.6)',
          borderLeft: 'right' in pos ? 'none' : '1.5px solid rgba(201,168,76,0.6)',
          borderRight: 'left' in pos ? 'none' : '1.5px solid rgba(201,168,76,0.6)',
        }} />
      ))}
    </div>
  )
}

// ── Vault Door Panel ──────────────────────────────────────────────────────────

function VaultDoor({ side, open }: { side: 'left' | 'right'; open: boolean }) {
  const isLeft = side === 'left'
  return (
    <motion.div
      style={{
        position: 'absolute',
        top: 0, bottom: 0,
        left: isLeft ? 0 : '50%',
        right: isLeft ? '50%' : 0,
        zIndex: 30,
        backgroundImage: [
          isLeft
            ? 'linear-gradient(100deg, #1f1608 0%, #2e2110 18%, rgba(201,168,76,0.12) 38%, #1f1608 55%, #0f0c06 80%, #070503 100%)'
            : 'linear-gradient(80deg, #070503 0%, #0f0c06 20%, #1f1608 45%, rgba(201,168,76,0.12) 62%, #2e2110 82%, #1f1608 100%)',
          'repeating-linear-gradient(to bottom, transparent 0px, transparent 6px, rgba(201,168,76,0.04) 6px, rgba(201,168,76,0.04) 7px)',
        ].join(', '),
        borderRight: isLeft ? '1px solid rgba(201,168,76,0.35)' : 'none',
        borderLeft: isLeft ? 'none' : '1px solid rgba(201,168,76,0.35)',
      }}
      animate={{ x: open ? (isLeft ? '-100%' : '100%') : 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 110, delay: 0 }}
    >
      {/* Rivet dots */}
      {[0.18, 0.5, 0.82].map(pct => (
        <div key={pct} style={{
          position: 'absolute',
          top: `${pct * 100}%`,
          [isLeft ? 'right' : 'left']: 8,
          width: 4, height: 4, borderRadius: '50%',
          background: 'rgba(201,168,76,0.28)',
          boxShadow: '0 0 3px rgba(201,168,76,0.2)',
        }} />
      ))}
    </motion.div>
  )
}

// ── Main Cinematic ────────────────────────────────────────────────────────────

export default function VaultOpeningCinematic({
  creator,
  entry,
  onClose,
  userId,
  userName,
}: {
  creator: Creator
  entry: VaultEntry
  onClose: () => void
  userId?: string
  userName?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>('ambient')
  const [visible, setVisible] = useState(true)

  const achievement = getAchievement(entry)
  const vaultEntryNum = String(entry.spotterRank).padStart(3, '0')

  useEffect(() => { setMounted(true) }, [])

  // ambient → opening (900ms)
  useEffect(() => {
    if (phase !== 'ambient') return
    const t = setTimeout(() => setPhase('opening'), 900)
    return () => clearTimeout(t)
  }, [phase])

  // opening → achieve (after door spring completes ~700ms)
  useEffect(() => {
    if (phase !== 'opening') return
    const t = setTimeout(() => setPhase('achieve'), 720)
    return () => clearTimeout(t)
  }, [phase])

  // achieve → detail (1.1s)
  useEffect(() => {
    if (phase !== 'achieve') return
    const t = setTimeout(() => setPhase('detail'), 1100)
    return () => clearTimeout(t)
  }, [phase])

  const handleClose = useCallback(() => setVisible(false), [])

  const doorsOpen = phase === 'opening' || phase === 'achieve' || phase === 'detail'

  if (!mounted) return null

  const overlay = (
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{ zIndex: 200 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-black" />

          {/* Ambient gold glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(201,168,76,0.1), transparent 70%)',
            }}
            animate={{ opacity: phase === 'ambient' ? [0.5, 1, 0.5] : 0.8 }}
            transition={phase === 'ambient'
              ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.5 }
            }
          />

          {/* ── AMBIENT: vault label above ──────────────────────────────── */}
          <AnimatePresence>
            {phase === 'ambient' && (
              <motion.div
                key="vault-label"
                className="absolute"
                style={{ top: '50%', marginTop: 'calc(min(78vw, 280px) * -0.78)' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p style={{
                  fontSize: 9, letterSpacing: '0.4em', fontWeight: 700,
                  color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', textAlign: 'center',
                }}>
                  Discovery Vault
                </p>
                <p style={{
                  fontSize: 7.5, letterSpacing: '0.2em', fontWeight: 600,
                  color: 'rgba(255,255,255,0.12)', textTransform: 'uppercase',
                  textAlign: 'center', marginTop: 4,
                }}>
                  Vault Entry · #{vaultEntryNum}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── VAULT CHAMBER (always present) ─────────────────────────── */}
          <div style={{
            position: 'relative',
            width: 'min(78vw, 280px)',
            aspectRatio: '5 / 7',
          }}>
            {/* Card — appears once doors open */}
            <motion.div
              style={{ position: 'absolute', inset: 0 }}
              animate={{
                opacity: doorsOpen ? 1 : 0,
                filter: doorsOpen ? 'blur(0px)' : 'blur(8px)',
                scale: doorsOpen ? 1 : 0.96,
              }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            >
              <VaultDetailCard creator={creator} entry={entry} />
            </motion.div>

            {/* Vault doors */}
            <VaultDoor side="left" open={doorsOpen} />
            <VaultDoor side="right" open={doorsOpen} />

            {/* Ambient vault face (shown while closed) */}
            <AnimatePresence>
              {phase === 'ambient' && (
                <motion.div
                  key="vault-face"
                  style={{
                    position: 'absolute', inset: 0, zIndex: 25,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p style={{
                    fontSize: 10, letterSpacing: '0.3em', fontWeight: 700,
                    color: 'rgba(201,168,76,0.25)', textTransform: 'uppercase',
                  }}>
                    Opening
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── ACHIEVE: achievement flash ──────────────────────────────── */}
          <AnimatePresence>
            {phase === 'achieve' && (
              <motion.div
                key="achieve"
                className="absolute"
                style={{
                  top: '50%',
                  marginTop: 'calc(min(78vw, 280px) * 0.7 + 16px)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
              >
                <p style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.22em',
                  color: 'rgba(201,168,76,0.85)', textTransform: 'uppercase', textAlign: 'center',
                }}>
                  ✦ {achievement.headline}
                </p>
                <p style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.32)', fontStyle: 'italic',
                  textAlign: 'center', marginTop: 6,
                }}>
                  {achievement.sub}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DETAIL: close button + share ────────────────────────── */}
          <AnimatePresence>
            {phase === 'detail' && (
              <motion.div
                key="close-btn"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                style={{
                  position: 'absolute', bottom: 44,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                }}
              >
                {userId && userName && (
                  <SpotSharePrompt
                    creator={creator}
                    userId={userId}
                    userName={userName}
                    shareType="discovery_record"
                  />
                )}
                <button
                  onClick={handleClose}
                  style={{
                    fontSize: 13, fontWeight: 600, letterSpacing: '0.06em',
                    color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28,
                    padding: '11px 36px', cursor: 'pointer',
                  }}
                >
                  Close Vault
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(overlay, document.body)
}

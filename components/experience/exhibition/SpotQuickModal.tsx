'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { spotCreator } from '@/lib/services/spotterService'

export interface SpotIntent {
  name:     string
  ticker:   string
  imageUrl: string
}

type Phase = 'confirm' | 'spotting' | 'success' | 'unauthed'

const MONO  = "'JetBrains Mono', monospace"
const SERIF = "'Cormorant Garamond', Georgia, serif"
const GOLD  = '#C9A84C'
const VOID  = '#050508'

export default function SpotQuickModal() {
  const [intent,        setIntent]        = useState<SpotIntent | null>(null)
  const [phase,         setPhase]         = useState<Phase>('confirm')
  const [spotterNumber, setSpotterNumber] = useState<number | null>(null)
  const [visible,       setVisible]       = useState(false)

  const { currentUser, isAuthenticated } = useAuth()
  const router = useRouter()

  const open = useCallback((detail: SpotIntent) => {
    setIntent(detail)
    setPhase(isAuthenticated ? 'confirm' : 'unauthed')
    setSpotterNumber(null)
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }, [isAuthenticated])

  const close = useCallback(() => {
    setVisible(false)
    setTimeout(() => { setIntent(null); setPhase('confirm') }, 300)
  }, [])

  useEffect(() => {
    const h = (e: Event) => open((e as CustomEvent<SpotIntent>).detail)
    window.addEventListener('spotlight:spot-intent', h)
    return () => window.removeEventListener('spotlight:spot-intent', h)
  }, [open])

  useEffect(() => {
    if (!intent) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [intent, close])

  const handleSpot = async () => {
    if (!intent || !currentUser) return
    setPhase('spotting')
    const result = await spotCreator(currentUser.id, intent.ticker)
    if (result) {
      setSpotterNumber(result.spotterNumber)
      setPhase('success')
    } else {
      setPhase('confirm')
    }
  }

  if (!intent) return null

  const label = (txt: string) => ({
    fontFamily:    MONO,
    fontSize:      '8px',
    letterSpacing: '0.40em',
    textTransform: 'uppercase' as const,
    color:         'rgba(201,168,76,0.55)',
    margin:        0,
  })

  return (
    <>
      <style>{`
        @keyframes spotPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        .spot-spotting { animation: spotPulse 1.4s ease-in-out infinite }
        .spot-primary:hover { background: #DEB95E !important }
        .spot-secondary:hover { color: rgba(255,255,255,0.60) !important }
        .spot-view:hover { color: rgba(201,168,76,0.90) !important }
      `}</style>

      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        onClick={close}
        style={{
          position:        'fixed',
          inset:           0,
          zIndex:          1200,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          backgroundColor: visible ? 'rgba(5,5,8,0.82)' : 'rgba(5,5,8,0)',
          backdropFilter:  visible ? 'blur(14px)' : 'blur(0px)',
          transition:      'background-color .28s ease, backdrop-filter .28s ease',
        }}
      >
        {/* ── Modal card ──────────────────────────────────────────────────── */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width:      328,
            background: 'rgba(8,7,11,0.97)',
            border:     '1px solid rgba(201,168,76,0.22)',
            borderRadius: '3px',
            overflow:   'hidden',
            transform:  visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(16px)',
            opacity:    visible ? 1 : 0,
            transition: 'transform .34s cubic-bezier(.22,1,.36,1), opacity .28s ease',
          }}
        >
          {/* Portrait strip */}
          {intent.imageUrl && (
            <div style={{ position: 'relative', height: 148, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={intent.imageUrl} alt={intent.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }}
              />
              <div style={{
                position:   'absolute',
                inset:      0,
                background: 'linear-gradient(to bottom, transparent 30%, rgba(8,7,11,0.97) 100%)',
              }}/>
              {/* Close × */}
              <button
                onClick={close}
                style={{
                  position: 'absolute', top: 10, right: 12,
                  background: 'rgba(5,5,8,0.65)', border: 'none',
                  borderRadius: '50%', width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.55)', fontSize: '14px',
                  cursor: 'pointer', lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <div style={{ padding: intent.imageUrl ? '16px 24px 28px' : '28px 24px 28px' }}>

            {/* CONFIRM phase */}
            {phase === 'confirm' && (
              <>
                <p style={{ ...label(''), marginBottom: 6 }}>
                  SPOTLIGHT ◆ {intent.ticker}
                </p>
                <h2 style={{
                  fontFamily:    SERIF,
                  fontSize:      '24px',
                  fontWeight:    300,
                  color:         'rgba(255,255,255,0.93)',
                  margin:        '0 0 22px',
                  lineHeight:    1.1,
                  letterSpacing: '0.02em',
                }}>
                  {intent.name}
                </h2>

                {/* Primary SPOT button */}
                <button
                  className="spot-primary"
                  onClick={handleSpot}
                  style={{
                    display:       'block',
                    width:         '100%',
                    padding:       '15px 0',
                    background:    GOLD,
                    border:        'none',
                    borderRadius:  '2px',
                    fontFamily:    MONO,
                    fontSize:      '11px',
                    fontWeight:    600,
                    letterSpacing: '0.42em',
                    textTransform: 'uppercase' as const,
                    color:         VOID,
                    cursor:        'pointer',
                    marginBottom:  '12px',
                    transition:    'background .18s ease',
                  }}
                >
                  ◆ &nbsp; SPOT
                </button>

                {/* View Artist secondary */}
                <button
                  className="spot-secondary"
                  onClick={() => { close(); router.push(`/creator/${intent.ticker}`) }}
                  style={{
                    display:       'block',
                    width:         '100%',
                    padding:       '2px 0',
                    background:    'none',
                    border:        'none',
                    fontFamily:    MONO,
                    fontSize:      '8px',
                    letterSpacing: '0.30em',
                    textTransform: 'uppercase' as const,
                    color:         'rgba(255,255,255,0.30)',
                    cursor:        'pointer',
                    textAlign:     'center' as const,
                    transition:    'color .20s ease',
                  }}
                >
                  View Artist →
                </button>
              </>
            )}

            {/* SPOTTING phase */}
            {phase === 'spotting' && (
              <div style={{ padding: '8px 0', textAlign: 'center' as const }}>
                <p className="spot-spotting" style={{
                  ...label(''),
                  fontSize:      '9px',
                  letterSpacing: '0.38em',
                  color:         'rgba(201,168,76,0.75)',
                }}>
                  Spotting…
                </p>
              </div>
            )}

            {/* SUCCESS phase */}
            {phase === 'success' && (
              <div style={{ textAlign: 'center' as const }}>
                <p style={{ ...label(''), marginBottom: 10 }}>You Spotted</p>
                <h2 style={{
                  fontFamily:    SERIF,
                  fontSize:      '26px',
                  fontWeight:    300,
                  color:         GOLD,
                  margin:        '0 0 4px',
                  letterSpacing: '0.02em',
                }}>
                  {intent.name}
                </h2>
                {spotterNumber !== null && (
                  <p style={{
                    fontFamily:    MONO,
                    fontSize:      '9px',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase' as const,
                    color:         'rgba(255,255,255,0.42)',
                    margin:        '0 0 22px',
                  }}>
                    Spotter #{spotterNumber}
                  </p>
                )}
                <button
                  className="spot-view"
                  onClick={() => { close(); router.push(`/creator/${intent.ticker}`) }}
                  style={{
                    padding:       '12px 28px',
                    background:    'transparent',
                    border:        '1px solid rgba(201,168,76,0.38)',
                    borderRadius:  '2px',
                    fontFamily:    MONO,
                    fontSize:      '9px',
                    fontWeight:    500,
                    letterSpacing: '0.30em',
                    textTransform: 'uppercase' as const,
                    color:         'rgba(201,168,76,0.68)',
                    cursor:        'pointer',
                    transition:    'color .20s ease',
                  }}
                >
                  View Artist →
                </button>
              </div>
            )}

            {/* UNAUTHED phase */}
            {phase === 'unauthed' && (
              <>
                <p style={{ ...label(''), marginBottom: 6 }}>
                  SPOTLIGHT ◆ {intent.ticker}
                </p>
                <h2 style={{
                  fontFamily:    SERIF,
                  fontSize:      '22px',
                  fontWeight:    300,
                  color:         'rgba(255,255,255,0.93)',
                  margin:        '0 0 10px',
                  lineHeight:    1.1,
                }}>
                  {intent.name}
                </h2>
                <p style={{
                  fontFamily:    MONO,
                  fontSize:      '8px',
                  letterSpacing: '0.10em',
                  color:         'rgba(255,255,255,0.36)',
                  margin:        '0 0 22px',
                  lineHeight:    1.8,
                }}>
                  Sign in to claim your discovery and be remembered as an early spotter.
                </p>
                <button
                  className="spot-primary"
                  onClick={() => { close(); router.push('/login') }}
                  style={{
                    display:       'block',
                    width:         '100%',
                    padding:       '15px 0',
                    background:    GOLD,
                    border:        'none',
                    borderRadius:  '2px',
                    fontFamily:    MONO,
                    fontSize:      '10px',
                    fontWeight:    600,
                    letterSpacing: '0.38em',
                    textTransform: 'uppercase' as const,
                    color:         VOID,
                    cursor:        'pointer',
                    transition:    'background .18s ease',
                  }}
                >
                  Sign In to Spot
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

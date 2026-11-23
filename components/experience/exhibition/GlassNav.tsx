'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { exhibitionState } from './exhibitionState'
import { useAuth } from '@/context/AuthContext'
import { useUser } from '@/context/UserContext'

// ─────────────────────────────────────────────────────────────────────────────
// ProfileChip — shown when signed in; avatar initials + username + dropdown
// ─────────────────────────────────────────────────────────────────────────────
function ProfileChip({ avatar, username, onSignOut }: {
  avatar:    string
  username:  string
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const MONO  = "'JetBrains Mono', monospace"
  const GOLD  = '#C9A84C'
  const clean = username.replace('@', '')

  const menuItems = [
    { label: 'Profile',      href: '/profile' },
    { label: 'Discoveries',  href: '/discoveries' },
    { label: 'Explore',      href: '/explore' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Chip trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         8,
          padding:     '4px 10px 4px 4px',
          borderRadius: 2,
          background:  open ? 'rgba(201,168,76,0.10)' : 'rgba(201,168,76,0.05)',
          border:      `1px solid ${open ? 'rgba(201,168,76,0.40)' : 'rgba(201,168,76,0.18)'}`,
          cursor:      'pointer',
          transition:  'all 0.2s ease',
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background   = 'rgba(201,168,76,0.10)'
            e.currentTarget.style.borderColor  = 'rgba(201,168,76,0.35)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background   = 'rgba(201,168,76,0.05)'
            e.currentTarget.style.borderColor  = 'rgba(201,168,76,0.18)'
          }
        }}
      >
        {/* Avatar ring */}
        <div style={{
          width:          26,
          height:         26,
          borderRadius:   '50%',
          background:     'rgba(201,168,76,0.14)',
          border:         `1px solid ${GOLD}`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontFamily:     MONO,
          fontSize:       8,
          fontWeight:     700,
          color:          GOLD,
          letterSpacing:  '0.04em',
          flexShrink:     0,
          boxShadow:      '0 0 8px rgba(201,168,76,0.20)',
        }}>
          {avatar.slice(0, 2).toUpperCase()}
        </div>

        {/* Username */}
        <span style={{
          fontFamily:    MONO,
          fontSize:      9,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color:         'rgba(255,255,255,0.65)',
          fontWeight:    400,
        }}>
          {clean}
        </span>

        {/* Chevron */}
        <span style={{
          fontSize:    8,
          color:       'rgba(201,168,76,0.45)',
          marginLeft:  2,
          display:     'inline-block',
          transition:  'transform 0.2s ease',
          transform:   open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▾
        </span>
      </button>

      {/* Dropdown */}
      <div style={{
        position:     'absolute',
        top:          'calc(100% + 10px)',
        right:        0,
        minWidth:     160,
        background:   'rgba(5,5,8,0.96)',
        backdropFilter:        'blur(32px)',
        WebkitBackdropFilter:  'blur(32px)',
        border:       '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        boxShadow:    '0 16px 48px rgba(0,0,0,0.72), 0 0 0 0.5px rgba(201,168,76,0.08)',
        opacity:      open ? 1 : 0,
        transform:    open ? 'translateY(0)' : 'translateY(-6px)',
        pointerEvents: open ? 'auto' : 'none',
        transition:   'opacity 0.18s ease, transform 0.18s ease',
        zIndex:       60,
        overflow:     'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding:      '12px 14px 10px',
          borderBottom: '1px solid rgba(201,168,76,0.10)',
        }}>
          <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.40)', marginBottom: 2 }}>
            ◈ Signed in as
          </p>
          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.80)', fontWeight: 600 }}>
            @{clean}
          </p>
        </div>

        {/* Menu items */}
        {menuItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            style={{
              display:       'block',
              padding:       '10px 14px',
              fontFamily:    MONO,
              fontSize:      9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,0.50)',
              textDecoration: 'none',
              transition:    'all 0.15s ease',
              borderLeft:    '2px solid transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color       = GOLD
              e.currentTarget.style.background  = 'rgba(201,168,76,0.06)'
              e.currentTarget.style.borderLeftColor = 'rgba(201,168,76,0.50)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color       = 'rgba(255,255,255,0.50)'
              e.currentTarget.style.background  = 'transparent'
              e.currentTarget.style.borderLeftColor = 'transparent'
            }}
          >
            {item.label}
          </Link>
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(201,168,76,0.08)', margin: '2px 0' }} />

        {/* Sign out */}
        <button
          onClick={() => { setOpen(false); onSignOut() }}
          style={{
            display:       'block',
            width:         '100%',
            textAlign:     'left',
            padding:       '10px 14px',
            fontFamily:    MONO,
            fontSize:      9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.28)',
            background:    'none',
            border:        'none',
            cursor:        'pointer',
            transition:    'all 0.15s ease',
            borderLeft:    '2px solid transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color            = 'rgba(224,85,85,0.85)'
            e.currentTarget.style.background       = 'rgba(224,85,85,0.05)'
            e.currentTarget.style.borderLeftColor  = 'rgba(224,85,85,0.35)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color            = 'rgba(255,255,255,0.28)'
            e.currentTarget.style.background       = 'transparent'
            e.currentTarget.style.borderLeftColor  = 'transparent'
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GlassNav
// ─────────────────────────────────────────────────────────────────────────────
export default function GlassNav() {
  const [visible, setVisible] = useState(true)
  const [audioOn, setAudioOn] = useState(false)
  const hasScrolledRef = useRef(false)

  const { isAuthenticated, isLoading, signOut } = useAuth()
  const { user }                                = useUser()
  const { username, avatar }                    = user
  const router = useRouter()

  const showAuth    = !isLoading && !isAuthenticated
  const showProfile = !isLoading && isAuthenticated

  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainRef     = useRef<GainNode | null>(null)
  const rafRef      = useRef<number>(0)

  // Nav starts visible. Only hides if user scrolled past threshold and returned to top.
  useEffect(() => {
    const tick = () => {
      if (exhibitionState.progress > 0.02) hasScrolledRef.current = true
      if (hasScrolledRef.current) {
        if (exhibitionState.progress < 0.003 && visible)   setVisible(false)
        if (exhibitionState.progress >= 0.003 && !visible) setVisible(true)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // Ambient audio toggle
  const toggleAudio = () => {
    if (audioOn) {
      gainRef.current?.gain.setTargetAtTime(0, audioCtxRef.current!.currentTime, 0.5)
      setTimeout(() => {
        audioCtxRef.current?.close()
        audioCtxRef.current = null
        gainRef.current = null
      }, 2000)
      setAudioOn(false)
      return
    }

    const ctx  = new AudioContext()
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.setTargetAtTime(0.04, ctx.currentTime, 2)
    gain.connect(ctx.destination)

    const drone = ctx.createOscillator()
    drone.type = 'sine'
    drone.frequency.value = 55
    drone.connect(gain)
    drone.start()

    const harm = ctx.createOscillator()
    harm.type = 'sine'
    harm.frequency.value = 110
    const harmGain = ctx.createGain()
    harmGain.gain.value = 0.3
    harm.connect(harmGain)
    harmGain.connect(gain)
    harm.start()

    const bufLen = ctx.sampleRate * 3
    const noiseBuffer = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.15
    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer
    noiseSource.loop = true
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 800
    noiseSource.connect(noiseFilter)
    noiseFilter.connect(gain)
    noiseSource.start()

    audioCtxRef.current = ctx
    gainRef.current     = gain
    setAudioOn(true)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const NAV_ITEMS = [
    { label: 'Discover', href: '/explore' },
    { label: 'Vault',    href: '/discoveries' },
    { label: 'Pulse',    href: '/spotlight' },
  ]

  return (
    <nav
      aria-label="SPOTLIGHT navigation"
      style={{
        position:       'fixed',
        top:            0,
        left:           0,
        right:          0,
        zIndex:         50,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 28px',
        height:         52,
        background:     'rgba(5,5,8,0.52)',
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        borderBottom:   '1px solid rgba(201,168,76,0.08)',
        transition:     'opacity 0.6s ease, transform 0.6s ease',
        opacity:        visible ? 1 : 0,
        transform:      visible ? 'translateY(0)' : 'translateY(-100%)',
        pointerEvents:  visible ? 'auto' : 'none',
      }}
    >
      {/* Logo mark */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <span style={{ color: '#C9A84C', fontSize: 18, lineHeight: 1 }}>◈</span>
        <span style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      10,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color:         'rgba(255,255,255,0.8)',
          fontWeight:    400,
        }}>
          SPOTLIGHT
        </span>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {/* Nav items */}
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              transition:    'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
          >
            {item.label}
          </Link>
        ))}

        {/* Spot CTA */}
        <Link
          href="/explore"
          style={{
            fontFamily:      "'JetBrains Mono', monospace",
            fontSize:        9,
            letterSpacing:   '0.22em',
            textTransform:   'uppercase',
            color:           '#0a0808',
            backgroundColor: '#C9A84C',
            padding:         '7px 16px',
            borderRadius:    2,
            textDecoration:  'none',
            fontWeight:      500,
            display:         'flex',
            alignItems:      'center',
            gap:             6,
            transition:      'background-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E8C96A')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C9A84C')}
        >
          Spot ↗
        </Link>

        {/* Auth CTAs — signed out */}
        {showAuth && (
          <>
            <Link
              href="/login"
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      9,
                letterSpacing: '0.20em',
                textTransform: 'uppercase',
                color:         'rgba(255,255,255,0.50)',
                background:    'none',
                border:        '1px solid rgba(255,255,255,0.12)',
                padding:       '6px 14px',
                borderRadius:  2,
                textDecoration: 'none',
                transition:    'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.40)'
                e.currentTarget.style.color = 'rgba(201,168,76,0.85)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.50)'
              }}
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              style={{
                fontFamily:     "'JetBrains Mono', monospace",
                fontSize:       9,
                letterSpacing:  '0.22em',
                textTransform:  'uppercase',
                color:          'rgba(201,168,76,0.85)',
                background:     'rgba(201,168,76,0.08)',
                border:         '1px solid rgba(201,168,76,0.30)',
                padding:        '6px 14px',
                borderRadius:   2,
                textDecoration: 'none',
                transition:     'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background  = 'rgba(201,168,76,0.16)'
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.58)'
                e.currentTarget.style.color       = '#C9A84C'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'rgba(201,168,76,0.08)'
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.30)'
                e.currentTarget.style.color       = 'rgba(201,168,76,0.85)'
              }}
            >
              Join ◈
            </Link>
          </>
        )}

        {/* Profile chip — signed in */}
        {showProfile && (
          <ProfileChip
            avatar={avatar}
            username={username}
            onSignOut={handleSignOut}
          />
        )}

        {/* Atmosphere toggle */}
        <button
          onClick={toggleAudio}
          title={audioOn ? 'Mute atmosphere' : 'Enable atmosphere'}
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color:         audioOn ? '#C9A84C' : 'rgba(255,255,255,0.3)',
            background:    'none',
            border:        'none',
            cursor:        'pointer',
            padding:       '4px 0',
            transition:    'color 0.3s',
          }}
        >
          {audioOn ? '◉ ATMOS' : '○ ATMOS'}
        </button>
      </div>
    </nav>
  )
}

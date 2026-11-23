'use client'

import { useEffect, useRef, useState } from 'react'
import { homeState } from './homeState'

// ── Story chapters ─────────────────────────────────────────────────────────────
// Each chapter is a beat in the narrative. The user moves through them by
// scrolling — but they should feel like turning pages, not scrolling a page.
const STORIES = [
  {
    label:    '01',
    headline: 'Discover Future Icons\nBefore Everyone Else',
    sub:      'The world remembers the breakthrough.\nSPOTLIGHT remembers who saw it first.',
    cta:      null,
  },
  {
    label:    '02',
    headline: 'Every Legend\nWas Once Unknown',
    sub:      'Before Coachella. Before the charts.\nBefore the world knew their name.',
    cta:      null,
  },
  {
    label:    '03',
    headline: 'Your Taste Creates\nTomorrow\'s Culture',
    sub:      'Every Spot becomes part of\nyour Discovery Legacy.',
    cta:      null,
  },
  {
    label:    '04',
    headline: 'Collect Moments Before\nThe World Notices',
    sub:      'Every spot is a timestamp.\nEvidence you were early.',
    cta:      null,
  },
  {
    label:    '05',
    headline: 'The Next Icon Is\nAlready Moving',
    sub:      null,
    cta:      'Begin Discovering →',
  },
]

// ── Transition states ──────────────────────────────────────────────────────────
// 'hidden'   — panel not yet visible (before phase 3 + scroll)
// 'entering' — styles at their "off" position (opacity 0, Y+18, blur 6px) — triggers CSS
// 'visible'  — styles at their "on" position — CSS transitions animate in
// 'exiting'  — styles return to "off" position — CSS transitions animate out
type TxState = 'hidden' | 'entering' | 'visible' | 'exiting'

export default function LeftStorytelling() {
  const [section,    setSection]    = useState(0)
  const [panelReady, setPanelReady] = useState(false)
  const [txState,    setTxState]    = useState<TxState>('hidden')

  // displayRef  — section currently on screen
  // targetRef   — section scroll position wants us to be at
  // steppingRef — true while a step-transition chain is running
  const displayRef    = useRef(0)
  const targetRef     = useRef(0)
  const panelReadyRef = useRef(false)
  const txStateRef    = useRef<TxState>('hidden')
  const rafRef        = useRef<number>(0)
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const steppingRef   = useRef(false)

  const setTx = (s: TxState) => { txStateRef.current = s; setTxState(s) }
  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  // Advance the display exactly ONE section toward targetRef.current.
  // glimpse=true  → fast flash timing (for intermediate steps while fast-scrolling)
  // glimpse=false → normal transition timing (for the settled section)
  //
  // The function is recursive: after landing on a section it checks whether the
  // target has moved further and, if so, calls itself again. This means ANY
  // change to targetRef.current (including mid-chain scroll events) is picked
  // up naturally on the next step without needing to abort the current one.
  const step = useRef((glimpse: boolean) => {
    const disp   = displayRef.current
    const target = targetRef.current

    if (disp === target) {
      steppingRef.current = false
      return
    }

    steppingRef.current = true

    const next    = disp + (target > disp ? 1 : -1)

    setTx('exiting')
    clearTimer()

    // Exit duration: very short for glimpse flashes, normal for settled transition
    timerRef.current = setTimeout(() => {
      displayRef.current = next
      setSection(next)
      setTx('entering')

      timerRef.current = setTimeout(() => {
        setTx('visible')

        if (displayRef.current !== targetRef.current) {
          // Still not at target — continue the chain.
          // Always use glimpse timing for intermediate steps.
          timerRef.current = setTimeout(() => step.current(true), 110)
        } else {
          steppingRef.current = false
        }
      }, 32)
    }, glimpse ? 65 : 420)
  })

  useEffect(() => {
    const tick = () => {
      const p     = homeState.scrollProgress
      const phase = homeState.revealPhase
      const ready = phase >= 3 && p > 0.04

      if (ready !== panelReadyRef.current) {
        panelReadyRef.current = ready
        setPanelReady(ready)

        if (ready) {
          // First appearance: initialise display to current scroll position
          // (no need to animate through sections the user never saw)
          const sec = Math.min(4, Math.floor(p / 0.20))
          displayRef.current = sec
          targetRef.current  = sec
          steppingRef.current = false
          setSection(sec)
          clearTimer()
          setTx('entering')
          timerRef.current = setTimeout(() => setTx('visible'), 32)
        } else {
          // Panel leaving
          clearTimer()
          steppingRef.current = false
          setTx('exiting')
          timerRef.current = setTimeout(() => setTx('hidden'), 680)
        }
      }

      if (ready) {
        const sec = Math.min(4, Math.floor(p / 0.20))

        if (sec !== targetRef.current) {
          targetRef.current = sec

          // If the step chain is already running it will pick up the new target
          // on its next iteration. Only kick off a new chain if idle.
          if (!steppingRef.current) {
            const gap = Math.abs(sec - displayRef.current)
            step.current(gap > 1)
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimer()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const story   = STORIES[section]
  const showing = txState === 'entering' || txState === 'visible'

  // Shared transition properties — tuned independently for exit vs entry.
  // Exit: quicker blur+fade upward (the world is moving on).
  // Entry: springs in with a slight overshoot feel (the chapter announces itself).
  const exitTx  = 'opacity 0.38s ease, transform 0.38s ease, filter 0.38s ease'
  const enterTx = 'opacity 0.70s ease 0.04s, transform 0.70s cubic-bezier(0.22,1,0.36,1) 0.04s, filter 0.70s ease 0.04s'

  const containerStyle: React.CSSProperties = {
    opacity:    showing ? 1 : 0,
    transform:  showing ? 'translateY(0)' : 'translateY(20px)',
    filter:     showing ? 'blur(0px)' : 'blur(7px)',
    transition: txState === 'exiting' ? exitTx : enterTx,
    maxWidth:   440,
  }

  // Sub-copy and CTA arrive with a short additional stagger after the headline.
  const subStyle: React.CSSProperties = {
    opacity:    showing ? 1 : 0,
    transform:  showing ? 'translateY(0)' : 'translateY(10px)',
    transition: txState === 'exiting'
      ? 'opacity 0.32s ease, transform 0.32s ease'
      : 'opacity 0.65s ease 0.18s, transform 0.65s cubic-bezier(0.22,1,0.36,1) 0.18s',
  }

  return (
    <div
      style={{
        position:       'absolute',
        left:           0,
        top:            0,
        bottom:         0,
        width:          '46%',
        zIndex:         12,
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        padding:        '0 0 0 44px',
        pointerEvents:  'none',
        // Panel container fades in/out independently of inner content
        opacity:        panelReady ? 1 : 0,
        transition:     'opacity 1.1s ease',
      }}
    >
      {/* Gradient mask: left edge dense, dissolves to transparent at 100% */}
      <div aria-hidden style={{
        position:   'absolute',
        inset:      0,
        background: 'linear-gradient(to right, rgba(5,5,8,0.97) 0%, rgba(5,5,8,0.92) 55%, rgba(5,5,8,0) 100%)',
        zIndex:     -1,
      }} />

      {/* Content block — all children share the container's translate/blur/opacity */}
      <div style={containerStyle}>

        {/* Chapter label — small, far above the headline, establishes the beat */}
        <p style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      '8px',
          letterSpacing: '0.44em',
          textTransform: 'uppercase',
          color:         '#C9A84C',
          margin:        '0 0 26px 0',
          opacity:       0.80,
        }}>
          {story.label} — SPOTLIGHT
        </p>

        {/* Headline — the emotional center */}
        <h2 style={{
          fontFamily:    "'Cormorant Garamond', Georgia, serif",
          fontSize:      'clamp(38px, 4.0vw, 64px)',
          fontWeight:    300,
          lineHeight:    1.04,
          letterSpacing: '0.01em',
          color:         'rgba(255,255,255,0.93)',
          margin:        '0 0 24px 0',
          whiteSpace:    'pre-line',
          textShadow:    '0 2px 80px rgba(0,0,0,0.98)',
        }}>
          {story.headline}
        </h2>

        {/* Sub-copy — staggered entry after headline */}
        {story.sub && (
          <p style={{
            ...subStyle,
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '11px',
            letterSpacing: '0.07em',
            color:         'rgba(201,168,76,0.60)',
            lineHeight:    1.88,
            margin:        0,
            maxWidth:      320,
            whiteSpace:    'pre-line',
          }}>
            {story.sub}
          </p>
        )}

        {/* CTA — final chapter only, pointer events re-enabled */}
        {story.cta && (
          <a
            href="/explore"
            style={{
              ...subStyle,
              display:         'inline-block',
              marginTop:       36,
              fontFamily:      "'JetBrains Mono', monospace",
              fontSize:        '9px',
              letterSpacing:   '0.30em',
              textTransform:   'uppercase',
              color:           '#0a0808',
              backgroundColor: '#C9A84C',
              padding:         '14px 28px',
              textDecoration:  'none',
              borderRadius:    2,
              fontWeight:      500,
              pointerEvents:   'auto',
              // Override sub-copy transition delay for CTA
              transition: txState === 'exiting'
                ? 'opacity 0.32s ease, transform 0.32s ease, background-color 0.25s'
                : 'opacity 0.65s ease 0.28s, transform 0.65s cubic-bezier(0.22,1,0.36,1) 0.28s, background-color 0.25s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E8C96A')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C9A84C')}
          >
            {story.cta}
          </a>
        )}

        {/* Chapter progress — horizontal tick marks */}
        <div style={{
          display:    'flex',
          gap:        10,
          marginTop:  54,
          alignItems: 'center',
        }}>
          {STORIES.map((_, i) => (
            <div
              key={i}
              style={{
                width:           i === section ? 28 : 5,
                height:          1,
                backgroundColor: i === section
                  ? '#C9A84C'
                  : 'rgba(255,255,255,0.12)',
                borderRadius:    1,
                transition:      'width 0.55s cubic-bezier(0.22,1,0.36,1), background-color 0.55s ease',
              }}
            />
          ))}
        </div>

      </div>
    </div>
  )
}

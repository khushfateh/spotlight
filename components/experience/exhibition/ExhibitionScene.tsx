'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, useProgress } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { exhibitionState } from './exhibitionState'
import SaxophoneVitrine from './SaxophoneVitrine'
import GoldDustCloud    from './GoldDustCloud'
import EnvironmentLayer from './EnvironmentLayer'
import OrbitalCards     from './OrbitalCards'
import CameraOrchestrator from './CameraOrchestrator'

// ── Loading vignette ──────────────────────────────────────────────────────────
function CanvasLoader() {
  const { progress } = useProgress()
  if (progress >= 100) return null
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#050508',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: '1px solid #C9A84C',
        animation: 'spin 0.9s linear infinite',
      }} />
      <p style={{
        marginTop: 16,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#666',
      }}>
        {Math.round(progress)}%
      </p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Three-point museum lighting ───────────────────────────────────────────────
function StudioLighting() {
  return (
    <Environment resolution={512}>
      {/* Key light — warm white, broad top highlight */}
      <Lightformer intensity={7}   position={[0, 6, 6]}     scale={[18, 1.6, 1]} color="#fff4d8" />
      {/* Rim light — emerald, upper right back — gives depth and age */}
      <Lightformer intensity={3.5} position={[5, 4, -4]}    scale={[1, 12, 1]}   color="#1C6B5E" />
      {/* Fill — violet, left — deep shadow suggestion */}
      <Lightformer intensity={1.2} position={[-7, 1, 2]}    scale={[10, 12, 1]}  color="#2D1B69" />
      {/* Left vertical streak — shimmering left flank */}
      <Lightformer intensity={4.5} position={[-4, 2, 5]}    scale={[1.2, 16, 1]} color="#ffe7b0" />
      {/* Right vertical streak */}
      <Lightformer intensity={4}   position={[4, -1, 5]}    scale={[1.2, 16, 1]} color="#ffcf73" />
      {/* Dark floor — deep under-shadow */}
      <Lightformer intensity={0.1} position={[0, -7, -4]}   scale={[20, 14, 1]}  color="#050205" />
    </Environment>
  )
}

// ── Scene background colour — set once, room shifts are handled in EnvironmentLayer
function SceneBackground() {
  return <color attach="background" args={['#050508']} />
}

// ── Cursor-tracking point light on saxophone surface ─────────────────────────
function CursorLight() {
  const lightRef = useRef<THREE.PointLight>(null)
  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 4.5]}
      color="#ffecc0"
      intensity={22}
      distance={9}
      decay={2}
    />
  )
}

// ── Text overlay — all exhibition labels rendered as DOM ─────────────────────
function ExhibitionOverlay() {
  const [state, setState] = useState({
    showHeadline:   false,
    showScrollHint: false,
    room:           0,
    p:              0,
  })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const tick = () => {
      const p = exhibitionState.progress
      const t = exhibitionState.introT
      const room = p < 0.28 ? 0 : p < 0.55 ? 1 : p < 0.78 ? 2 : 3
      setState({
        showHeadline:   t > 5.2,
        showScrollHint: t > 4.0 && t < 25 && p < 0.04,
        room,
        p,
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const { showHeadline, showScrollHint, room, p } = state

  const roomData = [
    {
      label:    '01 — THE INSTRUMENT',
      headline: 'The next icon\nis already performing.\nYou just haven\'t heard them yet.',
      sub:      null,
    },
    {
      label:    '02 — MOMENTUM',
      headline: 'Rising.\nRight now.',
      sub:      'These artists are building heat before the world catches on.',
    },
    {
      label:    '03 — DISCOVERY VAULT',
      headline: 'Before the world\nknew their name.',
      sub:      'Every spot is a timestamp. Evidence you were early.',
    },
    {
      label:    '04 — PULSE',
      headline: 'Be first.\nEvery time.',
      sub:      null,
    },
  ]
  const current = roomData[room]

  // Headline enters from room 0 and transitions smoothly between rooms
  const headlineFade = showHeadline ? (p < 0.04 ? p / 0.04 : 1) : 0

  // Room label opacity
  const roomLabelFade = room > 0 ? Math.min(1, (
    room === 1 ? (p - 0.28) / 0.06 :
    room === 2 ? (p - 0.55) / 0.06 :
                 (p - 0.78) / 0.06
  )) : (showHeadline ? 1 : 0)

  // Final CTA appears in room 4
  const ctaFade = Math.max(0, Math.min(1, (p - 0.82) / 0.10))

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>

      {/* Room label — top right */}
      <div style={{
        position: 'absolute', top: 76, right: 28,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase',
        color: '#C9A84C',
        opacity: roomLabelFade,
        transition: 'opacity 0.8s ease',
      }}>
        {current.label}
      </div>

      {/* Main headline — bottom left, large Cormorant */}
      <div style={{
        position: 'absolute', bottom: '16vh', left: 36,
        maxWidth: 520,
        opacity: headlineFade,
        transform: `translateY(${showHeadline ? 0 : 18}px)`,
        transition: 'opacity 1.2s ease, transform 1.4s ease',
      }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(36px, 4.5vw, 68px)',
          fontWeight: 300,
          lineHeight: 1.08,
          letterSpacing: '0.02em',
          color: 'rgba(255,255,255,0.88)',
          margin: 0,
          whiteSpace: 'pre-line',
          textShadow: '0 2px 40px rgba(0,0,0,0.9)',
        }}>
          {current.headline}
        </h1>
        {current.sub && (
          <p style={{
            marginTop: 16,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: '0.08em',
            color: 'rgba(201,168,76,0.7)',
            lineHeight: 1.7, maxWidth: 380,
          }}>
            {current.sub}
          </p>
        )}
      </div>

      {/* Scroll hint — appears 4s in, fades before room 2 */}
      {showScrollHint && (
        <div style={{
          position: 'absolute', bottom: 28, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          animation: 'fadePulse 2s ease-in-out infinite',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.22)',
          }}>
            scroll to enter
          </span>
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
            <rect x="5" y="0" width="4" height="10" rx="2" fill="rgba(201,168,76,0.4)" />
            <line x1="7" y1="12" x2="7" y2="20" stroke="rgba(201,168,76,0.25)" strokeWidth="1" />
          </svg>
          <style>{`
            @keyframes fadePulse {
              0%, 100% { opacity: 0.4; transform: translateX(-50%) translateY(0) }
              50%       { opacity: 1;   transform: translateX(-50%) translateY(4px) }
            }
          `}</style>
        </div>
      )}

      {/* Final CTA — Room 4 */}
      <div style={{
        position: 'absolute', bottom: '12vh', right: 36,
        pointerEvents: ctaFade > 0.1 ? 'auto' : 'none',
        opacity: ctaFade,
        transform: `translateY(${ctaFade === 0 ? 20 : 0}px)`,
        transition: 'opacity 0.8s ease, transform 0.8s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16,
      }}>
        <a
          href="/explore"
          style={{
            fontFamily:     "'JetBrains Mono', monospace",
            fontSize:       10, letterSpacing: '0.28em', textTransform: 'uppercase',
            color:          '#0a0808', fontWeight: 500,
            backgroundColor: '#C9A84C',
            padding:        '14px 28px',
            textDecoration: 'none',
            borderRadius:   2,
            display:        'inline-block',
            transition:     'background-color 0.25s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E8C96A')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C9A84C')}
        >
          Enter SPOTLIGHT ↗
        </a>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
        }}>
          No card required · Free to discover
        </span>
      </div>

      {/* Progress indicator — bottom right, subtle */}
      <div style={{
        position: 'absolute', bottom: 28, right: 28,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
        opacity: p > 0.04 ? 0.6 : 0, transition: 'opacity 0.5s',
      }}>
        {['Instrument', 'Momentum', 'Vault', 'Pulse'].map((name, i) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: room === i ? '#C9A84C' : 'rgba(255,255,255,0.2)',
              transition: 'color 0.4s',
            }}>
              {name}
            </span>
            <div style={{
              width: 20, height: 1,
              backgroundColor: room === i ? '#C9A84C' : 'rgba(255,255,255,0.12)',
              transition: 'background-color 0.4s',
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ExhibitionScene ──────────────────────────────────────────────────────
export default function ExhibitionScene() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    exhibitionState.progress = 0

    const tween = gsap.to(exhibitionState, {
      progress: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start:   'top top',
        end:     'bottom bottom',
        scrub:   1.8,
      },
    })

    // Global cursor + drag-to-rotate
    let dragging = false, lastX = 0, lastY = 0
    const onMove = (e: MouseEvent) => {
      exhibitionState.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      exhibitionState.pointerY = -((e.clientY / window.innerHeight) * 2 - 1)
      if (dragging) {
        exhibitionState.dragRotY += (e.clientX - lastX) * 0.005
        exhibitionState.dragRotX += (e.clientY - lastY) * 0.003
        lastX = e.clientX; lastY = e.clientY
      }
    }
    const onDown = (e: MouseEvent) => {
      if ((e.target as Element).closest('a, button, input, [role="button"]')) return
      dragging = true; lastX = e.clientX; lastY = e.clientY
      // Seed so drag starts from current visual rotation (no jump)
      const scrollRot = exhibitionState.progress * Math.PI * 4
      exhibitionState.dragRotY = exhibitionState.liveRotY - scrollRot - exhibitionState.pointerX * 0.28
      exhibitionState.dragRotX = exhibitionState.liveRotX - (-exhibitionState.pointerY * 0.15)
      document.body.style.cursor = 'grabbing'
    }
    const onUp = () => { dragging = false; document.body.style.cursor = '' }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    return () => {
      tween.scrollTrigger?.kill(); tween.kill()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div style={{ position: 'sticky', top: 0, height: '100svh', zIndex: 2 }}>
      {/* Loading vignette */}
      <Suspense fallback={<CanvasLoader />}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }} aria-hidden>
          <CanvasLoader />
        </div>
      </Suspense>

      {/* DOM text overlay */}
      <ExhibitionOverlay />

      {/* WebGL canvas */}
      <Canvas
        camera={{ position: [0, 0, 14], fov: 46, near: 0.1, far: 200 }}
        dpr={[1, 1.8]}
        gl={{
          antialias:          true,
          alpha:              false,
          toneMappingExposure: 1.32,
          toneMapping:         THREE.ACESFilmicToneMapping,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <SceneBackground />
        <ambientLight intensity={0.35} />

        {/* Key directional light for crisp shadows */}
        <directionalLight position={[4, 8, 6]} intensity={3.5} color="#fff2d0" />

        {/* Cursor-following warm light */}
        <CursorLight />

        <Suspense fallback={null}>
          <StudioLighting />
          <SaxophoneVitrine />
          <GoldDustCloud />
          <EnvironmentLayer />
          <OrbitalCards />
        </Suspense>

        <CameraOrchestrator />

        {/* Post-processing — subtle gold bloom on brightest highlights */}
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.88}
            luminanceSmoothing={0.02}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

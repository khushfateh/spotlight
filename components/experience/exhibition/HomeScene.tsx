'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, useProgress } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { homeState, saxLivePos } from './homeState'
import SaxophoneVitrine  from './SaxophoneVitrine'
import GoldDustEcosystem from './GoldDustEcosystem'
import EnvironmentLayer  from './EnvironmentLayer'
import OrbitalSystem     from './OrbitalSystem'
import LivingUniverse    from './LivingUniverse'
import GlassNav          from './GlassNav'
import LeftStorytelling  from './LeftStorytelling'
import SpotQuickModal    from './SpotQuickModal'

const TWO_PI          = Math.PI * 2
const ORBIT_ROTATIONS = 1.2

// ── Cinematic Reveal Orchestrator ─────────────────────────────────────────────
// State machine: 0 → 1 → 2 → 3.
// Timing is deliberately slow — anticipation is the narrative.
//
//  Phase 0  universe alive (particles, atmosphere), sax completely hidden  (t < 1.5s)
//  Phase 1  silhouette: shape without material, champagne rim               (0.5s)
//  Phase 2  light discovers the instrument                                  (1.8s)
//  Phase 3  established — artists emerge, text evolves, world expands
function CinematicRevealOrchestrator() {
  useFrame(() => {
    const t = homeState.introT
    // introT=0 means SaxophoneVitrine hasn't mounted yet (Suspense pending).
    if (t === 0) return

    if (homeState.revealPhase === 0) {
      // Hold darkness long enough for anticipation to build.
      if (t >= 1.5) {
        homeState.revealPhase      = 1
        homeState.silhouetteStartT = t
      }

    } else if (homeState.revealPhase === 1) {
      // 0.5s silhouette — the shape is felt before it is seen.
      if (t - homeState.silhouetteStartT >= 0.5) {
        homeState.revealPhase  = 2
        homeState.revealStartT = t
      }

    } else if (homeState.revealPhase === 2) {
      // 1.8s material reveal — light slowly discovers the brass surface.
      homeState.revealProgress = Math.min(1, (t - homeState.revealStartT) / 1.8)
      if (homeState.revealProgress >= 1) {
        homeState.revealPhase     = 3
        homeState.revealCompleteT = t
      }
    }
  })
  return null
}

// ── Cinematic Lighting ────────────────────────────────────────────────────────
// Nothing is bright until the saxophone earns it.
// After the reveal, scroll drives warmth into the scene.
function CinematicLighting() {
  const ambRef  = useRef<THREE.AmbientLight>(null)
  const dirRef  = useRef<THREE.DirectionalLight>(null)
  const rimRef  = useRef<THREE.PointLight>(null)
  const spotRef = useRef<THREE.PointLight>(null)
  const warmRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const phase = homeState.revealPhase
    const rp    = homeState.revealProgress
    const p     = homeState.scrollProgress

    if (!ambRef.current || !dirRef.current || !rimRef.current || !spotRef.current || !warmRef.current) return

    // Ambient: barely exists until reveal; warms gradually with scroll.
    const ambTarget = phase === 0 ? 0.0
                    : phase === 1 ? 0.04
                    : phase === 2 ? 0.04 + 0.31 * rp
                    : 0.35 + 0.15 * Math.min(1, p / 0.6)
    ambRef.current.intensity += (ambTarget - ambRef.current.intensity) * 0.05

    // Key: warm directional — delayed, arrives mid-reveal, brightens with scroll.
    const dirTarget = phase === 0 ? 0.0
                    : phase === 1 ? 0.2
                    : phase === 2 ? 0.2 + 3.3 * Math.max(0, (rp - 0.25) / 0.75)
                    : 3.5 + 0.5 * Math.min(1, p / 0.4)
    dirRef.current.intensity += (dirTarget - dirRef.current.intensity) * 0.04

    // Rim: strongest during silhouette (traces the edge), lingers post-reveal.
    const rimTarget = phase === 0 ? 0.0
                    : phase === 1 ? 6.0
                    : phase === 2 ? 6.0 * (1 - rp * 0.82)
                    : 1.0
    rimRef.current.intensity += (rimTarget - rimRef.current.intensity) * 0.05

    // Cursor spot: appears only after full reveal.
    const spotTarget = phase === 3 ? 22.0 : 0.0
    spotRef.current.intensity += (spotTarget - spotRef.current.intensity) * 0.03

    // Scroll warmth: amber fill that grows as the user explores chapters.
    const warmTarget = phase === 3 ? 9.0 * Math.min(1, p / 0.5) : 0.0
    warmRef.current.intensity += (warmTarget - warmRef.current.intensity) * 0.025
    warmRef.current.position.x = 1.5
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={0} />
      <directionalLight
        ref={dirRef}
        position={[4, 8, 6]}
        intensity={0}
        color="#fff2d0"
        castShadow={false}
      />
      {/* Rim: left-back, champagne gold — traces the silhouette edge */}
      <pointLight
        ref={rimRef}
        position={[-3.5, 1.5, -3.0]}
        color="#C9A84C"
        intensity={0}
        distance={18}
        decay={2}
      />
      {/* Cursor spot: arrives after reveal */}
      <pointLight
        ref={spotRef}
        position={[0.5, 0, 4.5]}
        color="#ffecc0"
        intensity={0}
        distance={9}
        decay={2}
      />
      {/* Scroll warmth: follows the saxophone as it shifts right */}
      <pointLight
        ref={warmRef}
        position={[1.5, 0.5, 3.5]}
        color="#ffcc66"
        intensity={0}
        distance={14}
        decay={2}
      />
    </>
  )
}

// ── Studio Environment ─────────────────────────────────────────────────────────
function StudioLighting() {
  return (
    <Environment resolution={512}>
      <Lightformer intensity={7}   position={[0, 6, 6]}   scale={[18, 1.6, 1]} color="#fff4d8" />
      <Lightformer intensity={3.5} position={[5, 4, -4]}  scale={[1, 12, 1]}   color="#1C6B5E" />
      <Lightformer intensity={1.2} position={[-7, 1, 2]}  scale={[10, 12, 1]}  color="#2D1B69" />
      <Lightformer intensity={4.5} position={[-4, 2, 5]}  scale={[1.2, 16, 1]} color="#ffe7b0" />
      <Lightformer intensity={4}   position={[4, -1, 5]}  scale={[1.2, 16, 1]} color="#ffcf73" />
    </Environment>
  )
}

// ── Camera ─────────────────────────────────────────────────────────────────────
// Starts distant. During reveal it slowly pushes in — as if light draws you
// closer to the instrument. After reveal, idle breathing with cursor parallax.
function CameraBreathing() {
  useFrame((state, dt) => {
    const cam = state.camera as THREE.PerspectiveCamera
    const t   = state.clock.getElapsedTime()

    const phase = homeState.revealPhase
    const rp    = homeState.revealProgress
    const p     = homeState.scrollProgress

    // Phase 0 & 1: held far back — the world is dark and unknown.
    // Phase 2: slow cinematic push toward the instrument.
    // Phase 3: settled, with a gentle pull-back as the orbit expands.
    const targetZ = phase === 0 ? 10.2
                  : phase === 1 ? 10.0   // tiny settle as silhouette registers
                  : phase === 2 ? 10.0 - 3.0 * rp   // 10.0 → 7.0
                  : 7.0 - p * 0.6        // gently recede as user scrolls deeper
    cam.position.z += (targetZ - cam.position.z) * (1 - Math.exp(-1.2 * dt))

    // Idle breathing: only active post-reveal so the reveal stays clean.
    const bx = phase >= 3
      ? Math.sin(t * 0.19) * 0.004 + Math.sin(t * 0.37) * 0.002
      : 0
    const by = phase >= 3
      ? Math.sin(t * 0.13) * 0.003 + Math.sin(t * 0.29) * 0.002
      : 0

    const px = homeState.pointerX
    const py = homeState.pointerY

    const targetX = phase >= 3 ? px * 0.18 + bx : 0
    const targetY = phase >= 3 ? py * 0.14 + by : 0

    cam.position.x += (targetX - cam.position.x) * (1 - Math.exp(-3 * dt))
    cam.position.y += (targetY - cam.position.y) * (1 - Math.exp(-3 * dt))

    cam.lookAt(0, 0, 0)
    cam.updateProjectionMatrix()
  })
  return null
}

// ── Scene Orchestrator ─────────────────────────────────────────────────────────
// Maps scroll progress → saxophone shift and story section.
// Uses a cubic ease so the sax accelerates out of center and settles.
function SceneOrchestrator() {
  useFrame(() => {
    const p = homeState.scrollProgress
    const t = Math.min(1, p / 0.18)
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    homeState.saxOffsetX   = 0
    homeState.storySection = Math.min(4, Math.floor(p / 0.20))
    saxLivePos.prevX       = saxLivePos.x
    saxLivePos.x           = 0
  })
  return null
}

// ── Loading overlay ────────────────────────────────────────────────────────────
// Shows while Three.js assets load. A spinner prevents the user from thinking
// the page is broken. Disappears once all assets report 100%.
// Note: darkness is achieved by the scene itself (sax invisible in phase 0,
// particles subtle) — no separate veil needed.
function LoadingOverlay() {
  const { progress } = useProgress()
  if (progress >= 100) return null
  return (
    <div style={{
      position:       'absolute',
      inset:          0,
      zIndex:         30,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      background:     '#050508',
      pointerEvents:  'none',
    }}>
      <div style={{
        width:        24,
        height:       24,
        borderRadius: '50%',
        border:       '1px solid rgba(255,255,255,0.06)',
        borderTop:    '1px solid #C9A84C',
        animation:    'spin 0.9s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Scroll hint ────────────────────────────────────────────────────────────────
// Only surfaces after the saxophone reveal is complete and the world is
// established. Disappears the moment the user begins to scroll.
function ScrollHint() {
  const [visible, setVisible] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const check = () => {
      const phase = homeState.revealPhase
      const t     = homeState.introT
      const p     = homeState.scrollProgress
      setVisible(
        phase === 3 &&
        t > 0 &&
        (t - homeState.revealCompleteT) > 1.2 &&
        p < 0.03
      )
      rafRef.current = requestAnimationFrame(check)
    }
    rafRef.current = requestAnimationFrame(check)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div aria-hidden style={{
      position:       'fixed',
      bottom:         28,
      left:           '50%',
      transform:      'translateX(-50%)',
      zIndex:         14,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            8,
      pointerEvents:  'none',
      opacity:        visible ? 1 : 0,
      transition:     'opacity 1.4s ease',
      animation:      visible ? 'scrollHintPulse 2.4s ease-in-out infinite' : 'none',
    }}>
      <span style={{
        fontFamily:    "'JetBrains Mono', monospace",
        fontSize:      8,
        letterSpacing: '0.34em',
        textTransform: 'uppercase',
        color:         'rgba(255,255,255,0.20)',
      }}>
        scroll to reveal
      </span>
      <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
        <rect x="4" y="0" width="4" height="8" rx="2" fill="rgba(201,168,76,0.35)" />
        <line x1="6" y1="10" x2="6" y2="18" stroke="rgba(201,168,76,0.20)" strokeWidth="1" />
      </svg>
      <style>{`
        @keyframes scrollHintPulse {
          0%,100% { opacity: 0.45; transform: translateX(-50%) translateY(0) }
          50%      { opacity: 1;    transform: translateX(-50%) translateY(5px) }
        }
      `}</style>
    </div>
  )
}

// ── Bloom ──────────────────────────────────────────────────────────────────────
function RevealBloom() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.65}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.02}
        mipmapBlur
      />
    </EffectComposer>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function HomeScene() {
  useEffect(() => {
    // ── Vertical scroll ────────────────────────────────────────────────────
    const onScroll = () => {
      const svh = window.innerHeight
      homeState.scrollY          = window.scrollY
      homeState.scrollProgress   = Math.min(1, window.scrollY / (svh * 5))
      homeState.orbitAngleTarget = homeState.scrollProgress * ORBIT_ROTATIONS * TWO_PI
    }

    // ── Mouse move + drag ──────────────────────────────────────────────────
    let dragging = false, lastX = 0, lastY = 0
    const onMove = (e: MouseEvent) => {
      homeState.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      homeState.pointerY = -((e.clientY / window.innerHeight) * 2 - 1)
      if (dragging) {
        homeState.dragRotY += (e.clientX - lastX) * 0.008
        homeState.dragRotX += (e.clientY - lastY) * 0.005
        homeState.dragRotX  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, homeState.dragRotX))
        lastX = e.clientX; lastY = e.clientY
      }
    }
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      if ((e.target as Element).closest('a, button, input, [role="button"]')) return
      dragging = true; lastX = e.clientX; lastY = e.clientY
      document.body.style.cursor = 'grabbing'
    }
    const onUp = () => { dragging = false; document.body.style.cursor = '' }

    window.addEventListener('scroll',    onScroll, { passive: true })
    window.addEventListener('mousemove', onMove,   { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup',   onUp)
    onScroll()

    return () => {
      window.removeEventListener('scroll',    onScroll)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [])

  return (
    <div style={{ position: 'sticky', top: 0, height: '100svh', zIndex: 2 }}>
      <GlassNav />
      <LeftStorytelling />
      <LoadingOverlay />
      <ScrollHint />
      <SpotQuickModal />

      <Canvas
        camera={{ position: [0, 0, 10.2], fov: 46, near: 0.1, far: 140 }}
        dpr={[1, 1.8]}
        gl={{
          antialias:           true,
          alpha:               false,
          toneMappingExposure: 1.35,
          toneMapping:         THREE.ACESFilmicToneMapping,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#050508']} />

        <Suspense fallback={null}>
          <StudioLighting />
          <LivingUniverse />
          <EnvironmentLayer />
          <GoldDustEcosystem />
          <SaxophoneVitrine />
          <OrbitalSystem />
        </Suspense>

<CinematicLighting />
        <CinematicRevealOrchestrator />
        <CameraBreathing />
        <SceneOrchestrator />
        <RevealBloom />
      </Canvas>
    </div>
  )
}

/**
 * HomeScene3D — the mobile home exhibition, ported from web's
 * components/experience/exhibition/HomeScene.tsx (+ SaxophoneVitrine).
 *
 * Runs in Expo Go via expo-gl + @react-three/fiber/native.
 *
 *  Phase 0  universe only — gold dust is alive from the very first frame
 *  Phase 1  silhouette: the real saxophone as a dark shape with a gold rim
 *  Phase 2  light discovers the brass (1.8 s) while the camera pushes in
 *  Phase 3  alive — idle spin, swipe/scroll/tilt interaction, threads appear
 */
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { View } from 'react-native'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber/native'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'
import { sceneState, saxLivePos } from './sceneState'
import GoldDustEcosystem from './GoldDustEcosystem'
import LivingUniverse from './LivingUniverse'
import Atmosphere from './Atmosphere'
import OrbitalCards from './OrbitalCards'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SAX_MODEL = require('../../../assets/models/saxophone.glb') as string

// Start fetching + decoding the model as soon as this module is imported,
// before the Canvas even mounts — so the real sax is ready almost instantly.
useLoader.preload(GLTFLoader, SAX_MODEL)

// ── Timeline (seconds) ──────────────────────────────────────────────────────
const DUST_LEAD      = 0.3   // dust alone before the sax silhouette appears
const SILHOUETTE_DUR = 0.5
const REVEAL_DUR     = 1.8

// ── Camera (portrait framing) ───────────────────────────────────────────────
const FOV        = 46
const CAM_START  = 15.0   // held back while the world is dark
const CAM_REVEAL = 12.5   // after the push-in: sax ≈ half the screen height
const SAX_SCREEN_Y = 0.30 // sax centre sits 30% from the top of the canvas
const CAM_STORY  = 13.6   // eases back a touch in the story so the orbit has room
const SAX_SCREEN_Y_STORY = 0.36
const TAN_HALF_FOV = Math.tan((FOV / 2) * Math.PI / 180)

/** 0 on the hero → 1 once the user has scrolled into the story (smoothstep) */
function storyBlend() {
  const t = Math.max(0, Math.min(1, sceneState.pageProgress / 0.7))
  return t * t * (3 - 2 * t)
}

// ── Sax hero pose — same as web ─────────────────────────────────────────────
const HERO_ROT_Y =  Math.PI * 0.30
const HERO_ROT_X = -Math.PI * 0.055
const SIL_COLOR     = new THREE.Color('#060503')
const RIM_EMISSIVE  = new THREE.Color('#B8943C')
const WARM_EMISSIVE = new THREE.Color('#3d2200')

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// ── Reveal state machine ────────────────────────────────────────────────────
function RevealOrchestrator({ onComplete }: { onComplete?: () => void }) {
  const fired = useRef(false)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    sceneState.introT = t
    const s = sceneState
    if (s.revealPhase === 0) {
      if (s.modelReady && t >= DUST_LEAD) {
        s.revealPhase = 1
        s.silhouetteStartT = t
      }
    } else if (s.revealPhase === 1) {
      if (t - s.silhouetteStartT >= SILHOUETTE_DUR) {
        s.revealPhase = 2
        s.revealStartT = t
      }
    } else if (s.revealPhase === 2) {
      s.revealProgress = Math.min(1, (t - s.revealStartT) / REVEAL_DUR)
      if (s.revealProgress >= 1) {
        s.revealPhase = 3
        s.revealCompleteT = t
        if (!fired.current) { fired.current = true; onComplete?.() }
      }
    }
  })
  return null
}

// ── Studio reflections (stands in for web's drei Environment/Lightformers) ──
function StudioEnvironment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    let pmrem: THREE.PMREMGenerator | null = null
    let envTex: THREE.Texture | null = null
    try {
      pmrem = new THREE.PMREMGenerator(gl)
      envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = envTex
      scene.environmentIntensity = 0.85
    } catch (err) {
      console.warn('[HomeScene3D] environment map unavailable, using lights only', err)
    }
    return () => {
      scene.environment = null
      envTex?.dispose()
      pmrem?.dispose()
    }
  }, [gl, scene])
  return null
}

// ── Cinematic lighting — nothing is bright until the saxophone earns it ─────
function CinematicLighting() {
  const ambRef  = useRef<THREE.AmbientLight>(null)
  const dirRef  = useRef<THREE.DirectionalLight>(null)
  const rimRef  = useRef<THREE.PointLight>(null)
  const spotRef = useRef<THREE.PointLight>(null)
  const warmRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const { revealPhase: phase, revealProgress: rp, scrollProgress: p } = sceneState
    if (!ambRef.current || !dirRef.current || !rimRef.current || !spotRef.current || !warmRef.current) return

    const ambT = phase === 0 ? 0 : phase === 1 ? 0.04 : phase === 2 ? 0.04 + 0.31 * rp : 0.35 + 0.15 * Math.min(1, p / 0.6)
    ambRef.current.intensity += (ambT - ambRef.current.intensity) * 0.05

    const dirT = phase === 0 ? 0 : phase === 1 ? 0.2 : phase === 2 ? 0.2 + 3.3 * Math.max(0, (rp - 0.25) / 0.75) : 3.5 + 0.5 * Math.min(1, p / 0.4)
    dirRef.current.intensity += (dirT - dirRef.current.intensity) * 0.04

    const rimT = phase === 0 ? 0 : phase === 1 ? 6.0 : phase === 2 ? 6.0 * (1 - rp * 0.82) : 1.0
    rimRef.current.intensity += (rimT - rimRef.current.intensity) * 0.05

    const spotT = phase === 3 ? 22.0 : 0
    spotRef.current.intensity += (spotT - spotRef.current.intensity) * 0.03
    // Tilt moves the spot like the web cursor does
    spotRef.current.position.x += (0.5 + sceneState.pointerX * 1.5 - spotRef.current.position.x) * 0.05
    spotRef.current.position.y += (sceneState.pointerY * 1.2 - spotRef.current.position.y) * 0.05

    const warmT = phase === 3 ? 9.0 * Math.min(1, p / 0.5) : 0
    warmRef.current.intensity += (warmT - warmRef.current.intensity) * 0.025
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={0} />
      <directionalLight ref={dirRef} position={[4, 8, 6]} intensity={0} color="#fff2d0" />
      <pointLight ref={rimRef}  position={[-3.5, 1.5, -3.0]} color="#C9A84C" intensity={0} distance={18} decay={2} />
      <pointLight ref={spotRef} position={[0.5, 0, 4.5]}     color="#ffecc0" intensity={0} distance={9}  decay={2} />
      <pointLight ref={warmRef} position={[1.5, 0.5, 3.5]}   color="#ffcc66" intensity={0} distance={14} decay={2} />
    </>
  )
}

// ── Camera: held back, cinematic push-in during reveal, then breathing ──────
function CameraRig() {
  useFrame((state, dt) => {
    const cam = state.camera as THREE.PerspectiveCamera
    const t = state.clock.getElapsedTime()
    const { revealPhase: phase, revealProgress: rp } = sceneState
    // 0 on the hero → 1 once the user is into the story (orbit visible)
    const story = storyBlend()

    const targetZ = phase === 0 ? CAM_START
                  : phase === 1 ? CAM_START - 0.3
                  : phase === 2 ? (CAM_START - 0.3) - (CAM_START - 0.3 - CAM_REVEAL) * easeInOut(rp)
                  : CAM_REVEAL + (CAM_STORY - CAM_REVEAL) * story
    cam.position.z += (targetZ - cam.position.z) * (1 - Math.exp(-1.6 * dt))

    const bx = phase >= 3 ? Math.sin(t * 0.19) * 0.004 + Math.sin(t * 0.37) * 0.002 : 0
    const by = phase >= 3 ? Math.sin(t * 0.13) * 0.003 + Math.sin(t * 0.29) * 0.002 : 0
    const tiltX = phase >= 3 ? sceneState.pointerX * 0.18 : 0
    const tiltY = phase >= 3 ? sceneState.pointerY * 0.14 : 0

    // Frame the sax (at world origin) 30% from the top on the hero, easing to
    // 36% in the story so the whole orbit fits above the chapter text.
    const screenY = SAX_SCREEN_Y + (SAX_SCREEN_Y_STORY - SAX_SCREEN_Y) * story
    const frameY = -(0.5 - screenY) * 2 * cam.position.z * TAN_HALF_FOV

    cam.position.x += (tiltX + bx - cam.position.x) * (1 - Math.exp(-3 * dt))
    cam.position.y += (frameY + tiltY + by - cam.position.y) * (1 - Math.exp(-3 * dt))
  })
  return null
}

// ── The saxophone (port of web SaxophoneVitrine) ─────────────────────────────
interface MatEntry {
  mat: THREE.MeshStandardMaterial
  origColor: THREE.Color
  origRoughness: number
  origMetalness: number
  origEnvMapIntensity: number
}

function SaxModel() {
  const gltf     = useLoader(GLTFLoader, SAX_MODEL) as unknown as { scene: THREE.Group }
  const groupRef = useRef<THREE.Group>(null)
  const matsRef  = useRef<MatEntry[]>([])
  const silInit  = useRef(false)

  const model = useMemo(() => {
    const clone = gltf.scene.clone(true)
    const box  = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    clone.scale.setScalar(5.3 / (Math.max(size.x, size.y, size.z) || 1))   // same as web
    box.setFromObject(clone)
    const center = new THREE.Vector3()
    box.getCenter(center)
    clone.position.sub(center)

    const seen = new Map<THREE.Material, THREE.MeshStandardMaterial>()
    const entries: MatEntry[] = []
    clone.traverse((o: THREE.Object3D) => {
      if (!(o instanceof THREE.Mesh)) return
      const m = o.material
      if (!m || Array.isArray(m) || !('metalness' in m)) return
      let mat = seen.get(m)
      if (!mat) {
        mat = (m as THREE.MeshStandardMaterial).clone()
        seen.set(m, mat)
        entries.push({
          mat,
          origColor: mat.color.clone(),
          origRoughness: mat.roughness,
          origMetalness: mat.metalness,
          origEnvMapIntensity: mat.envMapIntensity,
        })
      }
      o.material = mat
      o.frustumCulled = false
    })
    matsRef.current = entries
    silInit.current = false
    return clone
  }, [gltf])

  useEffect(() => {
    sceneState.modelReady = true
    return () => { sceneState.modelReady = false }
  }, [model])

  useFrame((state) => {
    const g = groupRef.current
    if (!g) return
    const t = state.clock.getElapsedTime()
    const { revealPhase: phase, revealProgress: rp, scrollProgress: p, pointerX: px, pointerY: py } = sceneState
    const ease = easeInOut(rp)

    // ── Position: gentle breathing ─────────────────────────────────────────
    g.position.y = THREE.MathUtils.lerp(g.position.y, Math.sin(t * 0.48) * 0.038, 0.045)

    // ── Rotation: hero pose → interactive after reveal ─────────────────────
    const p3 = phase >= 3 ? Math.min(1, (t - sceneState.revealCompleteT) / 2.2) : 0
    const idleSpin = phase >= 3 ? (t - sceneState.revealCompleteT) * 0.10 * p3 : 0
    const userRotY = HERO_ROT_Y + idleSpin + p * Math.PI * 1.2 + sceneState.dragRotY + px * 0.14
    const userRotX = HERO_ROT_X + sceneState.dragRotX - py * 0.10
    // A swipe takes control immediately, even mid-reveal
    const control = Math.max(p3, sceneState.dragRotY !== 0 ? 1 : 0)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, THREE.MathUtils.lerp(HERO_ROT_Y, userRotY, control), 0.06)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, THREE.MathUtils.lerp(HERO_ROT_X, userRotX, control), 0.06)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, px * 0.03, 0.05)

    // ── Visibility & material reveal (identical to web) ────────────────────
    if (phase === 0) {
      g.visible = false
    } else {
      g.visible = true
      if (!silInit.current) {
        silInit.current = true
        for (const { mat } of matsRef.current) {
          mat.color.copy(SIL_COLOR)
          mat.metalness = 0
          mat.roughness = 1
          mat.envMapIntensity = 0
          mat.emissive = RIM_EMISSIVE.clone()
          mat.emissiveIntensity = 0
          mat.transparent = true
          mat.opacity = 0
          mat.depthWrite = false
          mat.needsUpdate = true
        }
      }
      for (const e of matsRef.current) {
        const { mat, origColor, origRoughness, origMetalness, origEnvMapIntensity } = e
        if (phase === 1) {
          const silT = Math.min(1, (t - sceneState.silhouetteStartT) / SILHOUETTE_DUR)
          mat.opacity           = THREE.MathUtils.lerp(mat.opacity, silT * 0.50, 0.07)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, silT * 0.09, 0.05)
          mat.emissive.copy(RIM_EMISSIVE)
          mat.color.copy(SIL_COLOR)
        } else if (phase === 2) {
          mat.opacity = 0.50 + 0.50 * Math.pow(rp, 0.55)
          mat.color.lerpColors(SIL_COLOR, origColor, Math.min(1, ease / 0.65))
          mat.roughness = THREE.MathUtils.lerp(1.0, origRoughness, ease)
          mat.metalness = Math.max(0, (ease - 0.15) / 0.85) * origMetalness
          mat.envMapIntensity = Math.max(0, (ease - 0.25) / 0.75) * origEnvMapIntensity
          if (ease < 0.35) {
            mat.emissive.copy(RIM_EMISSIVE)
            mat.emissiveIntensity = THREE.MathUtils.lerp(0.09, 0.14, ease / 0.35)
          } else {
            const emitT = (ease - 0.35) / 0.65
            mat.emissive.lerpColors(RIM_EMISSIVE, WARM_EMISSIVE, emitT)
            mat.emissiveIntensity = THREE.MathUtils.lerp(0.14, 0.28, emitT)
          }
        } else {
          mat.color.lerp(origColor, 0.08)
          mat.roughness         = THREE.MathUtils.lerp(mat.roughness, origRoughness, 0.05)
          mat.metalness         = THREE.MathUtils.lerp(mat.metalness, origMetalness, 0.05)
          mat.envMapIntensity   = THREE.MathUtils.lerp(mat.envMapIntensity, origEnvMapIntensity, 0.05)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.28, 0.04)
          mat.opacity           = THREE.MathUtils.lerp(mat.opacity, 1, 0.08)
          // Fully opaque again → restore depth writes so the sax self-occludes correctly
          if (mat.transparent && mat.opacity > 0.995) {
            mat.opacity = 1
            mat.transparent = false
            mat.depthWrite = true
            mat.needsUpdate = true
          }
        }
      }
    }

    // Publish live sax position for particle emission / velocity
    saxLivePos.prevX = saxLivePos.x
    saxLivePos.prevY = saxLivePos.y
    saxLivePos.prevZ = saxLivePos.z
    saxLivePos.x = g.position.x
    saxLivePos.y = g.position.y
    saxLivePos.z = g.position.z
  })

  return (
    <group ref={groupRef} visible={false} rotation={[HERO_ROT_X, HERO_ROT_Y, 0]}>
      <primitive object={model} />
    </group>
  )
}

interface Props {
  width: number
  height: number
  /** pause rendering (e.g. when the Home tab isn't focused) */
  active?: boolean
  /** an orbiting artist card was tapped */
  onSelectArtist: (ticker: string) => void
  /** front-right card changed / moved (drives the native name label) */
  onFocusChange?: (index: number, strength: number, screen: { x: number; y: number }) => void
  /** bump to put a selected card back into orbit (e.g. on returning to Home) */
  resetKey: number
  /** the saxophone's brass reveal has finished */
  onRevealComplete?: () => void
}

export default function HomeScene3D({ width, height, active = true, onSelectArtist, onFocusChange, resetKey, onRevealComplete }: Props) {
  // Fresh reveal every time the scene mounts
  useMemo(() => {
    sceneState.introT = 0
    sceneState.revealPhase = 0
    sceneState.revealProgress = 0
  }, [])

  const initialCamY = -(0.5 - SAX_SCREEN_Y) * 2 * CAM_START * TAN_HALF_FOV

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Canvas
        style={{ flex: 1 }}
        frameloop={active ? 'always' : 'never'}
        // Explicit rotation stops R3F's default lookAt(0,0,0), which tilted the
        // camera back toward the sax and cancelled the framing offset (sax sat
        // mid-screen instead of 30% from the top).
        camera={{ position: [0, initialCamY, CAM_START], rotation: [0, 0, 0], fov: FOV, near: 0.1, far: 140 }}
        gl={{ antialias: true }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.35
          scene.background = new THREE.Color('#050508')
        }}
      >
        <StudioEnvironment />
        <CinematicLighting />
        <RevealOrchestrator onComplete={onRevealComplete} />
        <CameraRig />

        {/* Particles render immediately — they never wait on the model */}
        <Atmosphere />
        <LivingUniverse />
        <GoldDustEcosystem />

        <Suspense fallback={null}>
          <SaxModel />
        </Suspense>

        {/* Artist cards — hidden on the hero, spiral out once scrolling starts */}
        <OrbitalCards onSelect={onSelectArtist} onFocusChange={onFocusChange} resetKey={resetKey} />
      </Canvas>
    </View>
  )
}

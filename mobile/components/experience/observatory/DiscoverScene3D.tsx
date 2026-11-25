/**
 * DiscoverScene3D — the Observatory: the golden grand piano on its stage,
 * surrounded by the web Discover page's living background (threads + minute
 * star dust).
 *
 * The piano behaves exactly like the Home saxophone — dark silhouette with a
 * gold rim, light discovering the gold, then alive: idle spin, swipe to
 * rotate (with inertia), tilt parallax, dust lifting off it. It sits on the
 * stage page of the Discover scroll: rides up with the content, settles
 * centred, then recedes as the editorial sheet slides over it.
 */
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { View } from 'react-native'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber/native'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'
import { discoverState, pianoLivePos } from './discoverState'
import {
  FOV, CAM_Z, HERO_ROT_X, HERO_ROT_Y, RECEDE_DEPTH, REVEAL_TRIGGER,
  pianoSize, stageFrame, worldYForScreen, smooth,
} from './framing'
import { ObservatoryBackdrop, PianoDust } from './ObservatoryLayers'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PIANO_MODEL = require('../../../assets/models/piano.glb') as string

// ── Timeline (seconds) — identical to the saxophone ─────────────────────────
const SILHOUETTE_DUR = 0.5
const REVEAL_DUR = 1.8
const IDLE_SPIN = 0.1           // rad/s once alive
const INERTIA_DECAY = 3.2       // 1/s

const SIL_COLOR = new THREE.Color('#060503')
const RIM_EMISSIVE = new THREE.Color('#B8943C')
const WARM_EMISSIVE = new THREE.Color('#3d2200')
const WARM_INTENSITY = 0.22     // a touch under the sax: the piano has white keys

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)

/** Start loading the piano (call when the Discover screen mounts) */
export function preloadPiano() {
  useLoader.preload(GLTFLoader, PIANO_MODEL)
}

// ── Reveal state machine — waits for the stage to scroll into view ──────────
function RevealOrchestrator() {
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const s = discoverState
    s.introT = t
    if (!s.revealRequested) {
      const f = stageFrame(s.scrollY, s.stageTop, s.pageH, s.stageEnabled)
      if (s.stageEnabled && f.pages >= REVEAL_TRIGGER) s.revealRequested = true
    }
    if (s.revealPhase === 0) {
      if (s.modelReady && s.revealRequested) {
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
      }
    }
  })
  return null
}

// ── Studio reflections — same RoomEnvironment as the Home saxophone ─────────
const ENV_INTENSITY = 0.85
function StudioEnvironment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    let pmrem: THREE.PMREMGenerator | null = null
    let envTex: THREE.Texture | null = null
    try {
      pmrem = new THREE.PMREMGenerator(gl)
      envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = envTex
      scene.environmentIntensity = ENV_INTENSITY
    } catch (err) {
      console.warn('[DiscoverScene3D] environment map unavailable, using lights only', err)
    }
    return () => {
      scene.environment = null
      envTex?.dispose()
      pmrem?.dispose()
    }
  }, [gl, scene])
  useFrame(({ scene: sc }) => {
    if (!sc.environment) return
    // Receding behind the editorial sheet → the room light falls away
    sc.environmentIntensity = ENV_INTENSITY * (1 - 0.6 * pianoLivePos.recede)
  })
  return null
}

// ── Cinematic lighting (the saxophone's rig), following the piano ───────────
function CinematicLighting() {
  const rigRef = useRef<THREE.Group>(null)
  const ambRef = useRef<THREE.AmbientLight>(null)
  const dirRef = useRef<THREE.DirectionalLight>(null)
  const rimRef = useRef<THREE.PointLight>(null)
  const spotRef = useRef<THREE.PointLight>(null)
  const warmRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const { revealPhase: phase, revealProgress: rp } = discoverState
    if (!rigRef.current || !ambRef.current || !dirRef.current || !rimRef.current || !spotRef.current || !warmRef.current) return
    rigRef.current.position.y = pianoLivePos.y
    rigRef.current.position.z = pianoLivePos.z
    const dim = 1 - 0.6 * pianoLivePos.recede

    const ambT = phase === 0 ? 0 : phase === 1 ? 0.04 : phase === 2 ? 0.04 + 0.31 * rp : 0.38
    ambRef.current.intensity += (ambT * dim - ambRef.current.intensity) * 0.05

    const dirT = phase === 0 ? 0 : phase === 1 ? 0.2 : phase === 2 ? 0.2 + 3.3 * Math.max(0, (rp - 0.25) / 0.75) : 3.6
    dirRef.current.intensity += (dirT * dim - dirRef.current.intensity) * 0.04

    const rimT = phase === 0 ? 0 : phase === 1 ? 6.0 : phase === 2 ? 6.0 * (1 - rp * 0.82) : 1.0
    rimRef.current.intensity += (rimT - rimRef.current.intensity) * 0.05

    const spotT = phase === 3 ? 22.0 * dim : 0
    spotRef.current.intensity += (spotT - spotRef.current.intensity) * 0.03
    spotRef.current.position.x += (0.5 + discoverState.pointerX * 1.5 - spotRef.current.position.x) * 0.05
    spotRef.current.position.y += (0.6 + discoverState.pointerY * 1.2 - spotRef.current.position.y) * 0.05

    const warmT = phase === 3 ? 4.0 * dim : 0
    warmRef.current.intensity += (warmT - warmRef.current.intensity) * 0.025
  })

  return (
    <group ref={rigRef}>
      <ambientLight ref={ambRef} intensity={0} />
      <directionalLight ref={dirRef} position={[4, 8, 6]} intensity={0} color="#fff2d0" />
      <pointLight ref={rimRef} position={[-3.5, 1.5, -3.0]} color="#C9A84C" intensity={0} distance={18} decay={2} />
      <pointLight ref={spotRef} position={[0.5, 0.6, 4.5]} color="#ffecc0" intensity={0} distance={9} decay={2} />
      <pointLight ref={warmRef} position={[1.5, 0.5, 3.5]} color="#ffcc66" intensity={0} distance={14} decay={2} />
    </group>
  )
}

// ── Camera: fixed lens, breathing + tilt parallax once alive ────────────────
function CameraRig() {
  useFrame((state, dt) => {
    const cam = state.camera
    const t = state.clock.getElapsedTime()
    const alive = discoverState.revealPhase >= 3
    const bx = alive ? Math.sin(t * 0.19) * 0.004 + Math.sin(t * 0.37) * 0.002 : 0
    const by = alive ? Math.sin(t * 0.13) * 0.003 + Math.sin(t * 0.29) * 0.002 : 0
    const tx = discoverState.pointerX * 0.16
    const ty = discoverState.pointerY * 0.12
    cam.position.x += (tx + bx - cam.position.x) * damp(3, dt)
    cam.position.y += (ty + by - cam.position.y) * damp(3, dt)
  })
  return null
}

// ── The piano ────────────────────────────────────────────────────────────────
interface MatEntry {
  mat: THREE.MeshStandardMaterial
  origColor: THREE.Color
  origRoughness: number
  origMetalness: number
  origEnvMapIntensity: number
}

function PianoModel({ size, viewH }: { size: number; viewH: number }) {
  const gltf = useLoader(GLTFLoader, PIANO_MODEL) as unknown as { scene: THREE.Group }
  const groupRef = useRef<THREE.Group>(null)
  const matsRef = useRef<MatEntry[]>([])
  const silInit = useRef(false)
  const cur = useRef({ screenY: -1, recede: 0, enabled: true, easeUntil: 0 })

  const model = useMemo(() => {
    const clone = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const sz = new THREE.Vector3()
    box.getSize(sz)
    clone.scale.setScalar(size / (Math.max(sz.x, sz.y, sz.z) || 1))
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
  }, [gltf, size])

  useEffect(() => {
    discoverState.modelReady = true
    return () => { discoverState.modelReady = false }
  }, [model])

  useFrame((state, dt) => {
    const g = groupRef.current
    if (!g) return
    const t = state.clock.getElapsedTime()
    const s = discoverState
    const { revealPhase: phase, revealProgress: rp } = s
    const ease = easeInOut(rp)

    // ── Stage position: rides with the page, settles, recedes ─────────────
    const f = stageFrame(s.scrollY, s.stageTop, s.pageH, s.stageEnabled)
    const c = cur.current
    if (c.screenY < 0) c.screenY = f.screenY
    if (c.enabled !== s.stageEnabled) { c.enabled = s.stageEnabled; c.easeUntil = t + 1.4 }
    // Near-locked to the scroll normally; a slow glide when the stage bows
    // out for search results (or returns).
    const rate = t < c.easeUntil ? 4.5 : 24
    c.screenY += (f.screenY - c.screenY) * damp(rate, dt)
    c.recede += (f.recede - c.recede) * damp(10, dt)
    const rec = smooth(c.recede)
    const z = -RECEDE_DEPTH * rec
    const breathe = Math.sin(t * 0.48) * 0.03
    g.position.set(0, worldYForScreen(c.screenY, viewH, CAM_Z - z) + breathe, z)

    // Only draw while on (or near) screen
    const onScreen = c.screenY > -viewH * 0.45 && c.screenY < viewH * 1.45
    const presence = onScreen ? (1 - rec * 0.85) * Math.max(0, Math.min(1, 1.35 - Math.abs(c.screenY / viewH - 0.45) * 1.1)) : 0
    pianoLivePos.presence = presence
    pianoLivePos.recede = rec

    // ── Rotation: hero pose → alive (idle spin + swipe with inertia) ──────
    if (!s.dragging && s.dragVelY !== 0) {
      s.dragRotY += s.dragVelY * dt
      s.dragVelY *= Math.exp(-INERTIA_DECAY * dt)
      if (Math.abs(s.dragVelY) < 0.005) s.dragVelY = 0
    }
    const p3 = phase >= 3 ? Math.min(1, (t - s.revealCompleteT) / 2.2) : 0
    const idle = phase >= 3 ? (t - s.revealCompleteT) * IDLE_SPIN * p3 : 0
    const userRotY = HERO_ROT_Y + idle + s.dragRotY + s.pointerX * 0.14
    const userRotX = HERO_ROT_X + s.dragRotX - s.pointerY * 0.06
    const control = Math.max(p3, s.dragRotY !== 0 ? 1 : 0)
    const k = damp(4, dt)
    g.rotation.y += (THREE.MathUtils.lerp(HERO_ROT_Y, userRotY, control) - g.rotation.y) * k
    g.rotation.x += (THREE.MathUtils.lerp(HERO_ROT_X, userRotX, control) - g.rotation.x) * k
    g.rotation.z += (s.pointerX * 0.025 - g.rotation.z) * damp(3, dt)

    // ── Visibility & material reveal (identical to the saxophone) ─────────
    if (phase === 0 || !onScreen) {
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
          const silT = Math.min(1, (t - s.silhouetteStartT) / SILHOUETTE_DUR)
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, silT * 0.5, 0.07)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, silT * 0.09, 0.05)
          mat.emissive.copy(RIM_EMISSIVE)
          mat.color.copy(SIL_COLOR)
        } else if (phase === 2) {
          mat.opacity = 0.5 + 0.5 * Math.pow(rp, 0.55)
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
            mat.emissiveIntensity = THREE.MathUtils.lerp(0.14, WARM_INTENSITY, emitT)
          }
        } else {
          mat.color.lerp(origColor, 0.08)
          mat.roughness = THREE.MathUtils.lerp(mat.roughness, origRoughness, 0.05)
          mat.metalness = THREE.MathUtils.lerp(mat.metalness, origMetalness, 0.05)
          mat.envMapIntensity = THREE.MathUtils.lerp(mat.envMapIntensity, origEnvMapIntensity, 0.05)
          mat.emissive.lerp(WARM_EMISSIVE, 0.08)
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, WARM_INTENSITY, 0.04)
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 1, 0.08)
          // Fully opaque again → restore depth writes so the piano self-occludes
          if (mat.transparent && mat.opacity > 0.995) {
            mat.opacity = 1
            mat.transparent = false
            mat.depthWrite = true
            mat.needsUpdate = true
          }
        }
      }
    }

    pianoLivePos.x = g.position.x
    pianoLivePos.y = g.position.y
    pianoLivePos.z = g.position.z
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
  /** pause rendering (tab not focused and Discover Mode closed) */
  active?: boolean
}

export default function DiscoverScene3D({ width, height, active = true }: Props) {
  // Fresh state whenever the scene mounts
  useMemo(() => {
    const s = discoverState
    s.introT = 0
    s.revealPhase = 0
    s.revealProgress = 0
    s.revealRequested = false
    s.dragRotY = 0
    s.dragRotX = 0
    s.dragVelY = 0
    pianoLivePos.presence = 0
    pianoLivePos.recede = 0
  }, [])
  discoverState.viewW = width
  discoverState.viewH = height
  const size = pianoSize(width, height)

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Canvas
        style={{ flex: 1 }}
        frameloop={active ? 'always' : 'never'}
        // Explicit rotation: no default lookAt — the framing math assumes a
        // camera looking straight down -Z.
        camera={{ position: [0, 0, CAM_Z], rotation: [0, 0, 0], fov: FOV, near: 0.1, far: 120 }}
        gl={{ antialias: true }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.3
          scene.background = new THREE.Color('#050508')
        }}
      >
        <StudioEnvironment />
        <CinematicLighting />
        <RevealOrchestrator />
        <CameraRig />

        {/* The background lives from the first frame — it never waits on the model */}
        <ObservatoryBackdrop />

        <Suspense fallback={null}>
          <PianoModel size={size} viewH={height} />
        </Suspense>
        <PianoDust size={size} />
      </Canvas>
    </View>
  )
}

/**
 * The Observatory's living background (web ObservatoryScene, mobile port):
 * deep cosmic dust, minute atmospheric gold, falling dust, the emerging
 * golden threads (quicker than web) and sparkle — plus the dust lifting off
 * the piano. Counts / horizontal spread use MOBILE_DENSITY, point sizes use
 * PX_SCALE, exactly like the Home scene.
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber/native'
import * as THREE from 'three'
import { PX_SCALE, MOBILE_DENSITY as M } from '../scene/sceneState'
import { discoverState, pianoLivePos } from './discoverState'
import {
  header, FRAG_DISK, VERT_BACKGROUND, VERT_ATMOSPHERIC, VERT_FALLING, VERT_THREADS,
  VERT_SPARKLE, VERT_PIANO_EMISSION, VERT_PIANO_GLINT,
} from './observatoryShaders'

const HEADER = header(PX_SCALE, M)

function makeGeo(n: number, posFn: (i: number) => [number, number, number]) {
  const pos = new Float32Array(n * 3)
  const seeds = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const [x, y, z] = posFn(i)
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z
    seeds[i] = Math.random()
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  // Shader-displaced points: never cull on the CPU-side bounds
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
  return g
}

function makeMat(vert: string, extra: Record<string, THREE.IUniform> = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: HEADER + vert,
    fragmentShader: FRAG_DISK,
    uniforms: {
      uTime: { value: 0 }, uOpacity: { value: 0 }, uSize: { value: 1 }, uBoost: { value: 0 },
      ...extra,
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

function Layer({ geo, mat }: { geo: THREE.BufferGeometry; mat: THREE.ShaderMaterial }) {
  const pts = useMemo(() => {
    const p = new THREE.Points(geo, mat)
    p.frustumCulled = false
    return p
  }, [geo, mat])
  return <primitive object={pts} />
}

// Search pulse → a brief shimmer through the threads (shared by all layers)
const boost = { value: 0, lastPulse: 0 }
function useBoost() {
  useFrame((_, dt) => {
    if (discoverState.searchPulse !== boost.lastPulse) {
      boost.lastPulse = discoverState.searchPulse
      boost.value = 1
    }
    boost.value *= Math.exp(-dt * 2.2)
  })
}

/** ramp 0→1 from `delay` over `dur` seconds of scene time */
function ramp(delay: number, dur: number, pow = 1) {
  return Math.pow(Math.max(0, Math.min(1, (discoverState.introT - delay) / dur)), pow)
}

function useLayerFrame(mat: THREE.ShaderMaterial, size: number, target: () => number, rate = 0.04) {
  useFrame(({ clock }) => {
    const u = mat.uniforms
    u.uTime.value = clock.getElapsedTime()
    u.uSize.value = size
    u.uBoost.value = boost.value
    u.uOpacity.value += (target() - u.uOpacity.value) * rate
  })
}

function BackgroundDust() {
  const geo = useMemo(() => makeGeo(Math.round(18000 * M), () => [
    (Math.random() - 0.5) * 34 * M, (Math.random() - 0.5) * 20, -12 - Math.random() * 14,
  ]), [])
  const mat = useMemo(() => makeMat(VERT_BACKGROUND), [])
  useLayerFrame(mat, 0.2, () => ramp(0.6, 4) * 0.78)
  return <Layer geo={geo} mat={mat} />
}

function AtmosphericDust() {
  const geo = useMemo(() => makeGeo(Math.round(70000 * M), () => [
    (Math.random() - 0.5) * 26 * M, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 20 - 5,
  ]), [])
  const mat = useMemo(() => makeMat(VERT_ATMOSPHERIC), [])
  // "Very minuscule" star dust: a touch finer than web (0.055)
  useLayerFrame(mat, 0.044, () => Math.min(1, Math.pow(ramp(0.05, 0.6), 2.8)) * 0.9)
  return <Layer geo={geo} mat={mat} />
}

function FallingDust() {
  const geo = useMemo(() => makeGeo(Math.round(28000 * M), () => [
    (Math.random() - 0.5) * 24 * M, 0, (Math.random() - 0.5) * 14 - 4,
  ]), [])
  const mat = useMemo(() => makeMat(VERT_FALLING), [])
  useLayerFrame(mat, 0.044, () => ramp(0.5, 3) * 0.9)
  return <Layer geo={geo} mat={mat} />
}

function EmergingThreads() {
  const geo = useMemo(() => makeGeo(Math.round(90000 * M), () => [0, 0, 0]), [])
  const mat = useMemo(() => makeMat(VERT_THREADS), [])
  useLayerFrame(mat, 0.056, () => Math.pow(ramp(0.6, 2), 0.7) * 0.95, 0.035)
  return <Layer geo={geo} mat={mat} />
}

function Sparkle() {
  const geo = useMemo(() => makeGeo(Math.round(22000 * M), () => [0, 0, 0]), [])
  const mat = useMemo(() => makeMat(VERT_SPARKLE), [])
  useLayerFrame(mat, 0.058, () => Math.pow(ramp(1.2, 2.5), 0.6) * 0.9, 0.035)
  return <Layer geo={geo} mat={mat} />
}

/** Everything behind the piano. Tilt sways the whole field a touch (parallax). */
export function ObservatoryBackdrop() {
  const ref = useRef<THREE.Group>(null)
  useBoost()
  useFrame(() => {
    const g = ref.current
    if (!g) return
    g.position.x += (discoverState.pointerX * 0.35 - g.position.x) * 0.04
    g.position.y += (discoverState.pointerY * 0.22 - g.position.y) * 0.04
  })
  return (
    <group ref={ref}>
      <BackgroundDust />
      <AtmosphericDust />
      <FallingDust />
      <EmergingThreads />
      <Sparkle />
    </group>
  )
}

// ── Dust that comes off the piano ───────────────────────────────────────────
function pianoUniforms() {
  return { uPiano: { value: new THREE.Vector3() }, uPianoSize: { value: 2 } }
}

function usePianoLayer(mat: THREE.ShaderMaterial, size: number, peak: number, sizeRef: { current: number }) {
  useFrame(({ clock }) => {
    const u = mat.uniforms
    u.uTime.value = clock.getElapsedTime()
    u.uSize.value = size
    u.uBoost.value = boost.value
    u.uPiano.value.set(pianoLivePos.x, pianoLivePos.y, pianoLivePos.z)
    u.uPianoSize.value = sizeRef.current
    const { revealPhase: phase, revealProgress: rp } = discoverState
    const lit = phase < 2 ? 0 : phase === 2 ? Math.pow(rp, 0.7) : 1
    u.uOpacity.value += (lit * pianoLivePos.presence * peak - u.uOpacity.value) * 0.06
  })
}

export function PianoDust({ size }: { size: number }) {
  const sizeRef = useRef(size)
  sizeRef.current = size
  const emitGeo = useMemo(() => makeGeo(14000, () => [0, 0, 0]), [])
  const emitMat = useMemo(() => makeMat(VERT_PIANO_EMISSION, pianoUniforms()), [])
  const glintGeo = useMemo(() => makeGeo(2400, () => [0, 0, 0]), [])
  const glintMat = useMemo(() => makeMat(VERT_PIANO_GLINT, pianoUniforms()), [])
  usePianoLayer(emitMat, 0.05, 0.92, sizeRef)
  usePianoLayer(glintMat, 0.06, 0.85, sizeRef)
  return (
    <>
      <Layer geo={emitGeo} mat={emitMat} />
      <Layer geo={glintGeo} mat={glintMat} />
    </>
  )
}

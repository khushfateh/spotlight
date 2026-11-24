/**
 * Atmosphere — native port of the home-relevant parts of web's
 * components/experience/exhibition/EnvironmentLayer.tsx:
 *   HazeSphere · FrequencyRings (gold vinyl-groove threads) · AmbientSparkles
 *
 * drei's <Sparkles> isn't available in React Native, so AmbientSparkles is
 * re-implemented with an equivalent shader (same counts/scales/colours).
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber/native'
import * as THREE from 'three'
import { sceneState, PX_SCALE, MOBILE_DENSITY as M } from './sceneState'

// ── Gold frequency rings around the saxophone ───────────────────────────────
function FrequencyRings() {
  const refs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)]
  const matRefs = [useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null)]

  useFrame((_, dt) => {
    // Rings appear with the reveal rather than before the sax exists
    const show = sceneState.revealPhase >= 2 ? 1 : 0
    refs.forEach((r, i) => {
      if (!r.current) return
      r.current.rotation.z += dt * (0.06 + i * 0.025)
      r.current.rotation.x = 0.32 + i * 0.11
      const m = matRefs[i].current
      if (m) m.opacity += (show * (0.045 - i * 0.012) * 1.6 - m.opacity) * 0.02
    })
  })

  return (
    <group>
      {/* Radii scaled for portrait so the rings frame the sax on a phone */}
      {([2.6, 3.6, 4.8] as const).map((r, i) => (
        <mesh key={i} ref={refs[i]} frustumCulled={false}>
          <torusGeometry args={[r, 0.008 + i * 0.003, 3, 128]} />
          <meshBasicMaterial
            ref={matRefs[i]}
            color="#C9A84C"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Dark warm haze sphere wrapping the scene ────────────────────────────────
function HazeSphere() {
  return (
    <mesh scale={28} frustumCulled={false}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#120800" side={THREE.BackSide} transparent opacity={0.55} depthWrite={false} />
    </mesh>
  )
}

// ── Ambient sparkles (drei <Sparkles> equivalent) ───────────────────────────
const VERT_SPARK = /* glsl */`
  #define PX_SCALE ${PX_SCALE}
  uniform float uTime;
  uniform float uSize;
  uniform float uSpeed;
  uniform float uNoise;
  attribute float aSeed;
  varying float vTwinkle;
  void main() {
    float s = aSeed;
    vec3 p = position;
    float t = uTime * uSpeed;
    p.x += sin(t * (0.8 + fract(s * 3.1)) + s * 17.0) * 0.12 * uNoise;
    p.y += cos(t * (0.6 + fract(s * 5.7)) + s * 11.0) * 0.12 * uNoise + sin(t * 0.3 + s * 7.0) * 0.08 * uNoise;
    p.z += sin(t * (0.5 + fract(s * 7.3)) + s * 23.0) * 0.10 * uNoise;
    vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + fract(s * 9.1) * 1.4) + s * 40.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = PX_SCALE * uSize * 25.0 * (1.0 / -mv.z) * 1.8;
    gl_Position  = projectionMatrix * mv;
  }
`
const FRAG_SPARK = /* glsl */`
  uniform vec3  uColor;
  uniform float uOpacity;
  varying float vTwinkle;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / d - 0.1;
    if (strength <= 0.0) discard;
    gl_FragColor = vec4(uColor, clamp(strength, 0.0, 1.0) * uOpacity * vTwinkle);
  }
`

interface SparkSpec { count: number; scale: [number, number, number]; size: number; speed: number; opacity: number; color: string; noise: number }

function SparkleField({ spec }: { spec: SparkSpec }) {
  const { pts, mat } = useMemo(() => {
    const N = Math.round(spec.count * M)
    const pos = new Float32Array(N * 3)
    const seed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - 0.5) * spec.scale[0] * M
      pos[i*3+1] = (Math.random() - 0.5) * spec.scale[1]
      pos[i*3+2] = (Math.random() - 0.5) * spec.scale[2]
      seed[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT_SPARK,
      fragmentShader: FRAG_SPARK,
      uniforms: {
        uTime: { value: 0 }, uSize: { value: spec.size }, uSpeed: { value: spec.speed },
        uNoise: { value: spec.noise }, uColor: { value: new THREE.Color(spec.color) }, uOpacity: { value: 0 },
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const p = new THREE.Points(g, m)
    p.frustumCulled = false
    return { pts: p, mat: m }
  }, [spec])

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.getElapsedTime()
    const tgt = Math.min(1, sceneState.introT / 2.5) * spec.opacity
    mat.uniforms.uOpacity.value += (tgt - mat.uniforms.uOpacity.value) * 0.03
  })

  return <primitive object={pts} />
}

const SPARKS: SparkSpec[] = [
  { count: 220, scale: [24, 18, 14], size: 1.1, speed: 0.25, opacity: 0.55, color: '#f3cf86', noise: 2.4 },
  { count: 90,  scale: [20, 14, 10], size: 2.4, speed: 0.14, opacity: 0.32, color: '#ffffff', noise: 1.8 },
  { count: 45,  scale: [14, 10, 8],  size: 4.2, speed: 0.09, opacity: 0.20, color: '#e6b85c', noise: 1.2 },
]

function AmbientSparkles() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    // Device tilt plays the role of the web cursor
    g.position.x = THREE.MathUtils.lerp(g.position.x, sceneState.pointerX * 1.6, 0.04)
    g.position.y = THREE.MathUtils.lerp(g.position.y, sceneState.pointerY * 1.0, 0.04)
  })
  return (
    <group ref={groupRef}>
      {SPARKS.map((s, i) => <SparkleField key={i} spec={s} />)}
    </group>
  )
}

export default function Atmosphere({ ringsCenterY = 0 }: { ringsCenterY?: number }) {
  return (
    <>
      <HazeSphere />
      <group position={[0, ringsCenterY, 0]}>
        <FrequencyRings />
      </group>
      <AmbientSparkles />
    </>
  )
}

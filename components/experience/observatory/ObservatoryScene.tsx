'use client'

import { Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { obsState } from './observatoryState'

// ─────────────────────────────────────────────────────────────────────────────
// Shared — Gaussian disk fragment (identical to GoldDustEcosystem)
// ─────────────────────────────────────────────────────────────────────────────
const FRAG = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, exp(-d * d * 11.0) * vAlpha);
  }
`

const GLSL_GOLD = /* glsl */`
  vec3 gold(float t, float bright) {
    vec3 warm = vec3(0.76, 0.52, 0.18);
    vec3 cool = vec3(0.91, 0.82, 0.50);
    return mix(warm, cool, t) * bright;
  }
`

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeGeo(n: number, posFn: (i: number) => [number, number, number]) {
  const pos   = new Float32Array(n * 3)
  const seeds = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const [x, y, z] = posFn(i)
    pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z
    seeds[i] = Math.random()
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1))
  return g
}

function makeUniforms() {
  return {
    uTime:    { value: 0 },
    uCursor:  { value: new THREE.Vector2() },
    uOpacity: { value: 0 },
    uSize:    { value: 1.0 },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// System 1 — Atmospheric Dust  (same as home page, no saxophone anchor)
// Dense gold cloud suspended throughout the scene.
// Cursor creates a gentle atmospheric disturbance.
// ─────────────────────────────────────────────────────────────────────────────
const VERT_ATMOSPHERIC = /* glsl */`
  uniform float uTime;
  uniform vec2  uCursor;
  uniform float uOpacity;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  ${GLSL_GOLD}

  void main() {
    float s  = aSeed;
    float t1 = uTime * (0.018 + fract(s * 7.31) * 0.014);
    float t2 = uTime * (0.011 + fract(s * 3.17) * 0.009);
    float t3 = uTime * (0.007 + fract(s * 11.9) * 0.005);

    vec3 pos = position;
    pos.x += sin(t1 + s * 17.3) * 0.52 + cos(t2 * 1.3 + s * 11.7) * 0.28;
    pos.y += cos(t1 + s * 23.1) * 0.41 + sin(t2       + s *  7.9)  * 0.20;
    pos.z += sin(t3 + s * 31.4) * 0.34 + cos(t1 * 0.7 + s * 19.2)  * 0.15;

    float flicker = 0.82 + sin(uTime * (0.18 + fract(s * 4.1) * 0.4) + s * 50.0) * 0.18;
    vColor = gold(fract(s * 5.93), 0.72 + fract(s * 2.17) * 0.40);
    vAlpha = (0.20 + fract(s * 13.7) * 0.45) * flicker * uOpacity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (1.0 + fract(s * 2.1) * 0.8) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function AtmosphericDust() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const birthT = useRef(0)
  const geo = useMemo(() => makeGeo(70000, () => [
    (Math.random() - 0.5) * 26,
    (Math.random() - 0.5) * 16,
    (Math.random() - 0.5) * 20 - 5,
  ]), [])
  const unis = useMemo(makeUniforms, [])

  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    const t = clock.getElapsedTime()
    if (birthT.current === 0) birthT.current = t
    const age = t - birthT.current
    mat.uniforms.uTime.value = t
    mat.uniforms.uSize.value = 0.055
    const ramp = Math.max(0, (age - 0.05) / 0.6)
    mat.uniforms.uOpacity.value += (Math.min(1, Math.pow(ramp, 2.8)) * 0.90 - mat.uniforms.uOpacity.value) * 0.04
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} uniforms={unis}
        vertexShader={VERT_ATMOSPHERIC} fragmentShader={FRAG}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// System 2 — Emerging Threads  (the signature "coming out of screen" effect)
//
// Same curl-drift pattern as VERT_EMISSION on the home page.
// Born in the far background (Z = -8 to -16), sourced from the right side
// of the scene (where the saxophone lives on the home page), drifting
// toward the viewer with multi-frequency turbulence that creates the
// winding thread aesthetic. Fade out before reaching the camera lens.
// ─────────────────────────────────────────────────────────────────────────────
const VERT_THREADS = /* glsl */`
  uniform float uTime;
  uniform vec2  uCursor;
  uniform float uOpacity;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  const float PI  = 3.14159265;
  const float TAU = 6.28318530;
  ${GLSL_GOLD}

  void main() {
    float s = aSeed;

    // ── Per-particle lifecycle (seamless fract loop) ──────────────────────
    // Slow life → long, elegant drift (120–240 s per cycle)
    float lifeSpeed = 0.004 + fract(s * 7.31) * 0.0042;
    float birthT    = fract(uTime * lifeSpeed + s);

    // ── Birth position: right-biased background (saxophone's world) ───────
    // X: weighted toward the right (+4 to +10 range dominant)
    float birthX = 3.0 + (fract(s * 3.17) - 0.5) * 18.0;
    float birthY = (fract(s * 5.73) - 0.5) * 14.0;
    float birthZ = -8.0 - fract(s * 2.41) * 8.0;   // deep background
    vec3 birthPos = vec3(birthX, birthY, birthZ);

    // ── Drift: mostly toward viewer (+Z) with curl ────────────────────────
    // Primary forward momentum + lateral spread
    float driftAngle = fract(s * 17.3) * TAU;
    float forwardBias = 0.60 + fract(s * 6.1) * 0.28;   // 60–88% forward
    float lateralAmp  = sqrt(max(0.0, 1.0 - forwardBias * forwardBias));

    // Curl modulation on the lateral component (creates thread winding)
    float curlT = birthT * PI * 1.6 + s * TAU;
    float curlAngle = driftAngle + sin(curlT) * 0.54 + cos(curlT * 0.7) * 0.30;

    vec3 driftDir = normalize(vec3(
      cos(curlAngle) * lateralAmp * (0.65 + fract(s * 2.9) * 0.50),
      sin(curlAngle) * lateralAmp * (0.50 + fract(s * 4.7) * 0.38),
      forwardBias
    ));

    // Multi-frequency turbulence — slow, elegant undulation
    float tA = uTime * (0.007 + fract(s * 3.3) * 0.005);
    float tB = uTime * (0.005 + fract(s * 5.7) * 0.004);
    float tC = uTime * (0.003 + fract(s * 8.1) * 0.003);
    driftDir.x += sin(tA + s * 17.1) * 0.14 + cos(tB * 1.3 + s * 11.3) * 0.08;
    driftDir.y += cos(tA + s * 23.7) * 0.07 + sin(tB * 0.7 + s *  7.9)  * 0.05;
    driftDir.z += sin(tA * 1.4 + s *  9.3) * 0.06 + cos(tC + s * 13.7)  * 0.04;

    float driftAge  = 1.0 - pow(1.0 - birthT, 2.8);
    float maxTravel = 16.0 + fract(s * 4.3) * 6.0;   // 16–22 units (deep → near camera)

    vec3 pos = birthPos + driftDir * (driftAge * maxTravel);

    // ── Fade arc: in → peak → out, plus dissolve before reaching lens ─────
    float lifeAlpha = smoothstep(0.0, 0.14, birthT) * smoothstep(1.0, 0.52, birthT);
    float zFade     = smoothstep(3.5, 0.5, pos.z);    // dissolve as Z approaches camera

    vColor = gold(fract(s * 3.71), 0.68 + fract(s * 5.3) * 0.52);
    vAlpha = lifeAlpha * zFade * (0.50 + fract(s * 8.3) * 0.48) * uOpacity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float sizeScale = 1.0 + (1.0 - birthT) * 0.45;
    gl_PointSize = uSize * sizeScale * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function EmergingThreads() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const birthT = useRef(0)
  const geo = useMemo(() => makeGeo(90000, () => [0, 0, 0]), [])
  const unis = useMemo(makeUniforms, [])

  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    const t = clock.getElapsedTime()
    if (birthT.current === 0) birthT.current = t
    const age = t - birthT.current
    mat.uniforms.uTime.value = t
    mat.uniforms.uSize.value = 0.060
    // Stagger: atmospheric dust appears first, threads rise a beat later
    const ramp = Math.max(0, (age - 0.8) / 2.0)
    mat.uniforms.uOpacity.value += (Math.min(1, Math.pow(ramp, 0.7)) * 0.95 - mat.uniforms.uOpacity.value) * 0.035
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} uniforms={unis}
        vertexShader={VERT_THREADS} fragmentShader={FRAG}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// System 3 — Hero Sparkle  (bright flecks, same as home page HeroSparkle)
// Short-lived luminous particles — the freshest shimmer still near the source.
// ─────────────────────────────────────────────────────────────────────────────
const VERT_HERO = /* glsl */`
  uniform float uTime;
  uniform vec2  uCursor;
  uniform float uOpacity;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  const float PI  = 3.14159265;
  const float TAU = 6.28318530;

  void main() {
    float s = aSeed;
    float lifeSpeed = 0.030 + fract(s * 5.3) * 0.038;
    float birthT    = fract(uTime * lifeSpeed + s);

    // Born scattered slightly toward the right-background (saxophone's side)
    float birthX = 1.5 + (fract(s * 13.7) - 0.5) * 14.0;
    float birthY = (fract(s * 7.1) - 0.5) * 9.0;
    float birthZ = -3.0 - fract(s * 5.9) * 5.0;
    vec3 birthPos = vec3(birthX, birthY, birthZ);

    float tA = uTime * (0.035 + fract(s * 3.7) * 0.025);
    float driftAngle = fract(s * 17.3) * TAU + sin(tA + s * PI) * 0.40;
    vec3 driftDir = normalize(vec3(
      cos(driftAngle) * 0.55,
      0.12 + fract(s * 3.7) * 0.28,
      0.55 + fract(s * 6.1) * 0.35   // forward bias
    ));
    driftDir.x += sin(tA * 1.3 + s * 11.7) * 0.15 + uCursor.x * 0.05;
    driftDir.y += cos(tA * 0.9 + s *  7.3) * 0.12 + uCursor.y * 0.04;

    float driftAge = 1.0 - pow(1.0 - birthT, 3.2);
    vec3 pos = birthPos + driftDir * (driftAge * (3.0 + fract(s * 6.7) * 4.0));

    float lifeAlpha = smoothstep(0.0, 0.08, birthT) * smoothstep(1.0, 0.38, birthT);
    float zFade     = smoothstep(3.0, 0.5, pos.z);

    float t = fract(s * 3.7);
    vColor = mix(vec3(0.88, 0.72, 0.34), vec3(0.97, 0.90, 0.60), t);
    vAlpha = lifeAlpha * zFade * (0.65 + fract(s * 5.1) * 0.35) * uOpacity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function HeroSparkle() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const birthT = useRef(0)
  const geo = useMemo(() => makeGeo(22000, () => [0, 0, 0]), [])
  const unis = useMemo(makeUniforms, [])

  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    const t = clock.getElapsedTime()
    if (birthT.current === 0) birthT.current = t
    const age = t - birthT.current
    mat.uniforms.uTime.value = t
    mat.uniforms.uSize.value = 0.065
    const ramp = Math.max(0, (age - 1.5) / 2.5)
    mat.uniforms.uOpacity.value += (Math.min(1, Math.pow(ramp, 0.6)) * 0.92 - mat.uniforms.uOpacity.value) * 0.035
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} uniforms={unis}
        vertexShader={VERT_HERO} fragmentShader={FRAG}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// System 4 — Falling Dust  (same as home page, vertical gravity feel)
// ─────────────────────────────────────────────────────────────────────────────
const VERT_FALLING = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  ${GLSL_GOLD}

  void main() {
    float s = aSeed;
    float fallSpeed = 0.012 + fract(s * 7.3) * 0.020;
    float phase     = fract(uTime * fallSpeed + s);
    float topY = 7.0 + fract(s * 11.3) * 5.0;
    float botY = -5.0 - fract(s * 3.7) * 3.0;
    float y    = mix(topY, botY, phase);
    float driftAmp = 0.5 + fract(s * 5.1) * 0.9;
    float x = position.x + sin(phase * 3.14159 * 1.8 + s * 6.28318) * driftAmp
            + sin(uTime * 0.28 + s * 50.0) * 0.10;
    float z = position.z + cos(uTime * 0.16 + s * 30.0) * 0.18;
    float edgeFade = smoothstep(0.0, 0.07, phase) * smoothstep(1.0, 0.90, phase);
    vColor = gold(fract(s * 3.91), 0.62 + fract(s * 4.7) * 0.42);
    vAlpha = (0.22 + fract(s * 11.3) * 0.48) * edgeFade * uOpacity;
    vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
    gl_PointSize = uSize * (1.0 + fract(s * 2.7) * 1.0) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function FallingDust() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const birthT = useRef(0)
  const geo = useMemo(() => makeGeo(28000, () => [
    (Math.random() - 0.5) * 24,
    0,
    (Math.random() - 0.5) * 14 - 4,
  ]), [])
  const unis = useMemo(makeUniforms, [])

  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    const t = clock.getElapsedTime()
    if (birthT.current === 0) birthT.current = t
    const age = t - birthT.current
    mat.uniforms.uTime.value = t
    mat.uniforms.uSize.value = 0.052
    const ramp = Math.max(0, (age - 0.5) / 3.0)
    mat.uniforms.uOpacity.value += (Math.min(1, ramp) * 0.92 - mat.uniforms.uOpacity.value) * 0.04
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} uniforms={unis}
        vertexShader={VERT_FALLING} fragmentShader={FRAG}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// System 5 — Background Cosmic Dust  (identical to home page BackgroundDust)
// Provides infinite depth — particles far behind everything, twinkling slowly.
// ─────────────────────────────────────────────────────────────────────────────
const VERT_BACKGROUND = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  ${GLSL_GOLD}

  void main() {
    float s  = aSeed;
    float t1 = uTime * (0.003 + fract(s * 4.3) * 0.003);
    vec3 pos = position;
    pos.x += sin(t1 + s * 19.3) * 0.20;
    pos.y += cos(t1 + s * 13.7) * 0.14;
    float twinkle = 0.45 + sin(uTime * (0.06 + fract(s * 3.1) * 0.12) + s * 40.0) * 0.55;
    vColor = gold(fract(s * 2.89), 0.48 + fract(s * 6.1) * 0.32);
    vAlpha = (0.18 + fract(s * 7.1) * 0.42) * twinkle * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function BackgroundDust() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const birthT = useRef(0)
  const geo = useMemo(() => makeGeo(18000, () => [
    (Math.random() - 0.5) * 34,
    (Math.random() - 0.5) * 20,
    -12 - Math.random() * 14,
  ]), [])
  const unis = useMemo(makeUniforms, [])

  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    const t = clock.getElapsedTime()
    if (birthT.current === 0) birthT.current = t
    const age = t - birthT.current
    mat.uniforms.uTime.value = t
    mat.uniforms.uSize.value = 0.22
    const ramp = Math.max(0, (age - 1.0) / 4.5)
    mat.uniforms.uOpacity.value += (Math.min(1, ramp) * 0.78 - mat.uniforms.uOpacity.value) * 0.04
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} uniforms={unis}
        vertexShader={VERT_BACKGROUND} fragmentShader={FRAG}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas — full-screen, non-interactive, z-3
// Same #050508 background and full gold thread atmosphere as home page.
// No piano. No drag overlay. Just the living golden nebula.
// ─────────────────────────────────────────────────────────────────────────────
interface ObservatorySceneProps { query: string }

export default function ObservatoryScene({ query }: ObservatorySceneProps) {
  useEffect(() => {
    const prev = obsState.searchQuery
    obsState.searchQuery  = query
    obsState.searchActive = query.trim().length > 0
    if (query !== prev && query.trim().length > 0) obsState.searchPulse += 1
  }, [query])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3,
      pointerEvents: 'none',
      background: '#050508',
    }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 46, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, toneMappingExposure: 1.28 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#050508']} />

        <Suspense fallback={null}>
          <BackgroundDust />
          <AtmosphericDust />
          <FallingDust />
          <EmergingThreads />
          <HeroSparkle />
        </Suspense>

        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.68} luminanceSmoothing={0.75} intensity={0.70} radius={0.90} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

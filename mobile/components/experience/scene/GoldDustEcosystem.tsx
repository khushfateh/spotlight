/**
 * GoldDustEcosystem — native port of web's
 * components/experience/exhibition/GoldDustEcosystem.tsx
 *
 * The saxophone is the eternal source of a golden nebula: atmospheric dust,
 * surface emission, hero flecks, falling dust, deep cosmic dust and a ground
 * accumulation. Shaders are identical to web; only counts / horizontal spread
 * (MOBILE_DENSITY) and point size (PX_SCALE) are adapted for phones.
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber/native'
import * as THREE from 'three'
import { sceneState, saxLivePos, PX_SCALE, MOBILE_DENSITY as M } from './sceneState'

const PX = /* glsl */`#define PX_SCALE ${PX_SCALE}\n`

const FRAG = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    vec2  uv = gl_PointCoord - 0.5;
    float d  = length(uv);
    if (d > 0.5) discard;
    float a = exp(-d * d * 11.0) * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`

const GLSL_GOLD = /* glsl */`
  vec3 gold(float t, float bright) {
    vec3 warm = vec3(0.76, 0.52, 0.18);
    vec3 cool = vec3(0.91, 0.82, 0.50);
    return mix(warm, cool, t) * bright;
  }
`

function makeGeo(n: number, posFn: (i: number) => [number, number, number]) {
  const pos   = new Float32Array(n * 3)
  const seeds = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const [x, y, z] = posFn(i)
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z
    seeds[i] = Math.random()
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1))
  // Shader-displaced points: never frustum-cull on the CPU-side bounds
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
  return g
}

function makeUniforms() {
  return {
    uTime:    { value: 0 },
    uSax:     { value: new THREE.Vector3() },
    uCursor:  { value: new THREE.Vector2() },
    uScroll:  { value: 0 },
    uOpacity: { value: 0 },
    uSize:    { value: 1.0 },
    uSaxVel:  { value: 0 },
  }
}

function makeMat(vert: string) {
  return new THREE.ShaderMaterial({
    vertexShader: PX + vert,
    fragmentShader: FRAG,
    uniforms: makeUniforms(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

function useParticleFrame(mat: THREE.ShaderMaterial, size: number, getOpacity: () => number) {
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uSax.value.set(saxLivePos.x, saxLivePos.y, saxLivePos.z)
    mat.uniforms.uCursor.value.set(sceneState.pointerX, sceneState.pointerY)
    mat.uniforms.uScroll.value = sceneState.scrollProgress
    mat.uniforms.uSize.value   = size
    mat.uniforms.uOpacity.value += (getOpacity() - mat.uniforms.uOpacity.value) * 0.04
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

// ── System 1 — Atmospheric Dust ─────────────────────────────────────────────
const VERT_ATMOSPHERIC = /* glsl */`
  uniform float uTime;
  uniform vec3  uSax;
  uniform vec2  uCursor;
  uniform float uOpacity;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  ${GLSL_GOLD}
  void main() {
    float s = aSeed;
    float t1 = uTime * (0.018 + fract(s * 7.31) * 0.014);
    float t2 = uTime * (0.011 + fract(s * 3.17) * 0.009);
    float t3 = uTime * (0.007 + fract(s * 11.9) * 0.005);
    vec3 pos = position;
    pos.x += sin(t1 + s * 17.3) * 0.52  + cos(t2 * 1.3  + s * 11.7) * 0.28;
    pos.y += cos(t1 + s * 23.1) * 0.41  + sin(t2        + s *  7.9)  * 0.20;
    pos.z += sin(t3 + s * 31.4) * 0.34  + cos(t1 * 0.7  + s * 19.2) * 0.15;
    pos.x += uCursor.x * (0.04 + fract(s * 5.3) * 0.06);
    pos.y += uCursor.y * (0.03 + fract(s * 8.7) * 0.05);
    float distToSax = length(pos.xy - uSax.xy);
    float densityBoost = 1.0 + smoothstep(5.5, 0.6, distToSax) * 0.85;
    float flicker = 0.82 + sin(uTime * (0.18 + fract(s * 4.1) * 0.4) + s * 50.0) * 0.18;
    vColor = gold(fract(s * 5.93), 0.72 + fract(s * 2.17) * 0.40);
    vAlpha = (0.20 + fract(s * 13.7) * 0.45) * flicker * densityBoost * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = PX_SCALE * uSize * (1.0 + fract(s * 2.1) * 0.8) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function AtmosphericDust() {
  const geo = useMemo(() => makeGeo(Math.round(70000 * M), () => [
    (Math.random() - 0.5) * 22 * M,
    (Math.random() - 0.5) * 14,
    (Math.random() - 0.5) * 18 - 5,
  ]), [])
  const mat = useMemo(() => makeMat(VERT_ATMOSPHERIC), [])
  useParticleFrame(mat, 0.055, () => {
    const ramp = Math.max(0, (sceneState.introT - 0.05) / 0.6)
    return Math.min(1, Math.pow(ramp, 2.8)) * 0.90
  })
  return <Layer geo={geo} mat={mat} />
}

// ── System 2 — Saxophone Emission ───────────────────────────────────────────
const VERT_EMISSION = /* glsl */`
  uniform float uTime;
  uniform vec3  uSax;
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
    float lifeSpeed = 0.022 + fract(s * 7.31) * 0.038;
    float birthT    = fract(uTime * lifeSpeed + s);
    float zoneRng = fract(s * 3.71);
    float zoneY, minR, maxR;
    if (zoneRng < 0.35) {
      zoneY = mix(-1.4,  0.5, fract(s * 11.3));
      minR  = 0.22;  maxR = 0.46;
    } else if (zoneRng < 0.60) {
      zoneY = mix(-2.4, -1.3, fract(s *  5.7));
      minR  = 0.38 + fract(s * 2.3) * 0.42;
      maxR  = minR + 0.14;
    } else if (zoneRng < 0.85) {
      zoneY = mix(-2.0,  1.6, fract(s *  9.1));
      minR  = 0.06;  maxR = 0.20;
    } else {
      zoneY = mix( 0.5,  2.0, fract(s *  7.7));
      minR  = 0.06;  maxR = 0.18;
    }
    float birthR     = minR + fract(s * 13.7) * (maxR - minR);
    float birthTheta = fract(s * 17.3) * TAU;
    vec3 birthPos = uSax + vec3(cos(birthTheta) * birthR, zoneY, sin(birthTheta) * birthR * 0.36);
    float driftAge  = 1.0 - pow(1.0 - birthT, 2.8);
    float maxTravel = 0.8 + fract(s * 4.3) * 3.8;
    float curlT     = birthT * PI * 1.6 + s * TAU;
    float driftAngle = birthTheta + sin(curlT) * 0.52 + cos(curlT * 0.7) * 0.28;
    vec3 driftDir = normalize(vec3(
      cos(driftAngle) * (0.68 + fract(s * 2.9) * 0.52),
      0.10 + fract(s * 6.1) * 0.22,
      sin(driftAngle) * (0.30 + fract(s * 4.7) * 0.26)
    ));
    float tA = uTime * (0.022 + fract(s * 3.3) * 0.018);
    float tB = uTime * (0.015 + fract(s * 5.7) * 0.012);
    float tC = uTime * (0.009 + fract(s * 8.1) * 0.008);
    driftDir.x += sin(tA + s * 17.1) * 0.24 + cos(tB * 1.3 + s * 11.3) * 0.14;
    driftDir.y += cos(tA + s * 23.7) * 0.11 + sin(tB * 0.7 + s *  7.9) * 0.08;
    driftDir.z += sin(tA * 1.4 + s *  9.3) * 0.18 + cos(tC + s * 13.7) * 0.09;
    vec3 pos = birthPos + driftDir * (driftAge * maxTravel);
    float lifeAlpha = smoothstep(0.0, 0.14, birthT) * smoothstep(1.0, 0.52, birthT);
    vColor = gold(fract(s * 3.71), 0.68 + fract(s * 5.3) * 0.52);
    vAlpha = lifeAlpha * (0.50 + fract(s * 8.3) * 0.48) * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float sizeScale = 1.0 + (1.0 - birthT) * 0.45;
    gl_PointSize = PX_SCALE * uSize * sizeScale * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function SaxEmission() {
  // Emission is local to the sax, so it keeps a higher share of its count
  const geo = useMemo(() => makeGeo(Math.round(48000 * 0.7), () => [0, 0, 0]), [])
  const mat = useMemo(() => makeMat(VERT_EMISSION), [])
  useParticleFrame(mat, 0.060, () => {
    const { revealPhase: phase, revealProgress: rp } = sceneState
    if (phase < 2) return 0
    if (phase === 2) return Math.pow(rp, 0.7) * 0.95
    return 0.95
  })
  return <Layer geo={geo} mat={mat} />
}

// ── System 3 — Hero Sparkle ─────────────────────────────────────────────────
const VERT_HERO = /* glsl */`
  uniform float uTime;
  uniform vec3  uSax;
  uniform float uOpacity;
  uniform float uSize;
  uniform float uSaxVel;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  const float PI  = 3.14159265;
  const float TAU = 6.28318530;
  void main() {
    float s = aSeed;
    float lifeSpeed = 0.08 + fract(s * 5.3) * 0.10;
    float birthT    = fract(uTime * lifeSpeed + s);
    float zoneRng = fract(s * 4.17);
    float heroY, heroR;
    if (zoneRng < 0.40) {
      heroY = mix(-0.6, 1.0, fract(s * 7.1));
      heroR = 0.18 + fract(s * 3.1) * 0.24;
    } else if (zoneRng < 0.68) {
      heroY = mix(-2.1, -1.3, fract(s * 5.9));
      heroR = 0.42 + fract(s * 2.3) * 0.32;
    } else {
      heroY = mix( 0.9,  2.0, fract(s * 9.3));
      heroR = 0.06 + fract(s * 4.7) * 0.14;
    }
    float birthTheta = fract(s * 13.1) * TAU;
    vec3 birthPos = uSax + vec3(cos(birthTheta) * heroR, heroY, sin(birthTheta) * heroR * 0.34);
    float driftAge = 1.0 - pow(1.0 - birthT, 3.2);
    float travel   = 0.25 + fract(s * 6.7) * 1.0;
    float tA = uTime * (0.035 + fract(s * 3.7) * 0.025);
    float driftAngle = birthTheta + sin(tA + s * PI) * 0.40;
    vec3 driftDir = normalize(vec3(cos(driftAngle) * 0.75, 0.12 + fract(s * 3.7) * 0.28, sin(driftAngle) * 0.28));
    driftDir.x += sin(tA * 1.3 + s * 11.7) * 0.15;
    driftDir.z += cos(tA * 0.9 + s *  7.3) * 0.12;
    vec3 pos = birthPos + driftDir * (driftAge * travel);
    float lifeAlpha = smoothstep(0.0, 0.08, birthT) * smoothstep(1.0, 0.38, birthT);
    float motionBoost = 1.0 + clamp(uSaxVel * 4.5, 0.0, 1.8);
    float t = fract(s * 3.7);
    vColor = mix(vec3(0.88, 0.72, 0.34), vec3(0.97, 0.90, 0.60), t);
    vAlpha = lifeAlpha * motionBoost * (0.65 + fract(s * 5.1) * 0.35) * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = PX_SCALE * uSize * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function HeroSparkle() {
  const smoothVel = useRef(0)
  const geo = useMemo(() => makeGeo(Math.round(20000 * 0.7), () => [0, 0, 0]), [])
  const mat = useMemo(() => makeMat(VERT_HERO), [])

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uSax.value.set(saxLivePos.x, saxLivePos.y, saxLivePos.z)
    mat.uniforms.uSize.value = 0.065
    const { revealPhase: phase, revealProgress: rp } = sceneState
    const target = phase < 3
      ? (phase === 2 && rp > 0.80 ? (rp - 0.80) / 0.20 * 0.35 : 0)
      : 0.92
    mat.uniforms.uOpacity.value += (target - mat.uniforms.uOpacity.value) * 0.04
    const dx = saxLivePos.x - saxLivePos.prevX
    const dy = saxLivePos.y - saxLivePos.prevY
    const vel = Math.sqrt(dx * dx + dy * dy) * 60
    smoothVel.current += (vel - smoothVel.current) * 0.10
    mat.uniforms.uSaxVel.value = smoothVel.current
  })
  return <Layer geo={geo} mat={mat} />
}

// ── System 4 — Infinite Falling Dust ────────────────────────────────────────
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
    gl_PointSize = PX_SCALE * uSize * (1.0 + fract(s * 2.7) * 1.0) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function FallingDust() {
  const geo = useMemo(() => makeGeo(Math.round(30000 * M), () => [
    (Math.random() - 0.5) * 20 * M,
    0,
    (Math.random() - 0.5) * 12 - 3,
  ]), [])
  const mat = useMemo(() => makeMat(VERT_FALLING), [])
  useParticleFrame(mat, 0.052, () => Math.max(0, Math.min(1, (sceneState.introT - 0.5) / 3.0)) * 0.92)
  return <Layer geo={geo} mat={mat} />
}

// ── System 5 — Background Cosmic Dust ───────────────────────────────────────
const VERT_BACKGROUND = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  ${GLSL_GOLD}
  void main() {
    float s = aSeed;
    float t1 = uTime * (0.003 + fract(s * 4.3) * 0.003);
    vec3 pos = position;
    pos.x += sin(t1 + s * 19.3) * 0.20;
    pos.y += cos(t1 + s * 13.7) * 0.14;
    float twinkle = 0.45 + sin(uTime * (0.06 + fract(s * 3.1) * 0.12) + s * 40.0) * 0.55;
    vColor = gold(fract(s * 2.89), 0.48 + fract(s * 6.1) * 0.32);
    vAlpha = (0.18 + fract(s * 7.1) * 0.42) * twinkle * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = PX_SCALE * uSize * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function BackgroundDust() {
  const geo = useMemo(() => makeGeo(Math.round(20000 * M), () => [
    (Math.random() - 0.5) * 30 * M,
    (Math.random() - 0.5) * 18,
    -10 - Math.random() * 14,
  ]), [])
  const mat = useMemo(() => makeMat(VERT_BACKGROUND), [])
  useParticleFrame(mat, 0.22, () => Math.max(0, Math.min(1, (sceneState.introT - 1.0) / 4.5)) * 0.78)
  return <Layer geo={geo} mat={mat} />
}

// ── System 6 — Ground Accumulation ──────────────────────────────────────────
const VERT_GROUND = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScroll;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  ${GLSL_GOLD}
  void main() {
    float s = aSeed;
    vec3 pos = position;
    pos.y += sin(uTime * (0.24 + fract(s * 3.7) * 0.20) + s * 7.3) * 0.050;
    pos.y += cos(uTime * (0.16 + fract(s * 5.1) * 0.14) + s * 4.9) * 0.026;
    float risePhase = fract(uTime * 0.022 * fract(s * 4.3 + 0.1) + s);
    pos.y += pow(max(0.0, sin(risePhase * 3.14159)), 3.5) * 1.8;
    float scrollReveal = smoothstep(0.50, 0.85, uScroll);
    float shimmer = 0.68 + sin(uTime * (0.4 + fract(s * 2.9) * 0.7) + s * 30.0) * 0.32;
    vColor = gold(fract(s * 4.17), shimmer * 1.05);
    vAlpha = (0.38 + fract(s * 8.3) * 0.52) * scrollReveal * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = PX_SCALE * uSize * (1.1 + fract(s * 3.1) * 1.5) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function GroundPile() {
  const geo = useMemo(() => makeGeo(Math.round(12000 * M), () => {
    const layer = Math.floor(Math.random() * 4)
    return [
      (Math.random() - 0.5) * 24 * M,
      -3.2 - layer * 0.18 - Math.random() * 0.20,
      (Math.random() - 0.5) * 12 - 2,
    ]
  }), [])
  const mat = useMemo(() => makeMat(VERT_GROUND), [])
  useParticleFrame(mat, 0.074, () => Math.max(0, Math.min(1, (sceneState.introT - 1.0) / 4.0)) * 0.90)
  return <Layer geo={geo} mat={mat} />
}

export default function GoldDustEcosystem() {
  return (
    <>
      <BackgroundDust />
      <AtmosphericDust />
      <FallingDust />
      <GroundPile />
      <SaxEmission />
      <HeroSparkle />
    </>
  )
}

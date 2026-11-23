'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { homeState, saxLivePos } from './homeState'

// ─────────────────────────────────────────────────────────────────────────────
// Philosophy: the saxophone is the eternal source of a golden nebula.
// Particles are not orbiting — they are continuously shed from every surface
// and gradually disperse into the surrounding atmosphere.
//
// Distribution:
//   60% — Atmospheric dust already suspended throughout the world
//   30% — Shimmer continuously emitted from the saxophone surface
//   10% — Hero flecks: slightly brighter, more alive during motion
// ─────────────────────────────────────────────────────────────────────────────

// Shared fragment shader — pure Gaussian falloff, no sparkle/glow artifacts.
// Looks exactly like fine metallic dust caught in a spotlight.
const FRAG = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec2  uv = gl_PointCoord - 0.5;
    float d  = length(uv);
    if (d > 0.5) discard;
    // Gaussian falloff: smooth, natural dust — no hard edges, no artificial center glow
    float a = exp(-d * d * 11.0) * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`

// Gold palette: warm antique gold ↔ pale champagne (linear RGB)
const GLSL_GOLD = /* glsl */`
  vec3 gold(float t, float bright) {
    vec3 warm = vec3(0.76, 0.52, 0.18);  // antique amber
    vec3 cool = vec3(0.91, 0.82, 0.50);  // champagne
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
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z
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
    uSax:     { value: new THREE.Vector3() },
    uCursor:  { value: new THREE.Vector2() },
    uScroll:  { value: 0 },
    uOpacity: { value: 0 },
    uSize:    { value: 1.0 },
  }
}

function useParticleFrame(
  matRef:     React.MutableRefObject<THREE.ShaderMaterial | null>,
  size:       number,
  getOpacity: () => number,
) {
  useFrame(({ clock }) => {
    const mat = matRef.current
    if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uSax.value.set(saxLivePos.x, saxLivePos.y, saxLivePos.z)
    mat.uniforms.uCursor.value.set(homeState.pointerX, homeState.pointerY)
    mat.uniforms.uScroll.value  = homeState.scrollProgress
    mat.uniforms.uSize.value    = size
    mat.uniforms.uOpacity.value += (getOpacity() - mat.uniforms.uOpacity.value) * 0.04
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// System 1 — Atmospheric Dust  (60% of ecosystem)
// Particles already suspended throughout the world — the accumulated result
// of centuries of saxophone shimmer dispersing into the atmosphere.
// Density is visually higher near the saxophone (opacity boost, not orbit).
// ─────────────────────────────────────────────────────────────────────────────
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

    // Three overlapping slow frequencies — organic, never mechanical
    float t1 = uTime * (0.018 + fract(s * 7.31) * 0.014);
    float t2 = uTime * (0.011 + fract(s * 3.17) * 0.009);
    float t3 = uTime * (0.007 + fract(s * 11.9) * 0.005);

    vec3 pos = position;
    pos.x += sin(t1 + s * 17.3) * 0.52  + cos(t2 * 1.3  + s * 11.7) * 0.28;
    pos.y += cos(t1 + s * 23.1) * 0.41  + sin(t2        + s *  7.9)  * 0.20;
    pos.z += sin(t3 + s * 31.4) * 0.34  + cos(t1 * 0.7  + s * 19.2) * 0.15;

    // Cursor: gentle atmospheric disturbance, falls off with distance from center
    pos.x += uCursor.x * (0.04 + fract(s * 5.3) * 0.06);
    pos.y += uCursor.y * (0.03 + fract(s * 8.7) * 0.05);

    // ── Density gradient: atmosphere is denser close to the saxophone ────────
    // This is NOT positional — particles don't move toward the sax.
    // Only their opacity increases near it, creating the visual impression of
    // a denser cloud around the instrument.
    float distToSax = length(pos.xy - uSax.xy);
    float densityBoost = 1.0 + smoothstep(5.5, 0.6, distToSax) * 0.85;

    // Subtle brightness flicker — different per particle, very slow
    float flicker = 0.82 + sin(uTime * (0.18 + fract(s * 4.1) * 0.4) + s * 50.0) * 0.18;

    vColor = gold(fract(s * 5.93), 0.72 + fract(s * 2.17) * 0.40);
    vAlpha = (0.20 + fract(s * 13.7) * 0.45) * flicker * densityBoost * uOpacity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (1.0 + fract(s * 2.1) * 0.8) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function AtmosphericDust() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const geo = useMemo(() => makeGeo(70000, () => [
    (Math.random() - 0.5) * 22,
    (Math.random() - 0.5) * 14,
    (Math.random() - 0.5) * 18 - 5,
  ]), [])

  useParticleFrame(matRef, 0.055, () => {
    const t = homeState.introT
    // Steep cubic ramp: only the very brightest particles visible at first.
    // Because vAlpha varies per seed, a low uOpacity means 1-3 particles appear
    // before the rest — exactly the "one particle, then several" effect.
    const ramp = Math.max(0, (t - 0.05) / 0.6)
    return Math.min(1, Math.pow(ramp, 2.8)) * 0.90
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_ATMOSPHERIC} fragmentShader={FRAG}
        uniforms={useMemo(makeUniforms, [])} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// System 2 — Saxophone Emission  (30% of ecosystem)
// Particles continuously shed from every surface of the saxophone.
// They drift outward and upward with organic turbulence, gradually joining
// the larger atmospheric ecosystem. The saxophone is the eternal source.
//
// NO circular paths. NO orbital motion.
// Birth → drift away → disperse → invisible → recycle (born again at surface).
// ─────────────────────────────────────────────────────────────────────────────
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

    // ── Particle lifecycle ────────────────────────────────────────────────
    // Each particle has a unique lifespan. fract() creates a seamless loop.
    // birthT = 0.0 → just born at saxophone surface (invisible, recycling)
    // birthT = 0.1 → fading in, very close to surface
    // birthT = 0.5 → mid-drift, at peak brightness
    // birthT = 1.0 → faded out, far from saxophone (then recycles)
    float lifeSpeed = 0.022 + fract(s * 7.31) * 0.038;  // 16–59 second lives
    float birthT    = fract(uTime * lifeSpeed + s);

    // ── Emission zone: distributed across the saxophone's physical surfaces ─
    // Zone 0 (35%): main body — the curved brass body
    // Zone 1 (25%): bell — the flared bottom, widest emission zone
    // Zone 2 (25%): keys and engraved detail areas — tight radius, full height
    // Zone 3 (15%): neck and upper curves toward mouthpiece
    float zoneRng = fract(s * 3.71);
    float zoneY, minR, maxR;

    if (zoneRng < 0.35) {
      zoneY = mix(-1.4,  0.5, fract(s * 11.3));
      minR  = 0.22;  maxR = 0.46;
    } else if (zoneRng < 0.60) {
      zoneY = mix(-2.4, -1.3, fract(s *  5.7));
      minR  = 0.38 + fract(s * 2.3) * 0.42;   // flared bell
      maxR  = minR + 0.14;
    } else if (zoneRng < 0.85) {
      zoneY = mix(-2.0,  1.6, fract(s *  9.1));  // full height (keys)
      minR  = 0.06;  maxR = 0.20;
    } else {
      zoneY = mix( 0.5,  2.0, fract(s *  7.7));  // neck / upper
      minR  = 0.06;  maxR = 0.18;
    }

    float birthR     = minR + fract(s * 13.7) * (maxR - minR);
    float birthTheta = fract(s * 17.3) * TAU;

    // Birth position on the saxophone surface
    vec3 birthPos = uSax + vec3(
      cos(birthTheta) * birthR,
      zoneY,
      sin(birthTheta) * birthR * 0.36   // sax is narrow in Z
    );

    // ── Drift: outward from surface + gentle upward bias ──────────────────
    // Ease-out deceleration: particles rush from the surface, then slow,
    // mimicking real dust released into still air.
    float driftAge  = 1.0 - pow(1.0 - birthT, 2.8);
    float maxTravel = 0.8 + fract(s * 4.3) * 3.8;   // 0.8 – 4.6 world units

    // Primary outward direction — NOT circular, just radially away
    // Add subtle curl to prevent any directional pattern
    float curlT     = birthT * PI * 1.6 + s * TAU;
    float driftAngle = birthTheta + sin(curlT) * 0.52 + cos(curlT * 0.7) * 0.28;

    vec3 driftDir = normalize(vec3(
      cos(driftAngle) * (0.68 + fract(s * 2.9) * 0.52),
      0.10 + fract(s * 6.1) * 0.22,             // upward bias
      sin(driftAngle) * (0.30 + fract(s * 4.7) * 0.26)
    ));

    // Multi-frequency turbulence — organic micro-vortices and airflow
    // This is what prevents any visible linear or circular paths
    float tA = uTime * (0.022 + fract(s * 3.3) * 0.018);
    float tB = uTime * (0.015 + fract(s * 5.7) * 0.012);
    float tC = uTime * (0.009 + fract(s * 8.1) * 0.008);
    driftDir.x += sin(tA + s * 17.1) * 0.24 + cos(tB * 1.3 + s * 11.3) * 0.14;
    driftDir.y += cos(tA + s * 23.7) * 0.11 + sin(tB * 0.7 + s *  7.9) * 0.08;
    driftDir.z += sin(tA * 1.4 + s *  9.3) * 0.18 + cos(tC + s * 13.7) * 0.09;

    vec3 pos = birthPos + driftDir * (driftAge * maxTravel);

    // ── Opacity arc through lifecycle ─────────────────────────────────────
    // Fade in from invisible (birth at surface), peak brightness at ~35% life,
    // then gradually dissolve as particle disperses into the atmosphere.
    float lifeAlpha = smoothstep(0.0, 0.14, birthT) * smoothstep(1.0, 0.52, birthT);

    vColor = gold(fract(s * 3.71), 0.68 + fract(s * 5.3) * 0.52);
    vAlpha = lifeAlpha * (0.50 + fract(s * 8.3) * 0.48) * uOpacity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // Slightly larger at birth (fresh off surface), shrinks as it disperses
    float sizeScale = 1.0 + (1.0 - birthT) * 0.45;
    gl_PointSize = uSize * sizeScale * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function SaxEmission() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  // Emission particles need no fixed home position — birth pos computed from uSax + seed
  const geo = useMemo(() => makeGeo(48000, () => [0, 0, 0]), [])

  useParticleFrame(matRef, 0.060, () => {
    // Emission rises with the saxophone reveal — they are born together.
    // Phase 0-1: no emission (saxophone not yet visible)
    // Phase 2: emission scales with revealProgress
    // Phase 3: full emission
    const rp = homeState.revealProgress
    const phase = homeState.revealPhase
    if (phase < 2) return 0
    if (phase === 2) return Math.pow(rp, 0.7) * 0.95
    return 0.95
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_EMISSION} fragmentShader={FRAG}
        uniforms={useMemo(makeUniforms, [])} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// System 3 — Hero Sparkle  (10% of ecosystem)
// Slightly brighter flecks shed from highlight areas — the saxophone's brightest
// brass surfaces, curves that catch the studio light.
// They are more alive when the saxophone moves. More present during motion.
// Still not sparks. Not magical. Just finer, more luminous dust.
// ─────────────────────────────────────────────────────────────────────────────
const VERT_HERO = /* glsl */`
  uniform float uTime;
  uniform vec3  uSax;
  uniform float uOpacity;
  uniform float uSize;
  uniform float uSaxVel;   // smoothed saxophone velocity (per-second magnitude)

  attribute float aSeed;

  varying vec3  vColor;
  varying float vAlpha;

  const float PI  = 3.14159265;
  const float TAU = 6.28318530;

  void main() {
    float s = aSeed;

    // Hero particles have shorter lives — they are ephemeral highlights
    float lifeSpeed = 0.08 + fract(s * 5.3) * 0.10;   // 5-8 second lives
    float birthT    = fract(uTime * lifeSpeed + s);

    // Born at the saxophone's highlight zones — areas that catch the most light:
    // upper body curves, bell rim, neck bends
    float zoneRng = fract(s * 4.17);
    float heroY, heroR;
    if (zoneRng < 0.40) {
      // Mid-body catch points — catches studio key light most
      heroY = mix(-0.6, 1.0, fract(s * 7.1));
      heroR = 0.18 + fract(s * 3.1) * 0.24;
    } else if (zoneRng < 0.68) {
      // Bell rim — golden rim catches the most light
      heroY = mix(-2.1, -1.3, fract(s * 5.9));
      heroR = 0.42 + fract(s * 2.3) * 0.32;
    } else {
      // Upper neck and bow — the curve near the mouthpiece
      heroY = mix( 0.9,  2.0, fract(s * 9.3));
      heroR = 0.06 + fract(s * 4.7) * 0.14;
    }

    float birthTheta = fract(s * 13.1) * TAU;
    vec3 birthPos = uSax + vec3(
      cos(birthTheta) * heroR,
      heroY,
      sin(birthTheta) * heroR * 0.34
    );

    // Hero particles detach quickly, travel short distance
    // Sharp burst off surface, then immediate atmosphere integration
    float driftAge = 1.0 - pow(1.0 - birthT, 3.2);
    float travel   = 0.25 + fract(s * 6.7) * 1.0;   // short travel (0.25–1.25)

    // Direction: outward, with mild turbulence — no patterns
    float tA = uTime * (0.035 + fract(s * 3.7) * 0.025);
    float driftAngle = birthTheta + sin(tA + s * PI) * 0.40;
    vec3 driftDir = normalize(vec3(
      cos(driftAngle) * 0.75,
      0.12 + fract(s * 3.7) * 0.28,
      sin(driftAngle) * 0.28
    ));
    driftDir.x += sin(tA * 1.3 + s * 11.7) * 0.15;
    driftDir.z += cos(tA * 0.9 + s *  7.3) * 0.12;

    vec3 pos = birthPos + driftDir * (driftAge * travel);

    // Fast fade: bright at birth, quicker to dissolve
    float lifeAlpha = smoothstep(0.0, 0.08, birthT) * smoothstep(1.0, 0.38, birthT);

    // Motion multiplier: saxophone movement releases more shimmer
    // Not explosive — just "more alive"
    float motionBoost = 1.0 + clamp(uSaxVel * 4.5, 0.0, 1.8);

    // Slightly warmer / brighter than atmospheric (catching direct light)
    float t = fract(s * 3.7);
    vColor = mix(
      vec3(0.88, 0.72, 0.34),  // warm gold
      vec3(0.97, 0.90, 0.60),  // bright champagne
      t
    );

    vAlpha = lifeAlpha * motionBoost * (0.65 + fract(s * 5.1) * 0.35) * uOpacity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function HeroSparkle() {
  const matRef   = useRef<THREE.ShaderMaterial>(null)
  const smoothVel = useRef(0)
  const geo = useMemo(() => makeGeo(20000, () => [0, 0, 0]), [])

  const uniforms = useMemo(() => ({ ...makeUniforms(), uSaxVel: { value: 0 } }), [])

  useFrame(({ clock }) => {
    const mat = matRef.current
    if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uSax.value.set(saxLivePos.x, saxLivePos.y, saxLivePos.z)
    mat.uniforms.uCursor.value.set(homeState.pointerX, homeState.pointerY)
    mat.uniforms.uScroll.value  = homeState.scrollProgress
    mat.uniforms.uSize.value    = 0.065

    // Hero particles only appear after the reveal is complete —
    // they are the sign that the saxophone is fully alive.
    const phase = homeState.revealPhase
    const rp    = homeState.revealProgress
    const target = phase < 3
      ? (phase === 2 && rp > 0.80 ? (rp - 0.80) / 0.20 * 0.35 : 0)
      : 0.92
    mat.uniforms.uOpacity.value += (target - mat.uniforms.uOpacity.value) * 0.04

    // Smoothed velocity: saxophone movement increases hero emission presence
    const dx = saxLivePos.x - saxLivePos.prevX
    const dy = saxLivePos.y - saxLivePos.prevY
    const vel = Math.sqrt(dx * dx + dy * dy) * 60  // per-second
    smoothVel.current += (vel - smoothVel.current) * 0.10
    mat.uniforms.uSaxVel.value = smoothVel.current
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_HERO} fragmentShader={FRAG}
        uniforms={uniforms} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// System 4 — Infinite Falling Dust  (part of atmospheric 60%)
// Atmospheric particles slowly descending under gravity.
// Joins the ground accumulation. Infinite, invisible recycling.
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

    // S-curve horizontal drift (air resistance)
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
  const geo = useMemo(() => makeGeo(30000, () => [
    (Math.random() - 0.5) * 20,
    0,
    (Math.random() - 0.5) * 12 - 3,
  ]), [])

  useParticleFrame(matRef, 0.052, () => {
    const t = homeState.introT
    return Math.max(0, Math.min(1, (t - 0.5) / 3.0)) * 0.92
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_FALLING} fragmentShader={FRAG}
        uniforms={useMemo(makeUniforms, [])} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// System 5 — Background Cosmic Dust  (part of atmospheric 60%)
// The oldest settled particles — far behind everything.
// Provides infinite depth, makes the world feel boundless.
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
    float s = aSeed;

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
  const geo = useMemo(() => makeGeo(20000, () => [
    (Math.random() - 0.5) * 30,
    (Math.random() - 0.5) * 18,
    -10 - Math.random() * 14,
  ]), [])

  useParticleFrame(matRef, 0.22, () => {
    const t = homeState.introT
    return Math.max(0, Math.min(1, (t - 1.0) / 4.5)) * 0.78
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_BACKGROUND} fragmentShader={FRAG}
        uniforms={useMemo(makeUniforms, [])} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// System 6 — Ground Accumulation  (part of atmospheric 60%)
// Centuries of settled shimmer at the floor. Breathes, undulates.
// Appears progressively on deep scroll — the world has a memory.
// ─────────────────────────────────────────────────────────────────────────────
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

    // Gentle breathing — different per particle, very slow
    pos.y += sin(uTime * (0.24 + fract(s * 3.7) * 0.20) + s * 7.3) * 0.050;
    pos.y += cos(uTime * (0.16 + fract(s * 5.1) * 0.14) + s * 4.9) * 0.026;

    // Occasional rising wisp — rare, organic
    float risePhase = fract(uTime * 0.022 * fract(s * 4.3 + 0.1) + s);
    pos.y += pow(max(0.0, sin(risePhase * 3.14159)), 3.5) * 1.8;

    float scrollReveal = smoothstep(0.50, 0.85, uScroll);
    float shimmer = 0.68 + sin(uTime * (0.4 + fract(s * 2.9) * 0.7) + s * 30.0) * 0.32;

    vColor = gold(fract(s * 4.17), shimmer * 1.05);
    vAlpha = (0.38 + fract(s * 8.3) * 0.52) * scrollReveal * uOpacity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (1.1 + fract(s * 3.1) * 1.5) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function GroundPile() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const geo = useMemo(() => makeGeo(12000, () => {
    const layer = Math.floor(Math.random() * 4)
    return [
      (Math.random() - 0.5) * 24,
      -3.2 - layer * 0.18 - Math.random() * 0.20,
      (Math.random() - 0.5) * 12 - 2,
    ]
  }), [])

  useParticleFrame(matRef, 0.074, () => {
    const t = homeState.introT
    return Math.max(0, Math.min(1, (t - 1.0) / 4.0)) * 0.90
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_GROUND} fragmentShader={FRAG}
        uniforms={useMemo(makeUniforms, [])} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root — compose all systems in depth order
// ─────────────────────────────────────────────────────────────────────────────
export default function GoldDustEcosystem() {
  return (
    <>
      <BackgroundDust />    {/* deepest layer — ancient settled dust */}
      <AtmosphericDust />   {/* world atmosphere — denser near saxophone */}
      <FallingDust />       {/* descending particles joining the ground */}
      <GroundPile />        {/* accumulated centuries of shimmer */}
      <SaxEmission />       {/* continuous emission from saxophone surface */}
      <HeroSparkle />       {/* bright flecks from highlight surfaces */}
    </>
  )
}

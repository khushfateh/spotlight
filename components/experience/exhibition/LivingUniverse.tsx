'use client'

import { useRef, useMemo } from 'react'
import { useFrame }        from '@react-three/fiber'
import * as THREE          from 'three'
import { homeState, saxLivePos } from './homeState'

const TAU = Math.PI * 2

// ── Shared fragment shaders ───────────────────────────────────────────────────
const FRAG_DISK = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, exp(-d*d*10.0) * vAlpha);
  }
`

// ── Geometry helpers ──────────────────────────────────────────────────────────
function circleGeo(R: number, N = 256): THREE.BufferGeometry {
  const pos   = new Float32Array((N + 1) * 3)
  const phase = new Float32Array(N + 1)
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU
    pos[i*3] = Math.cos(a) * R;  pos[i*3+1] = Math.sin(a) * R;  pos[i*3+2] = 0
    phase[i] = (i / N) * TAU
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aPhase',   new THREE.BufferAttribute(phase, 1))
  return g
}

function arcGeo(R: number, a0: number, a1: number, N = 96): THREE.BufferGeometry {
  const pos   = new Float32Array(N * 3)
  const edge  = new Float32Array(N)
  const phase = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const a = a0 + (a1 - a0) * t
    pos[i*3] = Math.cos(a) * R;  pos[i*3+1] = Math.sin(a) * R;  pos[i*3+2] = 0
    edge[i]  = Math.sin(t * Math.PI)
    phase[i] = t * Math.PI
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aPhase',   new THREE.BufferAttribute(phase, 1))
  g.setAttribute('aEdge',    new THREE.BufferAttribute(edge, 1))
  return g
}

function radialGeo(spokes: number, r0: number, r1: number): THREE.BufferGeometry {
  const pos   = new Float32Array(spokes * 2 * 3)
  const phase = new Float32Array(spokes * 2)
  const edge  = new Float32Array(spokes * 2)
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * TAU
    const j = i * 6
    pos[j]   = Math.cos(a) * r0;  pos[j+1] = Math.sin(a) * r0;  pos[j+2] = 0
    pos[j+3] = Math.cos(a) * r1;  pos[j+4] = Math.sin(a) * r1;  pos[j+5] = 0
    phase[i*2]   = (i / spokes) * TAU * 3
    phase[i*2+1] = phase[i*2] + 0.5
    edge[i*2]    = 0.1
    edge[i*2+1]  = 0.6
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aPhase',   new THREE.BufferAttribute(phase, 1))
  g.setAttribute('aEdge',    new THREE.BufferAttribute(edge, 1))
  return g
}

// ── Sacred Geometry line shader ───────────────────────────────────────────────
const VERT_GEO = /* glsl */`
  attribute float aPhase;
  attribute float aEdge;
  uniform float   uTime;
  uniform float   uOpacity;
  varying float   vAlpha;
  varying vec3    vCol;
  void main() {
    float a    = aEdge == 0.0 ? 1.0 : aEdge;
    float breath = 0.50 + 0.50 * sin(uTime * 0.042 + aPhase);
    vAlpha = a * breath * uOpacity;
    vCol   = vec3(0.72, 0.54, 0.21);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const FRAG_GEO = /* glsl */`
  varying float vAlpha;
  varying vec3  vCol;
  void main() { gl_FragColor = vec4(vCol, vAlpha); }
`

interface GSpec {
  geo: THREE.BufferGeometry
  px: number; py: number; pz: number
  rx: number; ry: number; rz: number
  maxOp: number; delay: number
}

function GeoLine({ s }: { s: GSpec }) {
  const obj = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT_GEO, fragmentShader: FRAG_GEO,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const line = new THREE.Line(s.geo, mat)
    line.position.set(s.px, s.py, s.pz)
    line.rotation.set(s.rx, s.ry, s.rz)
    return { line, mat }
  }, [s])

  useFrame(({ clock }) => {
    const { mat } = obj
    mat.uniforms.uTime.value = clock.getElapsedTime()
    const phase = homeState.revealPhase
    const age   = phase < 3 ? -Infinity : homeState.introT - homeState.revealCompleteT - s.delay
    const tgt   = Math.max(0, Math.min(1, age / 12)) * s.maxOp
    const cur   = mat.uniforms.uOpacity.value
    mat.uniforms.uOpacity.value = cur + (tgt - cur) * 0.008
  })

  return <primitive object={obj.line} />
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layer 8 — Ancient Sacred Geometry
// ═══════════════════════════════════════════════════════════════════════════════
function AncientGeometry() {
  const specs = useMemo<GSpec[]>(() => [
    // Large background orbital rings
    { geo: circleGeo(12.0), px:0, py:0, pz:-16, rx:0,    ry:0,   rz:0,   maxOp:0.022, delay:10 },
    { geo: circleGeo(8.5),  px:0, py:0, pz:-12, rx:0,    ry:0,   rz:0,   maxOp:0.032, delay:7  },
    { geo: circleGeo(5.5),  px:0, py:0, pz:-9,  rx:0,    ry:0,   rz:0,   maxOp:0.040, delay:5  },
    // Tilted rings creating 3D layered space
    { geo: circleGeo(7.0),  px:0, py:0, pz:-10, rx:0.88, ry:0.2, rz:0.1, maxOp:0.028, delay:6  },
    { geo: circleGeo(9.8),  px:0, py:0, pz:-13, rx:0.42, ry:0.6, rz:0,   maxOp:0.020, delay:9  },
    { geo: circleGeo(4.2),  px:0, py:0, pz:-7,  rx:1.18, ry:0.3, rz:0.4, maxOp:0.036, delay:5  },
    // Phi-ratio inner circles (1 : 1.618 : 2.618)
    { geo: circleGeo(3.2),  px:0, py:0, pz:-6,  rx:0,    ry:0,   rz:0,   maxOp:0.046, delay:4  },
    { geo: circleGeo(1.98), px:0, py:0, pz:-5,  rx:0,    ry:0,   rz:0,   maxOp:0.052, delay:3  },
    // Blueprint arcs — partial circles with faded ends
    { geo: arcGeo(8.2, 0.18, Math.PI*0.72),   px:2, py:1,   pz:-11, rx:0.5, ry:0,   rz:0,   maxOp:0.026, delay:8  },
    { geo: arcGeo(4.0, Math.PI*0.28, Math.PI*1.45), px:-1,py:0.5,pz:-7, rx:0.3,ry:0.4,rz:0, maxOp:0.034, delay:7  },
    { geo: arcGeo(11.0, -0.3, Math.PI*0.85),  px:0, py:-0.5, pz:-15, rx:0.1, ry:0.1, rz:0.2, maxOp:0.016, delay:12 },
    { geo: arcGeo(2.8, Math.PI*0.6, Math.PI*1.9), px:1.5,py:-0.8,pz:-6, rx:0,  ry:0.5, rz:0.3, maxOp:0.038, delay:6 },
    // Radial construction lines
    { geo: radialGeo(12, 0.5, 3.4), px:0, py:0, pz:-7, rx:0, ry:0, rz:0, maxOp:0.018, delay:5  },
    { geo: radialGeo(8,  6.0, 9.5), px:0, py:0, pz:-13, rx:0.3, ry:0, rz:0, maxOp:0.012, delay:11 },
  ], [])

  return <>{specs.map((spec, i) => <GeoLine key={i} s={spec} />)}</>
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layer 7 — Musical Constellations
// ═══════════════════════════════════════════════════════════════════════════════

// Constellation data: pts are relative XY, lines are index pairs
const CONST_DATA = [
  // Staff — 5 rows of 6 dots connected horizontally
  {
    pts: Array.from({ length: 30 }, (_, i) => ({
      x: -2.5 + (i % 6) * 1.0,
      y: -1.0 + Math.floor(i / 6) * 0.55,
    })),
    lines: Array.from({ length: 25 }, (_, i) => {
      const row = Math.floor(i / 5), col = i % 5
      return [row * 6 + col, row * 6 + col + 1] as [number, number]
    }),
    cx: -3, cy: 2.5, cz: -21,
  },
  // Treble clef suggestion — a spiral of points
  {
    pts: Array.from({ length: 14 }, (_, i) => {
      const t = i / 13
      const a = t * Math.PI * 1.5
      return { x: Math.sin(a) * 0.9 + Math.cos(a * 2) * 0.3, y: t * 3.0 - 1.5 }
    }),
    lines: Array.from({ length: 13 }, (_, i) => [i, i + 1] as [number, number]),
    cx: 5, cy: -1, cz: -23,
  },
  // Waveform — sine curve of points
  {
    pts: Array.from({ length: 18 }, (_, i) => ({
      x: (i - 9) * 0.48,
      y: Math.sin(i * 0.62) * 0.75 + Math.sin(i * 1.3) * 0.32,
    })),
    lines: Array.from({ length: 17 }, (_, i) => [i, i + 1] as [number, number]),
    cx: -4, cy: -3.5, cz: -19,
  },
  // Note cluster — abstract scattered points
  {
    pts: [
      {x:0,y:0},{x:0.5,y:0.9},{x:-0.4,y:1.6},{x:0.8,y:2.2},
      {x:-0.7,y:2.7},{x:0.3,y:3.3},{x:-0.2,y:0.5},{x:0.6,y:1.3},
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[0,6],[6,7]] as [number,number][],
    cx: 4, cy: 2.5, cz: -20,
  },
]

const VERT_STAR = /* glsl */`
  attribute float aSeed;
  uniform float   uTime;
  uniform float   uOpacity;
  varying vec3    vColor;
  varying float   vAlpha;
  void main() {
    float twinkle = 0.50 + 0.50 * sin(uTime * (0.10 + aSeed * 0.28) + aSeed * 50.0);
    vAlpha = twinkle * uOpacity;
    vColor = mix(vec3(0.66,0.50,0.18), vec3(0.90,0.80,0.48), aSeed);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (1.4 + aSeed * 1.8) * (220.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function MusicalConstellations() {
  const objs = useMemo(() => CONST_DATA.map(c => {
    const N     = c.pts.length
    const ptPos = new Float32Array(N * 3)
    const seeds = new Float32Array(N)
    c.pts.forEach((p, i) => {
      ptPos[i*3] = p.x;  ptPos[i*3+1] = p.y;  ptPos[i*3+2] = 0
      seeds[i] = Math.random()
    })
    const ptGeo = new THREE.BufferGeometry()
    ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3))
    ptGeo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1))
    const ptMat = new THREE.ShaderMaterial({
      vertexShader: VERT_STAR, fragmentShader: FRAG_DISK,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const starPts = new THREE.Points(ptGeo, ptMat)
    starPts.position.set(c.cx, c.cy, c.cz)

    // Connection lines
    const lN  = c.lines.length
    const lPos = new Float32Array(lN * 2 * 3)
    c.lines.forEach(([a, b], i) => {
      lPos[i*6]   = c.pts[a].x;  lPos[i*6+1] = c.pts[a].y;  lPos[i*6+2] = 0
      lPos[i*6+3] = c.pts[b].x;  lPos[i*6+4] = c.pts[b].y;  lPos[i*6+5] = 0
    })
    const lGeo = new THREE.BufferGeometry()
    lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3))
    const lMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(0.42, 0.30, 0.10),
      transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const lineSegs = new THREE.LineSegments(lGeo, lMat)
    lineSegs.position.set(c.cx, c.cy, c.cz)

    return { starPts, ptMat, lineSegs, lMat }
  }), [])

  useFrame(({ clock }) => {
    const t     = clock.getElapsedTime()
    const phase = homeState.revealPhase
    const age   = phase < 3 ? -Infinity : homeState.introT - homeState.revealCompleteT - 10
    const tgt   = Math.max(0, Math.min(1, age / 15)) * 0.044

    objs.forEach(({ ptMat, lMat }) => {
      ptMat.uniforms.uTime.value    = t
      const cur = ptMat.uniforms.uOpacity.value
      ptMat.uniforms.uOpacity.value = cur + (tgt - cur) * 0.006
      lMat.opacity += (tgt * 0.38 - lMat.opacity) * 0.006
    })
  })

  return (
    <>
      {objs.map((o, i) => (
        <group key={i}>
          <primitive object={o.starPts} />
          <primitive object={o.lineSegs} />
        </group>
      ))}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layers 3 + 4 — Curl-noise Particle Streams
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_CURL = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uSax;
  attribute float aSeed;
  attribute vec3  aBirth;
  varying vec3  vColor;
  varying float vAlpha;

  // Value hash for 3D noise
  float h3(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f*f*(3.0 - 2.0*f);
    return mix(
      mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x),
          mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x),
          mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z);
  }

  // Approximate curl noise via cross-field
  vec3 curlFlow(vec3 p, float t) {
    float sc = 0.32;
    vec3 ofs = vec3(t * 0.016, t * 0.011, t * 0.019);
    vec3 ps  = p * sc + ofs;
    const float E = 0.20;
    // Finite differences of two noise fields → curl
    float a1 = noise3(ps + vec3(0,E,0)) - noise3(ps - vec3(0,E,0));
    float a2 = noise3(ps + vec3(0,0,E)) - noise3(ps - vec3(0,0,E));
    float a3 = noise3(ps + vec3(E,0,0)) - noise3(ps - vec3(E,0,0));
    vec3 b   = ps + vec3(3.7, 1.9, 5.3);
    float b1 = noise3(b + vec3(0,E,0)) - noise3(b - vec3(0,E,0));
    float b2 = noise3(b + vec3(0,0,E)) - noise3(b - vec3(0,0,E));
    float b3 = noise3(b + vec3(E,0,0)) - noise3(b - vec3(E,0,0));
    return normalize(vec3(a1 - b2, a2 - b3, a3 - b1)) * 0.88;
  }

  void main() {
    float s    = aSeed;
    float life = 0.020 + fract(s * 7.31) * 0.022;
    float age  = fract(uTime * life + s);

    // RK2 integration along curl field
    vec3 pos = aBirth;
    float travel = 1.8 + fract(s * 4.3) * 2.8;
    vec3 k1  = curlFlow(pos, uTime);
    vec3 k2  = curlFlow(pos + k1 * 0.5, uTime + 0.25);
    pos += mix(k1, k2, 0.5) * age * travel;

    // Upward thermal bias
    pos.y += age * (0.14 + fract(s * 3.7) * 0.22);

    // Gentle saxophone attraction (not orbit)
    vec3 toSax = uSax - pos;
    pos += normalize(toSax) * smoothstep(9.0, 1.2, length(toSax)) * age * 0.06;

    float lifeA  = smoothstep(0.0, 0.12, age) * smoothstep(1.0, 0.52, age);
    float bright = 0.52 + fract(s * 4.7) * 0.48;
    vColor = mix(vec3(0.74, 0.50, 0.17), vec3(0.90, 0.78, 0.46), fract(s * 3.1)) * bright;
    vAlpha = lifeA * (0.22 + fract(s * 9.3) * 0.28) * uOpacity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (0.038 + fract(s * 2.1) * 0.034) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function CurlStreams() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const N = 7000

  const { geo, uniforms } = useMemo(() => {
    const pos   = new Float32Array(N * 3)
    const seed  = new Float32Array(N)
    const birth = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const bx = (Math.random() - 0.5) * 16
      const by = (Math.random() - 0.5) * 10
      const bz = (Math.random() - 0.5) * 10 - 4
      birth[i*3] = bx;  birth[i*3+1] = by;  birth[i*3+2] = bz
      pos[i*3]   = bx;  pos[i*3+1]   = by;  pos[i*3+2]   = bz
      seed[i]    = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed',    new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aBirth',   new THREE.BufferAttribute(birth, 3))
    return {
      geo: g,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uSax: { value: new THREE.Vector3() } },
    }
  }, [])

  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uSax.value.set(saxLivePos.x, saxLivePos.y, saxLivePos.z)
    const phase = homeState.revealPhase
    const rp    = homeState.revealProgress
    const tgt   = phase < 2 ? 0 : phase === 2 ? rp * 0.45 : 0.68
    const cur   = mat.uniforms.uOpacity.value
    mat.uniforms.uOpacity.value = cur + (tgt - cur) * 0.022
  })

  return (
    <points geometry={geo}>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT_CURL} fragmentShader={FRAG_DISK}
        uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layers 5 + 6 — Volumetric Haze (saxophone bell light cone)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_HAZE = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uSax;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  const float TAU = 6.28318530;
  void main() {
    float s  = aSeed;
    float a  = fract(s * 17.3) * TAU;
    float rL = 0.030 + fract(s * 5.7) * 0.070;
    float age = fract(uTime * rL + s);

    // Cone below saxophone bell
    float depth = -(1.2 + fract(s * 9.1) * 2.8) * age;
    float r     = fract(s * 3.7) * 0.9 * (-depth / 4.0);
    float drift = sin(uTime * 0.11 + s * TAU) * 0.12 * age;

    vec3 pos = uSax + vec3(cos(a)*r + drift, depth + 0.3, sin(a)*r*0.5);

    float lifeA  = smoothstep(0.0,0.14,age) * smoothstep(1.0,0.40,age);
    float flicker = 0.68 + 0.32 * sin(uTime*(0.3 + fract(s*2.1)) + s*30.0);

    vColor = mix(vec3(0.82,0.60,0.26), vec3(0.62,0.44,0.16), age);
    vAlpha = lifeA * flicker * (0.10 + fract(s*7.1)*0.12) * uOpacity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (1.0 + age*2.2) * (1.0 + fract(s*3.1)*0.9) * (260.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function VolumetricHaze() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { geo, uniforms } = useMemo(() => {
    const N   = 3500
    const s   = new Float32Array(N)
    const pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) { s[i] = Math.random() }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed',    new THREE.BufferAttribute(s, 1))
    return { geo: g, uniforms: { uTime: { value:0 }, uOpacity: { value:0 }, uSax: { value: new THREE.Vector3() } } }
  }, [])

  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uSax.value.set(saxLivePos.x, saxLivePos.y, saxLivePos.z)
    const phase = homeState.revealPhase
    const rp    = homeState.revealProgress
    const tgt   = phase < 2 ? 0 : phase === 2 ? rp * 0.60 : 0.82
    const cur   = mat.uniforms.uOpacity.value
    mat.uniforms.uOpacity.value = cur + (tgt - cur) * 0.028
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef}
        vertexShader={VERT_HAZE} fragmentShader={FRAG_DISK}
        uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layer 9 — Brass Fragments (elongated metallic slivers)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_BRASS = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  attribute float aSeed;
  varying float vAlpha;
  varying vec3  vColor;
  varying float vAngle;
  const float TAU = 6.28318530;
  void main() {
    float s  = aSeed;
    float t1 = uTime * (0.005 + fract(s*4.3)*0.005);
    float t2 = uTime * (0.003 + fract(s*7.1)*0.004);
    vec3 pos = vec3(
      fract(s*3.17)*22.0 - 11.0 + sin(t1+s*17.3)*1.4 + cos(t2*1.3+s*11.1)*0.7,
      fract(s*7.83)*14.0 -  7.0 + cos(t1+s*23.7)*0.9 + sin(t2+s*7.9)*0.4,
      -3.0 - fract(s*5.41)*11.0 + sin(t2*0.7+s*9.3)*0.6
    );
    vAngle = uTime*(0.06+fract(s*2.7)*0.10) + s*TAU;
    float fl = 0.52 + 0.48*sin(uTime*(0.35+fract(s*3.1)*0.7)+s*40.0);
    vAlpha = (0.14+fract(s*6.3)*0.28)*fl*uOpacity;
    vColor = mix(vec3(0.52,0.38,0.14), vec3(0.86,0.70,0.36), fract(s*5.9));
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (2.2+fract(s*3.7)*5.5)*(240.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

const FRAG_BRASS = /* glsl */`
  varying float vAlpha;
  varying vec3  vColor;
  varying float vAngle;
  void main() {
    vec2  uv  = gl_PointCoord - 0.5;
    float c   = cos(vAngle), si = sin(vAngle);
    vec2  ruv = vec2(c*uv.x - si*uv.y, si*uv.x + c*uv.y);
    // 5:1 elongated sliver
    float d = sqrt(ruv.x*ruv.x*16.0 + ruv.y*ruv.y);
    if (d > 0.5) discard;
    float alpha = exp(-d*d*5.5) * vAlpha;
    // Metallic specular along long axis
    float spec = exp(-abs(ruv.x)*16.0) * (1.0 - abs(ruv.y)*1.8);
    spec = clamp(spec, 0.0, 1.0);
    gl_FragColor = vec4(mix(vColor, vec3(0.96,0.88,0.62), spec*0.65), alpha);
  }
`

function BrassFragments() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { geo, uniforms } = useMemo(() => {
    const N   = 420
    const s   = new Float32Array(N)
    const pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) s[i] = Math.random()
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed',    new THREE.BufferAttribute(s, 1))
    return { geo: g, uniforms: { uTime: { value:0 }, uOpacity: { value:0 } } }
  }, [])

  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    const phase = homeState.revealPhase
    const age   = phase < 3 ? -Infinity : homeState.introT - homeState.revealCompleteT - 1
    const tgt   = Math.max(0, Math.min(1, age / 5)) * 0.82
    const cur   = mat.uniforms.uOpacity.value
    mat.uniforms.uOpacity.value = cur + (tgt - cur) * 0.016
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef}
        vertexShader={VERT_BRASS} fragmentShader={FRAG_BRASS}
        uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layer 13 — Micro Glints (sparkle events)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_GLINT = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    float s      = aSeed;
    float period = 5.0 + fract(s*7.3)*16.0;
    float ph     = fract(uTime / period + s);
    float appear = ph < 0.04 ? ph/0.04
                 : ph < 0.11 ? 1.0
                 : ph < 0.24 ? 1.0 - (ph-0.11)/0.13
                 : 0.0;
    appear = pow(appear, 0.45);
    vec3 pos = vec3(
      fract(s*3.17)*18.0 - 9.0 + sin(uTime*0.018+s*6.3)*0.4,
      fract(s*7.83)*12.0 - 6.0 + cos(uTime*0.013+s*4.1)*0.3,
      -1.0 - fract(s*5.41)*9.0
    );
    vColor = mix(vec3(0.92,0.80,0.48), vec3(1.0,0.96,0.74), fract(s*9.1));
    vAlpha = appear * (0.52+fract(s*4.3)*0.48) * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = appear * (1.2+fract(s*2.7)*3.2) * (240.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

const FRAG_GLINT = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float disk  = exp(-dot(uv,uv) * 28.0);
    float crossH = exp(-abs(uv.y)*22.0) * exp(-abs(uv.x)*4.5);
    float crossV = exp(-abs(uv.x)*22.0) * exp(-abs(uv.y)*4.5);
    float a = clamp(disk + (crossH+crossV)*0.52, 0.0, 1.0) * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`

function MicroGlints() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { geo, uniforms } = useMemo(() => {
    const N   = 650
    const s   = new Float32Array(N)
    const pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) s[i] = Math.random()
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed',    new THREE.BufferAttribute(s, 1))
    return { geo: g, uniforms: { uTime: { value:0 }, uOpacity: { value:0 } } }
  }, [])

  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    const phase = homeState.revealPhase
    const age   = phase < 3 ? -Infinity : homeState.introT - homeState.revealCompleteT - 0.5
    const tgt   = Math.max(0, Math.min(1, age / 3)) * 0.88
    const cur   = mat.uniforms.uOpacity.value
    mat.uniforms.uOpacity.value = cur + (tgt - cur) * 0.022
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef}
        vertexShader={VERT_GLINT} fragmentShader={FRAG_GLINT}
        uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layer 12 — Hidden Instrument Silhouettes (barely visible point clouds)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_SILO = /* glsl */`
  attribute float aSeed;
  uniform float   uTime;
  uniform float   uOpacity;
  varying float   vAlpha;
  varying vec3    vColor;
  void main() {
    float fl   = 0.38 + 0.62 * sin(uTime*(0.05+aSeed*0.08) + aSeed*40.0);
    vAlpha = fl * uOpacity * (0.4 + aSeed * 0.6);
    vColor = mix(vec3(0.40,0.28,0.10), vec3(0.62,0.46,0.20), aSeed);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (0.8+aSeed*1.6)*(200.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

// Build point-cloud silhouettes of piano keys + violin body
function buildSilhouettePts(): [Float32Array, number] {
  const pts: number[] = []

  // Piano keys: vertical bars in a row
  for (let i = 0; i < 18; i++) {
    const x = i * 0.38 - 3.4
    const isBlack = [1,3,6,8,10,13,15].includes(i % 14)
    for (let j = 0; j < 8; j++) {
      pts.push(x, j * 0.15, 0)
      if (!isBlack && j < 5) pts.push(x + 0.18, j * 0.15, 0)
    }
  }

  // Violin body: two mirrored Bézier-like curves offset to the right
  for (let i = 0; i < 40; i++) {
    const t = i / 39
    const a = t * Math.PI
    const r = 0.55 + Math.sin(a * 2.2) * 0.22
    pts.push(Math.cos(a) * r + 6.5, Math.sin(a) * 1.8 - 0.9, 0)
    pts.push(-Math.cos(a) * r + 6.5, Math.sin(a) * 1.8 - 0.9, 0)
  }

  // Microphone: circle + stand
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    pts.push(-5.5 + Math.cos(a) * 0.6, 1.2 + Math.sin(a) * 0.6, 0)
  }
  for (let j = 0; j < 10; j++) pts.push(-5.5, j * (-0.22), 0)

  const arr = new Float32Array(pts)
  return [arr, pts.length / 3]
}

function InstrumentSilhouettes() {
  const obj = useMemo(() => {
    const [pts, N] = buildSilhouettePts()
    const seeds = new Float32Array(N)
    for (let i = 0; i < N; i++) seeds[i] = Math.random()
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
    geo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1))
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT_SILO, fragmentShader: FRAG_DISK,
      uniforms: { uTime: { value:0 }, uOpacity: { value:0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const pts3d = new THREE.Points(geo, mat)
    pts3d.position.set(-1.5, 0.8, -23)
    pts3d.rotation.y = 0.15
    return { pts3d, mat }
  }, [])

  useFrame(({ clock }) => {
    const { mat } = obj
    mat.uniforms.uTime.value = clock.getElapsedTime()
    const phase = homeState.revealPhase
    const age   = phase < 3 ? -Infinity : homeState.introT - homeState.revealCompleteT - 18
    const tgt   = Math.max(0, Math.min(1, age / 25)) * 0.024
    const cur   = mat.uniforms.uOpacity.value
    mat.uniforms.uOpacity.value = cur + (tgt - cur) * 0.004
  })

  return <primitive object={obj.pts3d} />
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layer 14 — Deep Void (atmospheric depth beyond the scene)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_VOID = /* glsl */`
  varying vec3 vPos;
  void main() {
    vPos = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const FRAG_VOID = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uTint;
  varying vec3  vPos;
  void main() {
    // Edge brightening: limb effect, like atmospheric haze at horizon
    float edge = 1.0 - abs(dot(vPos, vec3(0.0, 0.0, 1.0)));
    edge = pow(edge, 2.2);
    // Vertical warmth gradient: warmer near the saxophone zone (upper half)
    float warm = smoothstep(-0.4, 0.7, vPos.y) * 0.35;
    // Slow breathing
    float breath = 0.88 + 0.12 * sin(uTime * 0.038 + vPos.x * 2.0 + vPos.y * 1.5);
    float alpha  = (edge * 0.65 + warm * 0.35) * uOpacity * breath;
    gl_FragColor = vec4(uTint + vec3(warm*0.06, warm*0.03, 0.0), alpha);
  }
`

const VOID_LAYERS = [
  { r: 40, tint: new THREE.Vector3(0.055, 0.032, 0.012), maxOp: 0.22 },
  { r: 28, tint: new THREE.Vector3(0.048, 0.026, 0.008), maxOp: 0.16 },
  { r: 18, tint: new THREE.Vector3(0.040, 0.020, 0.006), maxOp: 0.11 },
]

function DeepVoid() {
  const layers = useMemo(() => VOID_LAYERS.map(({ r, tint, maxOp }) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT_VOID, fragmentShader: FRAG_VOID,
      uniforms: { uTime: { value:0 }, uOpacity: { value:0 }, uTint: { value: tint } },
      transparent: true, depthWrite: false, side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    })
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat)
    return { mesh, mat, maxOp }
  }), [])

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime()
    const tgt = Math.min(1, homeState.introT / 4)
    layers.forEach(({ mat, maxOp }) => {
      mat.uniforms.uTime.value    = t
      const cur = mat.uniforms.uOpacity.value
      mat.uniforms.uOpacity.value = cur + (tgt * maxOp - cur) * 0.012
    })
  })

  return <>{layers.map((l, i) => <primitive key={i} object={l.mesh} />)}</>
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layer 11 — Musical Symbols (floating treble clefs, faint, appearing in haze)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_SYMBOL = /* glsl */`
  attribute float aSeed;
  attribute float aGroup;
  uniform float   uTime;
  uniform float   uOpacity;
  varying vec3    vColor;
  varying float   vAlpha;
  void main() {
    float s    = aSeed;
    float g    = aGroup;
    // Each group has an independent slow drift and life cycle
    float life = 0.008 + fract(g*5.3)*0.012;
    float age  = fract(uTime*life + g);
    // Symbols fade in slowly, linger, then fade out
    float a = age < 0.15 ? age/0.15
            : age < 0.65 ? 1.0
            : (1.0-(age-0.65)/0.35);
    // Drift upward slowly
    float rise = age * (0.8 + fract(g*3.7)*0.6);
    vec3 pos = position;
    pos.y  += rise;
    pos.x  += sin(uTime*0.04 + g*6.28)*0.12;
    vColor  = mix(vec3(0.62,0.44,0.16), vec3(0.80,0.64,0.30), fract(s*4.3));
    vAlpha  = a * (0.5+fract(s*7.1)*0.5) * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (1.5+fract(s*2.9)*2.0)*(230.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function makeSymbolGeo(): THREE.BufferGeometry {
  const pts: number[] = []
  const groups: number[] = []

  // 6 groups of points, each group traces part of a musical symbol
  // Group 0-1: treble clef spirals at different positions
  for (let g = 0; g < 6; g++) {
    const gx = (Math.random() - 0.5) * 14
    const gy = (Math.random() - 0.5) * 8
    const gz = -5 - Math.random() * 8

    if (g < 2) {
      // Treble clef: spiral
      for (let i = 0; i < 18; i++) {
        const t = i / 17
        const a = t * Math.PI * 1.6
        const r = 0.3 + t * 0.25
        pts.push(gx + Math.sin(a) * r * 0.8, gy + t * 2.2 - 1.1 + Math.cos(a) * r * 0.5, gz)
        groups.push(g)
      }
    } else if (g < 4) {
      // Note head + stem
      for (let i = 0; i < 10; i++) {
        const a = (i / 9) * TAU
        pts.push(gx + Math.cos(a) * 0.28, gy + Math.sin(a) * 0.18, gz)
        groups.push(g)
      }
      for (let i = 0; i < 8; i++) {
        pts.push(gx + 0.28, gy + i * 0.25, gz)
        groups.push(g)
      }
    } else {
      // Staff fragment
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
          pts.push(gx + col * 0.35 - 1.4, gy + row * 0.35 - 0.7, gz)
          groups.push(g + col * 0.01)
        }
      }
    }
  }

  const N   = pts.length / 3
  const pos = new Float32Array(pts)
  const s   = new Float32Array(N)
  const grp = new Float32Array(groups)
  for (let i = 0; i < N; i++) s[i] = Math.random()

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSeed',    new THREE.BufferAttribute(s, 1))
  geo.setAttribute('aGroup',   new THREE.BufferAttribute(grp, 1))
  return geo
}

function MusicalSymbols() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { geo, uniforms } = useMemo(() => ({
    geo:      makeSymbolGeo(),
    uniforms: { uTime: { value:0 }, uOpacity: { value:0 } },
  }), [])

  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    const phase = homeState.revealPhase
    const age   = phase < 3 ? -Infinity : homeState.introT - homeState.revealCompleteT - 6
    const tgt   = Math.max(0, Math.min(1, age / 10)) * 0.055
    const cur   = mat.uniforms.uOpacity.value
    mat.uniforms.uOpacity.value = cur + (tgt - cur) * 0.008
  })

  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef}
        vertexShader={VERT_SYMBOL} fragmentShader={FRAG_DISK}
        uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Root export — all layers in depth order
// ═══════════════════════════════════════════════════════════════════════════════
export default function LivingUniverse() {
  return (
    <>
      <DeepVoid />               {/* atmospheric depth sphere — renders first */}
      <InstrumentSilhouettes />  {/* deep background, barely visible at z=-23 */}
      <MusicalConstellations />  {/* star clusters + constellation lines */}
      <AncientGeometry />        {/* sacred circles and construction lines */}
      <CurlStreams />             {/* curl-noise particle rivers */}
      <VolumetricHaze />         {/* saxophone bell light cone */}
      <BrassFragments />         {/* elongated metallic slivers */}
      <MusicalSymbols />         {/* floating treble clefs + notes */}
      <MicroGlints />            {/* random sparkle events */}
    </>
  )
}

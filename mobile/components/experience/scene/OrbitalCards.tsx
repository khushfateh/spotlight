/**
 * OrbitalCards — native port of web's OrbitalSystem (artist "discovery crystal"
 * cards orbiting the saxophone), adapted for a portrait phone:
 *
 *  • Tall elliptical "ferris-wheel" orbit around the sax (fits portrait width,
 *    top/bottom cards clear the instrument).
 *  • Graduated scale: the card at the front-right slot is the largest; every
 *    other card shrinks continuously with its distance round the orbit — a pure
 *    function of the (damped) orbit angle, so it never pops.
 *  • Hidden on the hero. Cards spiral out from the sax only once the user
 *    starts scrolling.
 *  • Tap → hit-test (raycast) → selected card glides to centre-front, others
 *    fade → onSelect(ticker) navigates to the artist profile.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber/native'
import * as THREE from 'three'
import { sceneState, PX_SCALE } from './sceneState'
import { CREATORS } from '@/lib/data/creators'

const TWO_PI = Math.PI * 2

// ── Orbit geometry (world units; sax is 5.3 tall, centred on the origin) ────
const RX = 1.78          // horizontal radius — front card keeps ~20pt margin on a 390pt screen
const RY = 3.1           // vertical radius — top/bottom cards clear the sax, orbit stays above the text
const RZ = 1.3           // depth: front-right comes toward camera, back-left recedes
const FOCUS_ANGLE = Math.PI / 2   // sin = 1 → x = +RX, z = +RZ  (front, centre-right)

// ── Card size ────────────────────────────────────────────────────────────────
const CW = 0.8, CH = 1.0, CR = 0.06      // full size (focus slot) — never covers the bell (render-tested)
const S_MIN = 0.36                       // furthest card
const SIZE_CURVE = 2.2                   // >1 → only the focus card is truly big

// ── Motion ───────────────────────────────────────────────────────────────────
const TURN_PER_PAGE = (Math.PI * 2 * 1.2) / 4   // web: 1.2 turns over the story
const ORBIT_DAMP = 5                              // web uses exp(-5·dt)
const REVEAL_START = 0.04                         // pages — "as soon as they scroll"
const REVEAL_LEN = 0.55

const ARTISTS = Object.entries(CREATORS).map(([ticker, c]) => ({ ticker, ...c }))
const N = ARTISTS.length
const BASE_ANGLES = ARTISTS.map((_, i) => FOCUS_ANGLE + (i / N) * TWO_PI)

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t) }
const easeOut3 = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)

/** 1 at the focus slot (front-right) → 0 directly opposite (back-left) */
function closeness(angle: number) {
  return 0.5 + 0.5 * Math.cos(angle - FOCUS_ANGLE)
}

// ── Shaders ──────────────────────────────────────────────────────────────────
const PORTRAIT_VERT = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
// Web's grade (desaturate, warm, S-curve, vignette) + rounded-corner mask and a
// gold placeholder while the photo downloads.
const PORTRAIT_FRAG = /* glsl */`
  uniform sampler2D uMap;
  uniform float uHasMap, uOpacity, uHover, uAspect;
  varying vec2 vUv;
  float roundedMask(vec2 uv, float r) {
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
    vec2 h = vec2(uAspect, 1.0) * 0.5 - r;
    vec2 q = abs(p) - h;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    return 1.0 - smoothstep(-0.006, 0.006, d);
  }
  void main(){
    vec4 tex = uHasMap > 0.5 ? texture2D(uMap, vUv)
                             : vec4(mix(vec3(0.16,0.11,0.05), vec3(0.42,0.31,0.13), vUv.y), 1.0);
    float lum = dot(tex.rgb, vec3(0.299,0.587,0.114));
    vec3 col = mix(tex.rgb, vec3(lum), 0.28) * vec3(1.055,0.970,0.875);
    col = mix(col, col*col*(3.0-2.0*col), 0.55);
    vec2 uv2 = vUv - 0.5;
    col *= clamp(pow(max(1.0-dot(uv2,uv2)*1.65,0.0),0.6),0.0,1.0);
    float lum2 = dot(col, vec3(0.299,0.587,0.114));
    col = mix(col, vec3(lum2), uHover*0.14);
    col = mix(col, col*col*(3.0-2.0*col), uHover*0.50);
    gl_FragColor = vec4(col, uOpacity * roundedMask(vUv, 0.07));
  }
`
// Momentum sparkline (web's MomentumGraph), animated entirely on the GPU
const GRAPH_VERT = /* glsl */`
  attribute float aU;
  uniform float uTime, uIndex, uOpacity, uPx;
  varying float vA;
  void main(){
    float amp = 0.030 + sin(uTime*0.38 + uIndex)*0.006;
    vec3 p = position;
    p.y += sin(aU*6.2832 + uTime*0.9 + uIndex*0.7)*amp + sin(aU*11.94 + uTime*1.4)*amp*0.42;
    vA = uOpacity;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uPx * 0.022 * (280.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const GRAPH_FRAG = /* glsl */`
  varying float vA;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(0.79, 0.66, 0.30, exp(-d*d*10.0) * vA);
  }
`

function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2, y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)
  return s
}

// Shared geometries (one set for all cards)
const SLAB_GEO  = new THREE.ShapeGeometry(roundedRectShape(CW, CH, CR), 6)
const EDGE_GEO  = new THREE.BufferGeometry().setFromPoints(roundedRectShape(CW + 0.012, CH + 0.012, CR + 0.006).getPoints(10))
const PW = CW * 0.865, PH = CH * 0.62
const PORTRAIT_GEO = new THREE.PlaneGeometry(PW, PH)
const GRAPH_GEO = (() => {
  const n = 28, p = new Float32Array(n * 3), u = new Float32Array(n)
  for (let i = 0; i < n; i++) { u[i] = i / (n - 1); p[i * 3] = (u[i] - 0.5) * CW * 0.70 }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(p, 3))
  g.setAttribute('aU', new THREE.BufferAttribute(u, 1))
  return g
})()

const CARD_RENDER_ORDER = 10   // after the sax + additive dust, so glass dims what's behind

// ── Selection transition (web: selected → detach → centre → navigate) ───────
const SEL = { lift: 140, fly: 520, navigateAt: 700 }
const CENTER_FRONT = new THREE.Vector3(0, 0.35, 5.2)

interface CardObj {
  group: THREE.Group
  slab: THREE.Mesh
  slabMat: THREE.MeshPhysicalMaterial
  edgeMat: THREE.LineBasicMaterial
  portraitMat: THREE.ShaderMaterial
  graphMat: THREE.ShaderMaterial
  scale: number
  reveal: number
}

interface Props {
  onSelect: (ticker: string) => void
  onFocusChange?: (index: number, strength: number, screen: { x: number; y: number }) => void
  /** bump to reset a finished selection (e.g. when returning to the tab) */
  resetKey: number
}

export default function OrbitalCards({ onSelect, onFocusChange, resetKey }: Props) {
  const orbitAngle = useRef(0)
  const sel = useRef<{ index: number; start: number; from: THREE.Vector3; navigated: boolean } | null>(null)
  const lastFocus = useRef({ i: -1, s: -1, x: -1, y: -1 })
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const tmpV = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  // Build every card once
  const cards = useMemo<CardObj[]>(() => ARTISTS.map((a, i) => {
    const group = new THREE.Group()
    group.visible = false

    const slabMat = new THREE.MeshPhysicalMaterial({
      color: '#2a2014', roughness: 0.16, metalness: 0.35,
      clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.4,
      transparent: true, opacity: 0, depthWrite: true,
    })
    const slab = new THREE.Mesh(SLAB_GEO, slabMat)
    slab.userData.cardIndex = i

    const edgeMat = new THREE.LineBasicMaterial({ color: '#D4A830', transparent: true, opacity: 0, depthWrite: true })
    const edge = new THREE.LineLoop(EDGE_GEO, edgeMat)
    edge.position.z = 0.004

    const portraitMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null }, uHasMap: { value: 0 }, uOpacity: { value: 0 },
        uHover: { value: 0 }, uAspect: { value: PW / PH },
      },
      vertexShader: PORTRAIT_VERT, fragmentShader: PORTRAIT_FRAG,
      transparent: true, depthWrite: true,
    })
    const portrait = new THREE.Mesh(PORTRAIT_GEO, portraitMat)
    portrait.position.set(0, CH * 0.04, 0.008)

    const graphMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uIndex: { value: i }, uOpacity: { value: 0 }, uPx: { value: Number(PX_SCALE) } },
      vertexShader: GRAPH_VERT, fragmentShader: GRAPH_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const graph = new THREE.Points(GRAPH_GEO, graphMat)
    graph.position.set(0, -CH * 0.355, 0.012)

    for (const o of [slab, edge, portrait, graph]) {
      o.renderOrder = CARD_RENDER_ORDER
      o.frustumCulled = false
      group.add(o)
    }
    return { group, slab, slabMat, edgeMat, portraitMat, graphMat, scale: S_MIN, reveal: 0 }
  }), [])

  // Load portraits (failures keep the gold placeholder — never crash the scene)
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    let alive = true
    const loaded: THREE.Texture[] = []
    ARTISTS.forEach((a, i) => {
      loader.load(a.imageUrl, (tex) => {
        if (!alive) { tex.dispose(); return }
        tex.colorSpace = THREE.SRGBColorSpace
        cards[i].portraitMat.uniforms.uMap.value = tex
        cards[i].portraitMat.uniforms.uHasMap.value = 1
        loaded.push(tex)
      }, undefined, (err) => console.warn('[OrbitalCards] portrait failed', a.ticker, err))
    })
    return () => { alive = false; loaded.forEach((t) => t.dispose()) }
  }, [cards])

  // Returning to Home after visiting a profile → cards back in orbit
  useEffect(() => { sel.current = null }, [resetKey])

  useFrame((state, dt) => {
    const now = state.clock.getElapsedTime() * 1000
    const cam = state.camera
    const pages = sceneState.pageProgress
    const alive = sceneState.revealPhase >= 3 ? 1 : 0

    // ── Orbit angle: damped toward scroll target ───────────────────────────
    if (!sel.current) {
      const target = -pages * TURN_PER_PAGE
      orbitAngle.current += (target - orbitAngle.current) * (1 - Math.exp(-ORBIT_DAMP * dt))
    }

    // ── Tap hit-test ───────────────────────────────────────────────────────
    const tap = sceneState.tap
    if (tap) {
      sceneState.tap = null
      if (!sel.current) {
        ndc.set((tap.x / state.size.width) * 2 - 1, -(tap.y / state.size.height) * 2 + 1)
        raycaster.setFromCamera(ndc, cam)
        const hittable = cards.filter((c) => c.group.visible && c.slabMat.opacity > 0.25).map((c) => c.slab)
        const hit = raycaster.intersectObjects(hittable, false)[0]
        if (hit) {
          const index = hit.object.userData.cardIndex as number
          sel.current = { index, start: now, from: cards[index].group.position.clone(), navigated: false }
        }
      }
    }

    let focusI = -1, focusC = 0
    const s = sel.current
    const selMs = s ? now - s.start : 0

    cards.forEach((card, i) => {
      const g = card.group
      const isSel = s?.index === i
      const isOther = !!s && !isSel

      // Per-card reveal: spiral out from the sax as soon as scrolling starts.
      // Front cards lead, back cards trail slightly (web's depth stagger).
      const angle0 = BASE_ANGLES[i] + orbitAngle.current
      const c0 = closeness(angle0)
      const stagger = (1 - c0) * 0.12
      const revealTarget = alive * smooth((pages - REVEAL_START - stagger) / REVEAL_LEN)
      card.reveal += (revealTarget - card.reveal) * (1 - Math.exp(-7 * dt))
      const r = card.reveal
      const spiral = easeOut3(r)

      // Spiral-in: angle lags and radius grows while revealing
      const angle = angle0 - (1 - spiral) * 1.6
      const c = closeness(angle)
      const radius = 0.35 + 0.65 * spiral

      g.visible = r > 0.002 || isSel
      if (!g.visible) return

      // ── Position ─────────────────────────────────────────────────────────
      if (!isSel) {
        // ellipse: x = RX·sin(a), y = RY·cos(a), z = RZ·sin(a)  (same param as web)
        g.position.set(RX * radius * Math.sin(angle), RY * radius * Math.cos(angle), RZ * radius * Math.sin(angle))
        if (isOther) g.position.z -= Math.min(2.0, selMs / 400)
      } else {
        const fly = easeOut3((selMs - SEL.lift) / SEL.fly)
        g.position.lerpVectors(s!.from, CENTER_FRONT, fly)
      }
      g.quaternion.copy(cam.quaternion)

      // ── Graduated scale (pure function of orbit angle → perfectly smooth) ─
      const targetScale = isSel
        ? 1.0 + 0.45 * easeOut3((selMs - SEL.lift) / SEL.fly)
        : (S_MIN + (1 - S_MIN) * Math.pow(c, SIZE_CURVE)) * (0.55 + 0.45 * spiral)
      card.scale += (targetScale - card.scale) * (1 - Math.exp(-10 * dt))
      g.scale.setScalar(Math.max(0.001, card.scale))

      // ── Materials ────────────────────────────────────────────────────────
      const depthFade = 0.22 + 0.78 * Math.pow(c, 1.3)
      const otherFade = isOther ? Math.max(0, 1 - selMs / 450) : 1
      const op = isSel ? 1 : r * depthFade * otherFade
      card.slabMat.opacity = op * 0.62
      card.edgeMat.opacity = op * (0.18 + 0.5 * Math.pow(c, 3))
      card.portraitMat.uniforms.uOpacity.value = op * 0.95
      card.portraitMat.uniforms.uHover.value = isSel ? Math.min(0.6, selMs / 600) : Math.pow(c, 6) * 0.35
      card.graphMat.uniforms.uOpacity.value = op * (0.12 + 0.4 * Math.pow(c, 4))
      card.graphMat.uniforms.uTime.value = now / 1000

      if (!s && r > 0.5 && c > focusC) { focusC = c; focusI = i }
    })

    // ── Navigate once the selected card has arrived ────────────────────────
    if (s && !s.navigated && selMs >= SEL.navigateAt) {
      s.navigated = true
      onSelect(ARTISTS[s.index].ticker)
    }

    // ── Focus label (name under the front-right card), published sparingly ─
    if (onFocusChange) {
      const strength = focusI < 0 ? 0 : clamp01((focusC - 0.82) / 0.18) * cards[focusI].reveal
      tmpV.set(RX, -CH * 0.5 - 0.06, RZ).project(cam)
      const sx = (tmpV.x * 0.5 + 0.5) * state.size.width
      const sy = (-tmpV.y * 0.5 + 0.5) * state.size.height
      const L = lastFocus.current
      if (focusI !== L.i || Math.abs(strength - L.s) > 0.02 || Math.abs(sx - L.x) > 0.5 || Math.abs(sy - L.y) > 0.5) {
        lastFocus.current = { i: focusI, s: strength, x: sx, y: sy }
        onFocusChange(focusI, strength, { x: sx, y: sy })
      }
    }
  })

  return (
    <>
      <OrbitPath />
      {cards.map((c, i) => <primitive key={i} object={c.group} />)}
    </>
  )
}

/** Faint elliptical orbit line (web OrbitPath) — appears with the cards */
function OrbitPath() {
  const { line, mat } = useMemo(() => {
    const n = 256, pts = new Float32Array((n + 1) * 3)
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TWO_PI
      pts[i * 3] = RX * Math.sin(a); pts[i * 3 + 1] = RY * Math.cos(a); pts[i * 3 + 2] = RZ * Math.sin(a)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
    const m = new THREE.LineBasicMaterial({ color: '#C9A84C', transparent: true, opacity: 0, depthWrite: false })
    const l = new THREE.Line(geo, m)
    l.frustumCulled = false
    return { line: l, mat: m }
  }, [])
  useFrame(() => {
    const reveal = sceneState.revealPhase >= 3 ? smooth((sceneState.pageProgress - REVEAL_START) / REVEAL_LEN) : 0
    mat.opacity += (reveal * 0.07 - mat.opacity) * 0.08
  })
  return <primitive object={line} />
}

export { ARTISTS as ORBIT_ARTISTS }

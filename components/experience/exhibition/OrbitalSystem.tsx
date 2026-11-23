'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { Html, useTexture, RoundedBox } from '@react-three/drei'
import { homeState } from './homeState'
import { creators } from '@/lib/mock-data/creators'

// ── Orbit constants ────────────────────────────────────────────────────────────
const TOTAL       = 12
const ORBIT_R     = 3.2
const ORBIT_DEPTH = 1.5
const HOVER_Z     = 0.18
const TWO_PI      = Math.PI * 2

const ARTISTS     = Array.from({ length: TOTAL }, (_, i) => creators[i % creators.length])
const BASE_ANGLES = ARTISTS.map((_, i) => (i / TOTAL) * TWO_PI)

const CW = 1.72
const CH = 2.15
const CD = 0.13
const CR = 0.076

// ── Pre-allocated — never created inside useFrame ─────────────────────────────
const _fwd   = new THREE.Vector3()
const _tiltQ = new THREE.Quaternion()
const _euler  = new THREE.Euler()
const _projV  = new THREE.Vector3()
const _orbitPos = new THREE.Vector3()

// ── Viewport-adaptive radius ──────────────────────────────────────────────────
let _adaptiveR = ORBIT_R

// ── Helpers ───────────────────────────────────────────────────────────────────
const easeInOut3  = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
const easeOut3    = (t: number) => 1 - Math.pow(1-t,3)

// ── Depth factor ──────────────────────────────────────────────────────────────
function getDepthFactor(a: number): number {
  return Math.max(0, Math.sin(((a%TWO_PI)+TWO_PI)%TWO_PI))
}

// ── Transition state machine ──────────────────────────────────────────────────
type TxState = 'idle' | 'selected' | 'detaching' | 'centering' | 'navigating'

const TX_MS      = { selected: 220, detach: 550, center: 380, navigate: 400 }
const T_DETACH   = TX_MS.selected
const T_CENTER   = T_DETACH   + TX_MS.detach
const T_NAVIGATE = T_CENTER   + TX_MS.center
const T_ROUTE    = T_NAVIGATE + TX_MS.navigate

const INTERMEDIATE = new THREE.Vector3(0, 0, 1.4)
const FINAL_CENTER = new THREE.Vector3(0, 0, 2.2)

const tx = {
  state:     'idle' as TxState,
  card:      -1,
  ticker:    '',
  clickMs:   0,
  navigated: false,
  origin:    new THREE.Vector3(),
  pos:       new THREE.Vector3(),
  vel:       new THREE.Vector3(),
  seeded:    false,
}

function spring3(p: THREE.Vector3, v: THREE.Vector3, tgt: THREE.Vector3, k: number, d: number, dt: number) {
  v.x += (-k*(p.x-tgt.x) - d*v.x)*dt;  p.x += v.x*dt
  v.y += (-k*(p.y-tgt.y) - d*v.y)*dt;  p.y += v.y*dt
  v.z += (-k*(p.z-tgt.z) - d*v.z)*dt;  p.z += v.z*dt
}

// ── Web Audio ─────────────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!_audioCtx)
      _audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    return _audioCtx
  } catch { return null }
}
function playTone(freqs: number[], dur: number, vol: number) {
  const ctx = getAudioCtx(); if (!ctx) return
  freqs.forEach((f,i) => {
    const osc=ctx.createOscillator(), g=ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type='sine'; osc.frequency.setValueAtTime(f, ctx.currentTime)
    g.gain.setValueAtTime(vol/(i+1), ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur)
    osc.start(); osc.stop(ctx.currentTime+dur)
  })
}

// ── Portrait shader ───────────────────────────────────────────────────────────
const PORTRAIT_VERT = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
`
const PORTRAIT_FRAG = /* glsl */`
  uniform sampler2D uMap; uniform float uOpacity, uHover; varying vec2 vUv;
  void main(){
    vec4 tex = texture2D(uMap, vUv);
    float lum = dot(tex.rgb, vec3(0.299,0.587,0.114));
    vec3 col = mix(tex.rgb, vec3(lum), 0.28) * vec3(1.055,0.970,0.875);
    col = mix(col, col*col*(3.0-2.0*col), 0.55);
    vec2 uv2 = vUv - 0.5;
    col *= clamp(pow(max(1.0-dot(uv2,uv2)*1.65,0.0),0.6),0.0,1.0);
    float lum2 = dot(col, vec3(0.299,0.587,0.114));
    col = mix(col, vec3(lum2), uHover*0.14);
    col = mix(col, col*col*(3.0-2.0*col), uHover*0.50);
    gl_FragColor = vec4(col, tex.a*uOpacity);
  }
`

const EDGE_WARM = new THREE.Color('#7A5000')
const EDGE_COOL = new THREE.Color('#8899AA')

// ── Momentum graph ────────────────────────────────────────────────────────────
function MomentumGraph({ index, hoverRef }: { index: number; hoverRef: React.MutableRefObject<number> }) {
  const ref    = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)
  const N = 28
  const geo = useMemo(() => {
    const g=new THREE.BufferGeometry(), p=new Float32Array(N*3)
    for(let i=0;i<N;i++) p[i*3]=(i/(N-1)-0.5)*(CW*0.70)
    g.setAttribute('position',new THREE.BufferAttribute(p,3)); return g
  },[])

  useFrame(s=>{
    if(!ref.current||!matRef.current) return
    const h = hoverRef.current
    const t = s.clock.getElapsedTime()
    const amp = 0.030 + h*0.042 + Math.sin(t*0.38+index)*0.006
    const p = ref.current.geometry.attributes.position.array as Float32Array
    for(let i=0;i<N;i++){
      const u=i/(N-1)
      p[i*3+1] = Math.sin(u*Math.PI*2+t*0.9+index*0.7)*amp
              + Math.sin(u*Math.PI*3.8+t*1.4)*amp*0.42
    }
    ref.current.geometry.attributes.position.needsUpdate=true
    matRef.current.size    = 0.011 + h*0.012
    matRef.current.opacity = 0.10  + h*0.36
  })

  return (
    <points ref={ref} geometry={geo} position={[0,-CH*0.285,CD*0.42]}>
      <pointsMaterial ref={matRef} color="#C9A84C" size={0.011} transparent opacity={0.10}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending}/>
    </points>
  )
}

// ── Elliptical orbit path ─────────────────────────────────────────────────────
function OrbitPath() {
  const matRef = useRef<THREE.LineBasicMaterial | null>(null)
  const obj    = useMemo(()=>{
    const N=256, pts=new Float32Array((N+1)*3)
    for(let i=0;i<=N;i++){
      const a=(i/N)*TWO_PI, j=i*3
      pts[j]   = ORBIT_R    *Math.sin(a)
      pts[j+1] = ORBIT_R    *Math.cos(a)
      pts[j+2] = ORBIT_DEPTH*Math.sin(a)
    }
    const geo=new THREE.BufferGeometry()
    geo.setAttribute('position',new THREE.BufferAttribute(pts,3))
    const mat=new THREE.LineBasicMaterial({color:'#C9A84C',transparent:true,opacity:0,depthWrite:false})
    matRef.current=mat
    return new THREE.Line(geo,mat)
  },[])
  useFrame(()=>{
    if(!matRef.current) return
    const reveal = Math.max(0,Math.min(1,(homeState.scrollProgress-0.14)/0.10))
    const txFade = tx.state!=='idle' ? Math.max(0,1-(Date.now()-tx.clickMs)/350) : 1
    matRef.current.opacity = reveal * 0.050 * txFade
  })
  return <primitive object={obj}/>
}

// ── Discovery Crystal card ─────────────────────────────────────────────────────
interface CardProps { artist: typeof ARTISTS[0]; index: number }

function ArtistCard({ artist, index }: CardProps) {
  const groupRef   = useRef<THREE.Group>(null)
  const crystalRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const edgeRef    = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered,  setHovered] = useState(false)

  const hoverT   = useRef(0)
  const scaleRef = useRef(0.42)
  const router   = useRouter()

  const texture = useTexture(artist.imageUrl||'/placeholder.jpg')
  useEffect(()=>{ if(texture) texture.colorSpace=THREE.SRGBColorSpace },[texture])

  const portraitMat = useMemo(()=>new THREE.ShaderMaterial({
    uniforms:{uMap:{value:null},uOpacity:{value:0},uHover:{value:0}},
    vertexShader:PORTRAIT_VERT, fragmentShader:PORTRAIT_FRAG,
    transparent:true, depthWrite:false,
  }),[])
  useEffect(()=>{ if(texture) portraitMat.uniforms.uMap.value=texture },[texture,portraitMat])

  useFrame((state,dt)=>{
    if(!groupRef.current) return

    const angle   = BASE_ANGLES[index] + homeState.orbitAngle
    const isTx    = tx.state!=='idle' && tx.card===index
    const isOther = tx.state!=='idle' && tx.card!==index
    const msSince = isTx ? Date.now()-tx.clickMs : 0
    const df      = getDepthFactor(angle)

    // ── Orbit position ──────────────────────────────────────────────────────
    _orbitPos.set(
      _adaptiveR  * Math.sin(angle),
      _adaptiveR  * Math.cos(angle),
      ORBIT_DEPTH * Math.sin(angle),
    )

    if (isTx && !tx.seeded) {
      tx.origin.copy(groupRef.current.position)
      tx.pos.copy(tx.origin)
      tx.vel.set(0,0,0)
      tx.seeded=true
    }

    // Resolve click transition state from elapsed time
    if (isTx) {
      if      (msSince < T_DETACH)   tx.state='selected'
      else if (msSince < T_CENTER)   tx.state='detaching'
      else if (msSince < T_NAVIGATE) tx.state='centering'
      else                           tx.state='navigating'
    }

    // ════════════════════════════════════════════════════════════════════════
    // POSITION
    // ════════════════════════════════════════════════════════════════════════

    if (!isTx) {
      const driftZ = isOther
        ? -Math.min(2.0,(Date.now()-tx.clickMs)/400)
        : 0

      groupRef.current.position.set(
        _orbitPos.x,
        _orbitPos.y,
        _orbitPos.z + driftZ,
      )

    } else if (tx.state==='selected') {
      groupRef.current.position.copy(tx.origin)

    } else if (tx.state==='detaching') {
      const dp = easeInOut3(Math.min(1,(msSince-T_DETACH)/TX_MS.detach))
      groupRef.current.position.lerpVectors(tx.origin, INTERMEDIATE, dp)
      const tiltT = Math.sin(dp*Math.PI)
      _euler.set(-tiltT*0.06, tiltT*0.24, 0)
      _tiltQ.setFromEuler(_euler)
      groupRef.current.quaternion.copy(state.camera.quaternion)
      groupRef.current.quaternion.multiply(_tiltQ)
      tx.pos.copy(groupRef.current.position); tx.vel.set(0,0,0)

    } else if (tx.state==='centering') {
      spring3(tx.pos, tx.vel, FINAL_CENTER, 48, 20, dt)
      groupRef.current.position.copy(tx.pos)
      groupRef.current.quaternion.copy(state.camera.quaternion)

    } else if (tx.state==='navigating') {
      const np = Math.min(1,(msSince-T_NAVIGATE)/TX_MS.navigate)
      const gp = easeOut3(np)
      groupRef.current.position.copy(FINAL_CENTER)
      state.camera.getWorldDirection(_fwd)
      groupRef.current.position.addScaledVector(_fwd.negate(), gp*0.8)
      groupRef.current.quaternion.copy(state.camera.quaternion)
      const fillMult = Math.min(state.viewport.width/CW, state.viewport.height/CH)*0.94
      groupRef.current.scale.setScalar(1.0+gp*(fillMult-1.0))
      if (np>=1.0 && !tx.navigated) { tx.navigated=true; router.push(`/creator/${tx.ticker}`) }
    }

    // ── Scale ─────────────────────────────────────────────────────────────
    if (!isTx || tx.state==='selected' || tx.state==='detaching' || tx.state==='centering') {
      if (!isTx) {
        const targetScale = isOther ? scaleRef.current*0.992 : 0.42+0.58*Math.pow(df,3)
        scaleRef.current += (targetScale-scaleRef.current)*(1-Math.exp(-8*dt))
        groupRef.current.scale.setScalar(Math.max(0.01,scaleRef.current))
      } else {
        scaleRef.current=1.0
        groupRef.current.scale.setScalar(1.0)
      }
    }

    // ── Face camera ──────────────────────────────────────────────────────
    if (!isTx || tx.state==='selected' || tx.state==='centering' || tx.state==='navigating') {
      groupRef.current.quaternion.copy(state.camera.quaternion)
    }

    // ════════════════════════════════════════════════════════════════════════
    // HOVER — idle only, no scaling
    // ════════════════════════════════════════════════════════════════════════
    const hoverTarget = tx.state==='idle' && hovered ? 1 : 0
    hoverT.current += (hoverTarget - hoverT.current)*(1-Math.exp(-4.5*dt))
    const h = tx.state==='idle' ? hoverT.current : 0

    if (tx.state==='idle' && h > 0.001) {
      _projV.copy(groupRef.current.position)
      _projV.project(state.camera)

      const ex = Math.max(0, (0.88 - Math.abs(_projV.x)) / 0.32)
      const ey = Math.max(0, (0.88 - Math.abs(_projV.y)) / 0.32)
      const edgeSafe = Math.min(1, Math.min(ex, ey))

      state.camera.getWorldDirection(_fwd)
      _fwd.negate().multiplyScalar(h * HOVER_Z * edgeSafe)
      groupRef.current.position.add(_fwd)

      const tdx = homeState.pointerX - _projV.x
      const tdy = homeState.pointerY - _projV.y
      const TILT = 0.055
      _euler.set(-tdy*TILT*h, tdx*TILT*h, 0)
      _tiltQ.setFromEuler(_euler)
      groupRef.current.quaternion.multiply(_tiltQ)
    }

    // ════════════════════════════════════════════════════════════════════════
    // MATERIALS
    // ════════════════════════════════════════════════════════════════════════
    const phaseGate     = homeState.revealPhase>=3
      ? Math.min(1,(homeState.introT-homeState.revealCompleteT)/1.0) : 0
    const scrollOffset  = (1-df)*0.08
    const scrollReveal  = Math.max(0,Math.min(1,(homeState.scrollProgress-0.14-scrollOffset)/0.10))
    const edgeFade      = 0.18 + 0.82 * df
    const otherFade     = isOther ? Math.max(0,1-(Date.now()-tx.clickMs)/500) : 1
    const baseOp        = phaseGate * scrollReveal * edgeFade * otherFade

    const ceremonyT     = isTx ? Math.min(1,msSince/600) : 0
    const envBoost      = isTx ? easeOut3(ceremonyT)*9.0 : 0

    if (crystalRef.current) {
      const tgt = isTx ? Math.max(baseOp,easeOut3(Math.min(1,msSince/300))*0.95) : baseOp*(0.70+h*0.14)
      crystalRef.current.opacity         += (tgt-crystalRef.current.opacity)*(1-Math.exp(-6*dt))
      const edgeBoostH = isTx ? 0 : (1-Math.min(1,edgeX(h))) * h * 1.5
      crystalRef.current.envMapIntensity  = 2.0 + h*0.5 + envBoost + edgeBoostH
      crystalRef.current.clearcoat        = 0.82 + h*0.18 + (isTx?Math.min(0.18,ceremonyT*0.22):0)
      crystalRef.current.transmission     = 0.82 + h*0.14
    }
    if (edgeRef.current) {
      const tgt = isTx ? Math.max(baseOp*0.5,easeOut3(Math.min(1,msSince/250))*0.88) : baseOp*(0.09+h*0.36)
      edgeRef.current.opacity            += (tgt-edgeRef.current.opacity)*(1-Math.exp(-6*dt))
      edgeRef.current.emissiveIntensity   = 0.22 + h*0.65 + envBoost*0.55
      edgeRef.current.emissive.lerpColors(EDGE_WARM, EDGE_COOL, h)
    }
    const pTgt = isTx ? Math.max(baseOp*0.90,easeOut3(Math.min(1,msSince/400))*0.93) : baseOp*0.90
    portraitMat.uniforms.uOpacity.value += (pTgt-portraitMat.uniforms.uOpacity.value)*(1-Math.exp(-6*dt))
    portraitMat.uniforms.uHover.value    = h+(isTx?Math.min(0.6,ceremonyT):0)
  })

  function edgeX(h: number): number {
    if (h < 0.001) return 1
    return Math.max(0, (0.88 - Math.abs(_projV.x)) / 0.32)
  }

  const startTransition = () => {
    if (tx.state!=='idle') return
    tx.state='selected'; tx.card=index; tx.ticker=artist.ticker
    tx.clickMs=Date.now(); tx.navigated=false; tx.seeded=false
    tx.vel.set(0,0,0)
    playTone([330,440,550,660,880],1.10,0.042)
    setHovered(false); homeState.hoveredCard=-1
    document.body.style.cursor=''
  }

  return (
    <group
      ref={groupRef}
      onPointerEnter={e=>{
        e.stopPropagation()
        if(tx.state!=='idle') return
        setHovered(true); homeState.hoveredCard=index
        document.body.style.cursor='pointer'
        playTone([1320,2200,3300],.20,.028)
      }}
      onPointerLeave={()=>{
        setHovered(false)
        if(homeState.hoveredCard===index) homeState.hoveredCard=-1
        if(tx.state==='idle') document.body.style.cursor=''
      }}
      onClick={e=>{ e.stopPropagation(); startTransition() }}
    >
      {/* ── Crystal slab ─────────────────────────────────────────────────── */}
      <RoundedBox args={[CW,CH,CD]} radius={CR} smoothness={6}>
        <meshPhysicalMaterial ref={crystalRef} color="#C2A882"
          transmission={0.82} thickness={0.16} roughness={0.04} metalness={0}
          ior={1.50} clearcoat={0.85} clearcoatRoughness={0.04}
          envMapIntensity={2.0} transparent opacity={0} depthWrite={false}/>
      </RoundedBox>

      {/* ── Edge bevel ───────────────────────────────────────────────────── */}
      <RoundedBox args={[CW+0.016,CH+0.016,CD-0.006]} radius={CR+0.008} smoothness={6}>
        <meshStandardMaterial ref={edgeRef} color="#D4A830" metalness={0.88} roughness={0.10}
          emissive="#7A5000" emissiveIntensity={0.22}
          transparent opacity={0} depthWrite={false} side={THREE.BackSide}/>
      </RoundedBox>

      {/* ── Portrait ─────────────────────────────────────────────────────── */}
      <mesh position={[0,0.085,-CD*0.20]} material={portraitMat}>
        <planeGeometry args={[CW*0.865,CH*0.620]}/>
      </mesh>

      {/* ── Momentum graph ───────────────────────────────────────────────── */}
      <MomentumGraph index={index} hoverRef={hoverT}/>

      {/* ── Artist name ─────────────────────────────────────────────────── */}
      <Html position={[0,-CH*0.376,CD*0.52]} center
        style={{pointerEvents:'none',userSelect:'none',whiteSpace:'nowrap'}} zIndexRange={[0,0]}>
        <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:'13px',fontWeight:300,
          letterSpacing:'0.06em',color:hovered?'rgba(255,255,255,0.96)':'rgba(255,255,255,0.80)',
          textShadow:'0 1px 16px rgba(0,0,0,0.95)',transition:'color .55s ease',textAlign:'center'}}>
          {artist.name}
        </div>
      </Html>
    </group>
  )
}

// ── OrbitalSystem ─────────────────────────────────────────────────────────────
export default function OrbitalSystem() {
  const overlayRef = useRef<HTMLDivElement|null>(null)

  useEffect(()=>{
    tx.state='idle'; tx.card=-1; tx.ticker=''; tx.seeded=false
    tx.navigated=false; tx.clickMs=0; tx.vel.set(0,0,0)

    const el=document.createElement('div')
    el.style.cssText='position:fixed;inset:0;z-index:999;pointer-events:none;will-change:backdrop-filter,background;'
    document.body.appendChild(el)
    overlayRef.current=el
    return ()=>{ el.remove(); overlayRef.current=null }
  },[])

  useFrame((state,dt)=>{
    // ── Orbit rotation ────────────────────────────────────────────────────
    if (tx.state==='idle') {
      homeState.orbitAngle +=
        (homeState.orbitAngleTarget - homeState.orbitAngle) * (1 - Math.exp(-5*dt))
    }

    // ── Viewport-adaptive radius ──────────────────────────────────────────
    const safeHalf = state.viewport.width/2 - CW*0.54
    _adaptiveR = Math.min(ORBIT_R, Math.max(1.5, safeHalf))

    // ── DOM overlay (ceremony blur + void) ────────────────────────────────
    const el = overlayRef.current
    if (el) {
      const ms = tx.state!=='idle' ? Date.now()-tx.clickMs : 0
      if (ms>0) {
        const blurP = Math.min(1,Math.max(0,(ms-T_DETACH)/(T_CENTER-T_DETACH)))
        const darkP = Math.min(1,Math.max(0,(ms-T_NAVIGATE)/TX_MS.navigate))
        el.style.backdropFilter = blurP>0.01 ? `blur(${(blurP*12).toFixed(1)}px)` : ''
        el.style.background     = darkP>0.01 ? `rgba(5,5,8,${(darkP*0.97).toFixed(3)})` : ''
      } else {
        el.style.backdropFilter=''; el.style.background=''
      }
    }
  })

  return (
    <>
      <OrbitPath/>
      {ARTISTS.map((artist,i)=>(
        <ArtistCard key={i} artist={artist} index={i}/>
      ))}
    </>
  )
}

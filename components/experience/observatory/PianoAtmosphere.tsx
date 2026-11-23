'use client'
// PianoAtmosphere — matches the density and quality of the Home page's
// GoldDustEcosystem + LivingUniverse, re-centered on the piano instead of
// the saxophone.

import { useRef, useMemo } from 'react'
import { useFrame }        from '@react-three/fiber'
import * as THREE          from 'three'
import { obsState, pianoLivePos } from './observatoryState'

const TAU = Math.PI * 2

// ── Shared Gaussian disk fragment ────────────────────────────────────────────
const FRAG_DISK = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, exp(-d*d*11.0) * vAlpha);
  }
`

// ── Gold palette GLSL helper ──────────────────────────────────────────────────
const GLSL_GOLD = /* glsl */`
  vec3 gold(float t, float bright) {
    vec3 warm = vec3(0.76, 0.52, 0.18);
    vec3 cool = vec3(0.91, 0.82, 0.50);
    return mix(warm, cool, t) * bright;
  }
`

// ── Geometry builder ──────────────────────────────────────────────────────────
function makeGeo(n: number, posFn: (i: number) => [number,number,number]) {
  const pos  = new Float32Array(n * 3)
  const seed = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const [x,y,z] = posFn(i)
    pos[i*3] = x;  pos[i*3+1] = y;  pos[i*3+2] = z
    seed[i] = Math.random()
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aSeed',    new THREE.BufferAttribute(seed, 1))
  return g
}

// ═══════════════════════════════════════════════════════════════════════════════
// System 1 — Atmospheric Dust  (70 K)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_ATMOSPHERIC = /* glsl */`
  uniform float uTime;
  uniform vec3  uPiano;
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
    pos.x += sin(t1 + s*17.3)*0.52  + cos(t2*1.3 + s*11.7)*0.28;
    pos.y += cos(t1 + s*23.1)*0.41  + sin(t2     + s* 7.9)*0.20;
    pos.z += sin(t3 + s*31.4)*0.34  + cos(t1*0.7 + s*19.2)*0.15;
    pos.x += uCursor.x * (0.04 + fract(s*5.3)*0.06);
    pos.y += uCursor.y * (0.03 + fract(s*8.7)*0.05);
    float distToPiano = length(pos.xy - uPiano.xy);
    float densityBoost = 1.0 + smoothstep(6.0, 0.8, distToPiano) * 0.75;
    float flicker = 0.82 + sin(uTime*(0.18 + fract(s*4.1)*0.4) + s*50.0)*0.18;
    vColor = gold(fract(s*5.93), 0.72 + fract(s*2.17)*0.40);
    vAlpha = (0.20 + fract(s*13.7)*0.45) * flicker * densityBoost * uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos,1.0);
    gl_PointSize = uSize * (1.0 + fract(s*2.1)*0.8) * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function AtmosphericDust() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const geo    = useMemo(() => makeGeo(70000, () => [
    (Math.random()-0.5)*22, (Math.random()-0.5)*14, (Math.random()-0.5)*18 - 5,
  ]), [])
  const uni = useMemo(() => ({
    uTime: {value:0}, uPiano: {value: new THREE.Vector3()},
    uCursor: {value: new THREE.Vector2()}, uOpacity: {value:0}, uSize: {value:0.055},
  }), [])
  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uPiano.value.set(pianoLivePos.x, pianoLivePos.y, pianoLivePos.z)
    mat.uniforms.uCursor.value.set(obsState.pointerX, obsState.pointerY)
    const ramp = Math.max(0, (obsState.introT - 0.1) / 0.8)
    const tgt  = Math.min(1, Math.pow(ramp, 2.8)) * 0.88
    mat.uniforms.uOpacity.value += (tgt - mat.uniforms.uOpacity.value) * 0.04
  })
  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_ATMOSPHERIC} fragmentShader={FRAG_DISK}
        uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// System 2 — Piano Emission  (48 K)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_EMISSION = /* glsl */`
  uniform float uTime;
  uniform vec3  uPiano;
  uniform float uOpacity;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  const float TAU = 6.28318530;
  ${GLSL_GOLD}
  void main() {
    float s = aSeed;
    float lifeSpeed = 0.018 + fract(s*7.31)*0.032;
    float birthT    = fract(uTime * lifeSpeed + s);
    float zoneRng = fract(s*3.71);
    float zoneY; float minR; float maxR;
    if (zoneRng < 0.35) {
      zoneY = mix(1.2, 2.0, fract(s*11.3));
      minR = 0.30; maxR = 1.40;
    } else if (zoneRng < 0.60) {
      zoneY = mix(-0.8, -0.3, fract(s*5.7));
      minR = 0.10; maxR = 1.20;
    } else if (zoneRng < 0.85) {
      zoneY = mix(-0.5, 1.0, fract(s*9.1));
      minR = 0.50; maxR = 1.50;
    } else {
      zoneY = mix(-1.8, -1.0, fract(s*7.7));
      minR = 0.08; maxR = 0.30;
    }
    float birthR     = minR + fract(s*13.7)*(maxR-minR);
    float birthTheta = fract(s*17.3)*TAU;
    vec3 birthPos = uPiano + vec3(cos(birthTheta)*birthR, zoneY, sin(birthTheta)*birthR*0.38);
    float driftAge = 1.0 - pow(1.0 - birthT, 2.8);
    float maxTravel = 0.8 + fract(s*4.3)*3.8;
    float tA = uTime*(0.022 + fract(s*3.3)*0.018);
    float tB = uTime*(0.015 + fract(s*5.7)*0.012);
    float driftAngle = birthTheta + sin(uTime*0.022 + s*6.28)*0.52;
    vec3 driftDir = normalize(vec3(
      cos(driftAngle)*(0.68 + fract(s*2.9)*0.52),
      0.10 + fract(s*6.1)*0.22,
      sin(driftAngle)*(0.30 + fract(s*4.7)*0.26)
    ));
    driftDir.x += sin(tA + s*17.1)*0.24 + cos(tB*1.3 + s*11.3)*0.14;
    driftDir.y += cos(tA + s*23.7)*0.11 + sin(tB*0.7 + s* 7.9)*0.08;
    vec3 pos = birthPos + driftDir*(driftAge*maxTravel);
    float lifeAlpha = smoothstep(0.0,0.14,birthT)*smoothstep(1.0,0.52,birthT);
    vColor = gold(fract(s*3.71), 0.68 + fract(s*5.3)*0.52);
    vAlpha = lifeAlpha*(0.50 + fract(s*8.3)*0.48)*uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos,1.0);
    float sizeScale = 1.0 + (1.0-birthT)*0.45;
    gl_PointSize = uSize * sizeScale * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function PianoEmission() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const geo    = useMemo(() => makeGeo(48000, () => [0,0,0]), [])
  const uni    = useMemo(() => ({
    uTime: {value:0}, uPiano: {value: new THREE.Vector3()},
    uOpacity: {value:0}, uSize: {value:0.060},
  }), [])
  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uPiano.value.set(pianoLivePos.x, pianoLivePos.y, pianoLivePos.z)
    const tgt = Math.min(1, (obsState.introT - 0.8) / 2.0) * 0.93
    mat.uniforms.uOpacity.value += (Math.max(0,tgt) - mat.uniforms.uOpacity.value) * 0.04
  })
  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_EMISSION} fragmentShader={FRAG_DISK}
        uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// System 3 — Hero Sparkle  (20 K)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_HERO = /* glsl */`
  uniform float uTime;
  uniform vec3  uPiano;
  uniform float uOpacity;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  const float TAU = 6.28318530;
  void main() {
    float s = aSeed;
    float lifeSpeed = 0.08 + fract(s*5.3)*0.10;
    float birthT    = fract(uTime*lifeSpeed + s);
    float zoneRng = fract(s*4.17);
    float heroY; float heroR;
    if (zoneRng < 0.40) {
      heroY = mix(0.8, 2.1, fract(s*7.1)); heroR = 0.50 + fract(s*3.1)*0.90;
    } else if (zoneRng < 0.68) {
      heroY = mix(-0.5, 0.0, fract(s*5.9)); heroR = 0.80 + fract(s*2.3)*0.60;
    } else {
      heroY = mix(1.8, 2.4, fract(s*9.3)); heroR = 0.10 + fract(s*4.7)*0.30;
    }
    float birthTheta = fract(s*13.1)*TAU;
    vec3 birthPos = uPiano + vec3(cos(birthTheta)*heroR, heroY, sin(birthTheta)*heroR*0.34);
    float driftAge = 1.0 - pow(1.0-birthT, 3.2);
    float travel   = 0.25 + fract(s*6.7)*1.0;
    float tA       = uTime*(0.035 + fract(s*3.7)*0.025);
    float driftAngle = birthTheta + sin(tA + s*3.14)*0.40;
    vec3 driftDir = normalize(vec3(cos(driftAngle)*0.75, 0.12 + fract(s*3.7)*0.28, sin(driftAngle)*0.28));
    driftDir.x += sin(tA*1.3 + s*11.7)*0.15;
    driftDir.z += cos(tA*0.9 + s* 7.3)*0.12;
    vec3 pos = birthPos + driftDir*(driftAge*travel);
    float lifeAlpha = smoothstep(0.0,0.08,birthT)*smoothstep(1.0,0.38,birthT);
    float t = fract(s*3.7);
    vColor = mix(vec3(0.88,0.72,0.34), vec3(0.97,0.90,0.60), t);
    vAlpha = lifeAlpha*(0.65 + fract(s*5.1)*0.35)*uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos,1.0);
    gl_PointSize = uSize*(280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function HeroSparkle() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const geo    = useMemo(() => makeGeo(20000, () => [0,0,0]), [])
  const uni    = useMemo(() => ({
    uTime: {value:0}, uPiano: {value: new THREE.Vector3()},
    uOpacity: {value:0}, uSize: {value:0.048},
  }), [])
  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uPiano.value.set(pianoLivePos.x, pianoLivePos.y, pianoLivePos.z)
    const tgt = Math.min(1, (obsState.introT - 1.5) / 2.5) * 0.85
    mat.uniforms.uOpacity.value += (Math.max(0,tgt) - mat.uniforms.uOpacity.value) * 0.035
  })
  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_HERO} fragmentShader={FRAG_DISK}
        uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// System 4 — Falling Dust  (25 K)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_FALL = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vAlpha;
  ${GLSL_GOLD}
  void main() {
    float s     = aSeed;
    float speed = 0.006 + fract(s*7.1)*0.010;
    vec3  pos   = position;
    pos.y = mod(pos.y - uTime*speed, 14.0) - 7.0;
    pos.x += sin(uTime*(0.018 + fract(s*3.2)*0.012) + s*17.3)*0.38;
    pos.z += cos(uTime*(0.014 + fract(s*5.7)*0.010) + s*9.1)*0.25;
    float flicker = 0.72 + 0.28*sin(uTime*(0.12 + fract(s*4.3)*0.3) + s*31.4);
    vColor = gold(fract(s*4.7), 0.60 + fract(s*3.1)*0.30);
    vAlpha = flicker*(0.12 + fract(s*9.3)*0.22)*uOpacity;
    vec4 mv = modelViewMatrix * vec4(pos,1.0);
    gl_PointSize = uSize*(280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`

function FallingDust() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const geo    = useMemo(() => makeGeo(25000, () => [
    (Math.random()-0.5)*22, (Math.random()-0.5)*14, (Math.random()-0.5)*14 - 4,
  ]), [])
  const uni = useMemo(() => ({ uTime:{value:0}, uOpacity:{value:0}, uSize:{value:0.040} }), [])
  useFrame(({ clock }) => {
    const mat = matRef.current; if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    const tgt = Math.min(1, (obsState.introT - 1.0) / 3.0) * 0.80
    mat.uniforms.uOpacity.value += (Math.max(0,tgt) - mat.uniforms.uOpacity.value) * 0.025
  })
  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_FALL} fragmentShader={FRAG_DISK}
        uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// System 5 — Curl Noise Streams  (7 K)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_CURL = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uPiano;
  attribute float aSeed;
  attribute vec3  aBirth;
  varying vec3  vColor;
  varying float vAlpha;
  float h3(vec3 p) {
    p = fract(p * vec3(0.1031,0.1030,0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.x+p.y)*p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(
      mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  vec3 curlFlow(vec3 p, float t) {
    float sc = 0.32; vec3 ofs = vec3(t*0.016, t*0.011, t*0.019);
    vec3 ps  = p*sc + ofs; const float E = 0.20;
    float a1=noise3(ps+vec3(0,E,0))-noise3(ps-vec3(0,E,0));
    float a2=noise3(ps+vec3(0,0,E))-noise3(ps-vec3(0,0,E));
    float a3=noise3(ps+vec3(E,0,0))-noise3(ps-vec3(E,0,0));
    vec3 b=ps+vec3(3.7,1.9,5.3);
    float b1=noise3(b+vec3(0,E,0))-noise3(b-vec3(0,E,0));
    float b2=noise3(b+vec3(0,0,E))-noise3(b-vec3(0,0,E));
    float b3=noise3(b+vec3(E,0,0))-noise3(b-vec3(E,0,0));
    return normalize(vec3(a1-b2,a2-b3,a3-b1))*0.88;
  }
  void main() {
    float s=aSeed; float life=0.020+fract(s*7.31)*0.022; float age=fract(uTime*life+s);
    vec3 pos=aBirth; float travel=1.8+fract(s*4.3)*2.8;
    vec3 k1=curlFlow(pos,uTime); vec3 k2=curlFlow(pos+k1*0.5,uTime+0.25);
    pos+=mix(k1,k2,0.5)*age*travel;
    pos.y+=age*(0.14+fract(s*3.7)*0.22);
    vec3 toP=uPiano-pos;
    pos+=normalize(toP)*smoothstep(9.0,1.2,length(toP))*age*0.05;
    float lifeA=smoothstep(0.0,0.12,age)*smoothstep(1.0,0.52,age);
    float bright=0.52+fract(s*4.7)*0.48;
    vColor=mix(vec3(0.74,0.50,0.17),vec3(0.90,0.78,0.46),fract(s*3.1))*bright;
    vAlpha=lifeA*(0.22+fract(s*9.3)*0.28)*uOpacity;
    vec4 mv=modelViewMatrix*vec4(pos,1.0);
    gl_PointSize=(0.038+fract(s*2.1)*0.034)*(280.0/-mv.z);
    gl_Position=projectionMatrix*mv;
  }
`

function CurlStreams() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const N = 7000
  const { geo, uni } = useMemo(() => {
    const pos=new Float32Array(N*3), seed=new Float32Array(N), birth=new Float32Array(N*3)
    for(let i=0;i<N;i++){
      const bx=(Math.random()-0.5)*16, by=(Math.random()-0.5)*10, bz=(Math.random()-0.5)*10-4
      birth[i*3]=bx; birth[i*3+1]=by; birth[i*3+2]=bz
      pos[i*3]=bx;   pos[i*3+1]=by;   pos[i*3+2]=bz; seed[i]=Math.random()
    }
    const g=new THREE.BufferGeometry()
    g.setAttribute('position',new THREE.BufferAttribute(pos,3))
    g.setAttribute('aSeed',new THREE.BufferAttribute(seed,1))
    g.setAttribute('aBirth',new THREE.BufferAttribute(birth,3))
    return { geo:g, uni:{ uTime:{value:0}, uOpacity:{value:0}, uPiano:{value:new THREE.Vector3()} } }
  }, [])
  useFrame(({ clock }) => {
    const mat=matRef.current; if(!mat) return
    mat.uniforms.uTime.value=clock.getElapsedTime()
    mat.uniforms.uPiano.value.set(pianoLivePos.x,pianoLivePos.y,pianoLivePos.z)
    const tgt=Math.min(1,(obsState.introT-1.5)/4.0)*0.68
    mat.uniforms.uOpacity.value+=(Math.max(0,tgt)-mat.uniforms.uOpacity.value)*0.022
  })
  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_CURL} fragmentShader={FRAG_DISK}
        uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// System 6 — Volumetric Haze  (3 500)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_HAZE = /* glsl */`
  uniform float uTime; uniform float uOpacity; uniform vec3 uPiano;
  attribute float aSeed; varying vec3 vColor; varying float vAlpha;
  const float TAU=6.28318530;
  void main() {
    float s=aSeed; float a=fract(s*17.3)*TAU;
    float rL=0.025+fract(s*5.7)*0.055; float age=fract(uTime*rL+s);
    float depth=-(1.5+fract(s*9.1)*3.0)*age; float r=fract(s*3.7)*1.4*(-depth/4.0);
    float drift=sin(uTime*0.11+s*TAU)*0.14*age;
    vec3 pos=uPiano+vec3(cos(a)*r+drift,depth+0.2,sin(a)*r*0.45);
    float lifeA=smoothstep(0.0,0.14,age)*smoothstep(1.0,0.40,age);
    float flicker=0.68+0.32*sin(uTime*(0.3+fract(s*2.1))+s*30.0);
    vColor=mix(vec3(0.82,0.60,0.26),vec3(0.62,0.44,0.16),age);
    vAlpha=lifeA*flicker*(0.10+fract(s*7.1)*0.12)*uOpacity;
    vec4 mv=modelViewMatrix*vec4(pos,1.0);
    gl_PointSize=(1.0+age*2.2)*(1.0+fract(s*3.1)*0.9)*(260.0/-mv.z);
    gl_Position=projectionMatrix*mv;
  }
`

function VolumetricHaze() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const geo = useMemo(() => {
    const N=3500; const s=new Float32Array(N); const p=new Float32Array(N*3)
    for(let i=0;i<N;i++) s[i]=Math.random()
    const g=new THREE.BufferGeometry()
    g.setAttribute('position',new THREE.BufferAttribute(p,3)); g.setAttribute('aSeed',new THREE.BufferAttribute(s,1))
    return g
  }, [])
  const uni=useMemo(()=>({ uTime:{value:0}, uOpacity:{value:0}, uPiano:{value:new THREE.Vector3()} }),[])
  useFrame(({clock})=>{
    const mat=matRef.current; if(!mat) return
    mat.uniforms.uTime.value=clock.getElapsedTime()
    mat.uniforms.uPiano.value.set(pianoLivePos.x,pianoLivePos.y,pianoLivePos.z)
    const tgt=Math.min(1,(obsState.introT-2.0)/4.0)*0.75
    mat.uniforms.uOpacity.value+=(Math.max(0,tgt)-mat.uniforms.uOpacity.value)*0.018
  })
  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_HAZE} fragmentShader={FRAG_DISK}
        uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// System 7 — Brass Fragments  (420)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_BRASS = /* glsl */`
  uniform float uTime; uniform float uOpacity;
  attribute float aSeed; attribute float aAngle;
  varying vec3 vColor; varying float vAlpha; varying float vAngle;
  void main() {
    float s=aSeed;
    float t1=uTime*(0.006+fract(s*7.3)*0.008); float t2=uTime*(0.004+fract(s*3.1)*0.005);
    vec3 pos=position;
    pos.x+=sin(t1+s*17.3)*0.6+cos(t2+s*11.1)*0.3;
    pos.y+=cos(t1+s*23.1)*0.5+sin(t2+s* 7.9)*0.2;
    pos.z+=sin(t2+s* 9.3)*0.3;
    float fl=0.7+0.3*sin(uTime*(0.08+fract(s*4.1)*0.2)+s*50.0);
    vColor=mix(vec3(0.74,0.54,0.22),vec3(0.92,0.80,0.42),fract(s*4.1));
    vAlpha=fl*(0.45+fract(s*8.3)*0.45)*uOpacity;
    vAngle=aAngle+uTime*(0.020+fract(s*5.3)*0.030);
    vec4 mv=modelViewMatrix*vec4(pos,1.0);
    gl_PointSize=(8.0+fract(s*2.7)*14.0)*(220.0/-mv.z);
    gl_Position=projectionMatrix*mv;
  }
`
const FRAG_BRASS = /* glsl */`
  varying vec3 vColor; varying float vAlpha; varying float vAngle;
  void main() {
    vec2 uv=gl_PointCoord-0.5;
    float ca=cos(vAngle); float sa=sin(vAngle);
    vec2 ruv=vec2(ca*uv.x-sa*uv.y, sa*uv.x+ca*uv.y);
    float d=sqrt(ruv.x*ruv.x*16.0+ruv.y*ruv.y);
    if(d>0.5) discard;
    float spec=exp(-abs(ruv.x)*16.0)*(1.0-abs(ruv.y)*1.8);
    float a=exp(-d*d*4.5)*(0.6+spec*0.45)*vAlpha;
    gl_FragColor=vec4(vColor+spec*vec3(0.28,0.22,0.08),a);
  }
`

function BrassFragments() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const geo = useMemo(() => {
    const N=420; const p=new Float32Array(N*3); const s=new Float32Array(N); const a=new Float32Array(N)
    for(let i=0;i<N;i++){
      p[i*3]=(Math.random()-0.5)*20; p[i*3+1]=(Math.random()-0.5)*12; p[i*3+2]=(Math.random()-0.5)*12-3
      s[i]=Math.random(); a[i]=Math.random()*TAU
    }
    const g=new THREE.BufferGeometry()
    g.setAttribute('position',new THREE.BufferAttribute(p,3))
    g.setAttribute('aSeed',new THREE.BufferAttribute(s,1))
    g.setAttribute('aAngle',new THREE.BufferAttribute(a,1))
    return g
  }, [])
  const uni=useMemo(()=>({ uTime:{value:0}, uOpacity:{value:0} }),[])
  useFrame(({clock})=>{
    const mat=matRef.current; if(!mat) return
    mat.uniforms.uTime.value=clock.getElapsedTime()
    const tgt=Math.min(1,(obsState.introT-2.5)/5.0)*0.72
    mat.uniforms.uOpacity.value+=(Math.max(0,tgt)-mat.uniforms.uOpacity.value)*0.014
  })
  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_BRASS} fragmentShader={FRAG_BRASS}
        uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// System 8 — Micro Glints  (650)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_GLINT = /* glsl */`
  uniform float uTime; uniform float uOpacity;
  attribute float aSeed; varying vec3 vColor; varying float vAlpha;
  void main() {
    float s=aSeed; float period=4.5+fract(s*7.3)*18.0; float ph=fract(uTime/period+s);
    float appear=ph<0.04?ph/0.04:ph<0.12?1.0:ph<0.26?1.0-(ph-0.12)/0.14:0.0;
    appear=pow(appear,0.42);
    vec3 pos=vec3(fract(s*3.2)*22.0-11.0, fract(s*7.8)*12.0-6.0, -1.0-fract(s*5.4)*9.0);
    vColor=mix(vec3(0.90,0.78,0.46),vec3(1.0,0.96,0.72),fract(s*9.1));
    vAlpha=appear*(0.50+fract(s*4.3)*0.50)*uOpacity;
    vec4 mv=modelViewMatrix*vec4(pos,1.0);
    gl_PointSize=appear*(1.2+fract(s*2.7)*3.2)*(240.0/-mv.z);
    gl_Position=projectionMatrix*mv;
  }
`
const FRAG_GLINT = /* glsl */`
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec2 uv=gl_PointCoord-0.5;
    float disk=exp(-dot(uv,uv)*26.0);
    float crossH=exp(-abs(uv.y)*22.0)*exp(-abs(uv.x)*4.0);
    float crossV=exp(-abs(uv.x)*22.0)*exp(-abs(uv.y)*4.0);
    float a=clamp(disk+(crossH+crossV)*0.52,0.0,1.0)*vAlpha;
    gl_FragColor=vec4(vColor,a);
  }
`

function MicroGlints() {
  const matRef=useRef<THREE.ShaderMaterial>(null)
  const geo=useMemo(()=>makeGeo(650,()=>[0,0,0]),[])
  const uni=useMemo(()=>({ uTime:{value:0}, uOpacity:{value:0} }),[])
  useFrame(({clock})=>{
    const mat=matRef.current; if(!mat) return
    mat.uniforms.uTime.value=clock.getElapsedTime()
    const tgt=Math.min(1,(obsState.introT-2.0)/4.0)*0.88
    mat.uniforms.uOpacity.value+=(Math.max(0,tgt)-mat.uniforms.uOpacity.value)*0.018
  })
  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_GLINT} fragmentShader={FRAG_GLINT}
        uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// System 9 — Search-reactive Shimmer  (2 K)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_SHIMMER = /* glsl */`
  uniform float uTime; uniform float uOpacity; uniform vec3 uPiano; uniform float uPulseT;
  attribute float aSeed; varying vec3 vColor; varying float vAlpha;
  const float TAU=6.28318530;
  void main() {
    float s=aSeed; float delay=fract(s*7.3)*0.3; float life=0.14+fract(s*4.1)*0.22;
    float age=clamp((uTime-uPulseT-delay)/life,0.0,1.0);
    float kx=fract(s*13.7)*2.0-1.0;
    vec3 birth=uPiano+vec3(kx*1.4,-0.5,0.6);
    float burst=1.0-pow(1.0-age,2.2);
    vec3 dir=normalize(vec3(sin(s*TAU)*0.7, 0.5+fract(s*3.7)*0.5, cos(s*TAU+1.2)*0.4));
    vec3 pos=birth+dir*burst*(0.5+fract(s*5.3)*1.0);
    float alpha=smoothstep(0.0,0.15,age)*smoothstep(1.0,0.4,age);
    vColor=mix(vec3(0.92,0.78,0.38),vec3(1.0,0.95,0.65),fract(s*4.3));
    vAlpha=alpha*(0.5+fract(s*6.1)*0.5)*uOpacity;
    vec4 mv=modelViewMatrix*vec4(pos,1.0);
    gl_PointSize=(0.08+fract(s*2.7)*0.12)*(240.0/-mv.z);
    gl_Position=projectionMatrix*mv;
  }
`

function SearchShimmer() {
  const matRef=useRef<THREE.ShaderMaterial>(null)
  const prevPulse=useRef(0)
  const geo=useMemo(()=>makeGeo(2000,()=>[0,0,0]),[])
  const uni=useMemo(()=>({ uTime:{value:0}, uOpacity:{value:0}, uPiano:{value:new THREE.Vector3()}, uPulseT:{value:-999} }),[])
  useFrame(({clock})=>{
    const mat=matRef.current; if(!mat) return
    const t=clock.getElapsedTime()
    mat.uniforms.uTime.value=t
    mat.uniforms.uPiano.value.set(pianoLivePos.x,pianoLivePos.y,pianoLivePos.z)
    if(obsState.searchPulse!==prevPulse.current){
      prevPulse.current=obsState.searchPulse
      mat.uniforms.uPulseT.value=t
      mat.uniforms.uOpacity.value=1.0
    }
    mat.uniforms.uOpacity.value*=0.982
  })
  return (
    <points geometry={geo}>
      <shaderMaterial ref={matRef} vertexShader={VERT_SHIMMER} fragmentShader={FRAG_DISK}
        uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// System 10 — Sacred Geometry  (14 line instances)
// ═══════════════════════════════════════════════════════════════════════════════
const VERT_GEO = /* glsl */`
  attribute float aPhase; attribute float aEdge;
  uniform float uTime; uniform float uOpacity;
  varying float vAlpha; varying vec3 vCol;
  void main() {
    float a=(aEdge==0.0)?1.0:aEdge;
    float breath=0.50+0.50*sin(uTime*0.042+aPhase);
    vAlpha=a*breath*uOpacity; vCol=vec3(0.72,0.54,0.21);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  }
`
const FRAG_GEO=/* glsl */`varying float vAlpha; varying vec3 vCol; void main(){gl_FragColor=vec4(vCol,vAlpha);}`

function circleGeo(R:number,N=256):THREE.BufferGeometry{
  const pos=new Float32Array((N+1)*3),ph=new Float32Array(N+1),edge=new Float32Array(N+1)
  for(let i=0;i<=N;i++){const a=(i/N)*TAU; pos[i*3]=Math.cos(a)*R; pos[i*3+1]=Math.sin(a)*R; pos[i*3+2]=0; ph[i]=(i/N)*TAU; edge[i]=1.0}
  const g=new THREE.BufferGeometry()
  g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('aPhase',new THREE.BufferAttribute(ph,1)); g.setAttribute('aEdge',new THREE.BufferAttribute(edge,1))
  return g
}
function arcGeo(R:number,a0:number,a1:number,N=96):THREE.BufferGeometry{
  const pos=new Float32Array(N*3),ph=new Float32Array(N),edge=new Float32Array(N)
  for(let i=0;i<N;i++){const t=i/(N-1),a=a0+(a1-a0)*t; pos[i*3]=Math.cos(a)*R; pos[i*3+1]=Math.sin(a)*R; pos[i*3+2]=0; edge[i]=Math.sin(t*Math.PI); ph[i]=t*Math.PI}
  const g=new THREE.BufferGeometry()
  g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('aPhase',new THREE.BufferAttribute(ph,1)); g.setAttribute('aEdge',new THREE.BufferAttribute(edge,1))
  return g
}
function radialGeo(spokes:number,r0:number,r1:number):THREE.BufferGeometry{
  const pos=new Float32Array(spokes*2*3),ph=new Float32Array(spokes*2),edge=new Float32Array(spokes*2)
  for(let i=0;i<spokes;i++){const a=(i/spokes)*TAU,j=i*6; pos[j]=Math.cos(a)*r0; pos[j+1]=Math.sin(a)*r0; pos[j+2]=0; pos[j+3]=Math.cos(a)*r1; pos[j+4]=Math.sin(a)*r1; pos[j+5]=0; ph[i*2]=(i/spokes)*TAU*3; ph[i*2+1]=ph[i*2]+0.5; edge[i*2]=0.1; edge[i*2+1]=0.6}
  const g=new THREE.BufferGeometry()
  g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('aPhase',new THREE.BufferAttribute(ph,1)); g.setAttribute('aEdge',new THREE.BufferAttribute(edge,1))
  return g
}

interface GSpec{geo:THREE.BufferGeometry;px:number;py:number;pz:number;rx:number;ry:number;rz:number;maxOp:number;delay:number}

function GeoLine({s}:{s:GSpec}){
  const obj=useMemo(()=>{
    const mat=new THREE.ShaderMaterial({vertexShader:VERT_GEO,fragmentShader:FRAG_GEO,uniforms:{uTime:{value:0},uOpacity:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})
    const line=new THREE.Line(s.geo,mat); line.position.set(s.px,s.py,s.pz); line.rotation.set(s.rx,s.ry,s.rz)
    return {line,mat}
  },[s])
  useFrame(({clock})=>{
    obj.mat.uniforms.uTime.value=clock.getElapsedTime()
    const age=Math.max(0,obsState.introT-s.delay)
    obj.mat.uniforms.uOpacity.value+=(Math.min(1,age/14)*s.maxOp-obj.mat.uniforms.uOpacity.value)*0.008
  })
  return <primitive object={obj.line}/>
}

const GEO_SPECS:GSpec[]=[
  {geo:circleGeo(12.0),px:0,py:0,pz:-16,rx:0,ry:0,rz:0,maxOp:0.022,delay:10},
  {geo:circleGeo(8.5),px:0,py:0,pz:-12,rx:0,ry:0,rz:0,maxOp:0.032,delay:7},
  {geo:circleGeo(5.5),px:0,py:0,pz:-9,rx:0,ry:0,rz:0,maxOp:0.040,delay:5},
  {geo:circleGeo(7.0),px:0,py:0,pz:-10,rx:0.88,ry:0.2,rz:0.1,maxOp:0.028,delay:6},
  {geo:circleGeo(9.8),px:0,py:0,pz:-13,rx:0.42,ry:0.6,rz:0,maxOp:0.020,delay:9},
  {geo:circleGeo(4.2),px:0,py:0,pz:-7,rx:1.18,ry:0.3,rz:0.4,maxOp:0.036,delay:5},
  {geo:circleGeo(3.2),px:0,py:0,pz:-6,rx:0,ry:0,rz:0,maxOp:0.046,delay:4},
  {geo:circleGeo(1.98),px:0,py:0,pz:-5,rx:0,ry:0,rz:0,maxOp:0.052,delay:3},
  {geo:arcGeo(8.2,0.18,Math.PI*0.72),px:2,py:1,pz:-11,rx:0.5,ry:0,rz:0,maxOp:0.026,delay:8},
  {geo:arcGeo(4.0,Math.PI*0.28,Math.PI*1.45),px:-1,py:0.5,pz:-7,rx:0.3,ry:0.4,rz:0,maxOp:0.034,delay:7},
  {geo:arcGeo(11.0,-0.3,Math.PI*0.85),px:0,py:-0.5,pz:-15,rx:0.1,ry:0.1,rz:0.2,maxOp:0.016,delay:12},
  {geo:arcGeo(2.8,Math.PI*0.6,Math.PI*1.9),px:1.5,py:-0.8,pz:-6,rx:0,ry:0.5,rz:0.3,maxOp:0.038,delay:6},
  {geo:radialGeo(12,0.5,3.4),px:0,py:0,pz:-7,rx:0,ry:0,rz:0,maxOp:0.018,delay:5},
  {geo:radialGeo(8,6.0,9.5),px:0,py:0,pz:-13,rx:0.3,ry:0,rz:0,maxOp:0.012,delay:11},
]

function AncientGeometry(){return <>{GEO_SPECS.map((s,i)=><GeoLine key={i} s={s}/>)}</>}

// ═══════════════════════════════════════════════════════════════════════════════
// Root export
// ═══════════════════════════════════════════════════════════════════════════════
export default function PianoAtmosphere() {
  return (
    <>
      <AncientGeometry />
      <AtmosphericDust />
      <FallingDust />
      <CurlStreams />
      <PianoEmission />
      <HeroSparkle />
      <VolumetricHaze />
      <BrassFragments />
      <MicroGlints />
      <SearchShimmer />
    </>
  )
}

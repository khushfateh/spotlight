'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

// ─── Grand Piano ──────────────────────────────────────────────────────────────
function GrandPiano() {
  // Keyboard at TOP of SVG so it's visible when piano peeks from bottom-left corner
  // 12 white keys (C D E F G A B C D E F G), each 13px wide with 1px gap
  const KX = 12, KY = 18, WW = 13, WH = 76, WStep = 14, BW = 8, BH = 48
  const wKeys = Array.from({ length: 12 }, (_, i) => KX + i * WStep)
  // Black keys: between indices 0-1,1-2,3-4,4-5,5-6,7-8,8-9,10-11
  const bKeys = [0,1,3,4,5,7,8,10].map(i => KX + i * WStep + WW - 3)

  return (
    <svg viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gp2-body" x1="182" y1="104" x2="412" y2="195" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F0D060" stopOpacity="0.75"/>
          <stop offset="55%"  stopColor="#C9A84C" stopOpacity="0.54"/>
          <stop offset="100%" stopColor="#8A6820" stopOpacity="0.26"/>
        </linearGradient>
        <linearGradient id="gp2-lid" x1="248" y1="110" x2="412" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F5DC70" stopOpacity="0.90"/>
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.52"/>
        </linearGradient>
        <filter id="gp2-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Keyboard housing — dark box so keys pop */}
      <rect x="8" y={KY} width="174" height={WH + 8} rx="3"
        fill="rgba(4,3,1,0.50)" stroke="rgba(201,168,76,0.68)" strokeWidth="2.2"/>

      {/* White keys */}
      {wKeys.map((x, i) => (
        <rect key={`w${i}`} x={x} y={KY + 2} width={WW} height={WH} rx="2.5"
          fill="rgba(235,198,74,0.20)" stroke="rgba(201,168,76,0.50)" strokeWidth="0.9"/>
      ))}
      {/* White key dividers */}
      {wKeys.slice(1).map((x, i) => (
        <line key={`d${i}`} x1={x - 0.5} y1={KY + 2} x2={x - 0.5} y2={KY + WH + 2}
          stroke="rgba(201,168,76,0.22)" strokeWidth="0.5"/>
      ))}
      {/* Black keys — rendered on top */}
      {bKeys.map((x, i) => (
        <rect key={`b${i}`} x={x} y={KY + 2} width={BW} height={BH} rx="2"
          fill="rgba(5,4,1,0.95)" stroke="rgba(201,168,76,0.60)" strokeWidth="1.1"/>
      ))}

      {/* Fallboard (lid above keyboard — slightly open) */}
      <path d="M8,14 L182,14 L182,18 L8,18 Z"
        fill="rgba(201,168,76,0.14)" stroke="rgba(201,168,76,0.65)" strokeWidth="1.6"/>
      <line x1="10" y1="15" x2="180" y2="15" stroke="rgba(255,248,140,0.32)" strokeWidth="0.7"/>

      {/* Grand piano body — D-shape below the keyboard */}
      {/* Body ambient glow */}
      <path d="M182,102 Q198,108 248,110 L388,102 Q416,100 418,138 Q420,168 408,194 Q394,218 364,228 Q326,240 288,234 L212,220 Q192,214 182,224"
        stroke="rgba(201,168,76,0.16)" strokeWidth="22" strokeLinejoin="round" strokeLinecap="round" filter="url(#gp2-glow)"/>

      {/* Body fill + outline */}
      <path d="M182,102 Q198,108 248,110 L388,102 Q416,100 418,138 Q420,168 408,194 Q394,218 364,228 Q326,240 288,234 L212,220 Q192,214 182,224 L182,102 Z"
        fill="rgba(201,168,76,0.070)" stroke="url(#gp2-body)" strokeWidth="2.4" strokeLinejoin="round"/>

      {/* Body interior sheen */}
      <path d="M190,115 Q240,118 320,112 L404,108 Q414,126 414,144"
        stroke="rgba(255,242,140,0.14)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

      {/* Left straight edge of body (where keyboard meets body) */}
      <line x1="182" y1="102" x2="182" y2="224" stroke="rgba(201,168,76,0.40)" strokeWidth="1.8"/>

      {/* Raised lid — angled above the body */}
      <path d="M388,102 L412,84 L282,90 L248,110 Z"
        fill="rgba(201,168,76,0.14)" stroke="url(#gp2-lid)" strokeWidth="2.0" strokeLinejoin="round"/>
      {/* Lid specular edge */}
      <line x1="388" y1="102" x2="412" y2="84" stroke="rgba(255,250,160,0.60)" strokeWidth="1.1" strokeLinecap="round"/>
      {/* Lid inner edge sheen */}
      <line x1="282" y1="90" x2="412" y2="84" stroke="rgba(255,244,140,0.22)" strokeWidth="0.8"/>

      {/* Lid prop stick */}
      <line x1="335" y1="96" x2="348" y2="116" stroke="rgba(201,168,76,0.68)" strokeWidth="2.0" strokeLinecap="round"/>

      {/* Legs */}
      <line x1="26" y1="234" x2="18" y2="264" stroke="rgba(201,168,76,0.60)" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="148" y1="234" x2="148" y2="264" stroke="rgba(201,168,76,0.54)" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="182" y1="198" x2="186" y2="236" stroke="rgba(201,168,76,0.46)" strokeWidth="4.5" strokeLinecap="round"/>

      {/* Pedal rod + pedals */}
      <path d="M38,258 Q88,264 136,258" stroke="rgba(201,168,76,0.44)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      {[56, 88, 120].map(cx => (
        <ellipse key={cx} cx={cx} cy={263} rx={9} ry={4.5}
          fill="rgba(201,168,76,0.11)" stroke="rgba(201,168,76,0.52)" strokeWidth="1.5"/>
      ))}
    </svg>
  )
}

// ─── Alto Saxophone ───────────────────────────────────────────────────────────
function Saxophone() {
  const leftPads  = [96, 124, 154, 184, 214, 244, 272]
  const rightPads = [112, 154, 202, 252]

  return (
    <svg viewBox="0 0 190 420" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sx2-body" x1="186" y1="74" x2="80" y2="376" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F0D060" stopOpacity="0.92"/>
          <stop offset="30%"  stopColor="#D4B050" stopOpacity="0.72"/>
          <stop offset="70%"  stopColor="#C9A84C" stopOpacity="0.54"/>
          <stop offset="100%" stopColor="#7A5818" stopOpacity="0.26"/>
        </linearGradient>
        <linearGradient id="sx2-bell" x1="188" y1="278" x2="76" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F0D060" stopOpacity="0.88"/>
          <stop offset="60%"  stopColor="#C9A84C" stopOpacity="0.58"/>
          <stop offset="100%" stopColor="#8A6420" stopOpacity="0.20"/>
        </linearGradient>
        <linearGradient id="sx2-neck" x1="166" y1="12" x2="110" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F5DC70" stopOpacity="0.92"/>
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.62"/>
        </linearGradient>
        <filter id="sx2-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sx2-pad" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── BODY + BELL GLOW ── */}
      <path d="M116,74 Q112,140 110,210 Q108,268 112,308 Q118,340 134,358 Q150,376 168,370 Q184,362 188,338 Q192,312 182,290 Q174,270 158,264"
        stroke="rgba(201,168,76,0.18)" strokeWidth="26" fill="none" strokeLinecap="round" filter="url(#sx2-glow)"/>

      {/* ── FILLED BODY SILHOUETTE (tube cross-section area) ── */}
      <path d="M120,74 Q118,140 116,210 Q114,268 116,308 Q122,342 136,360 Q152,378 170,372 Q188,364 192,338 Q196,312 184,288 Q176,270 160,264 L158,270 Q172,278 178,300 Q184,322 180,342 Q176,362 162,370 Q146,376 132,364 Q118,350 112,318 Q106,292 106,252 L104,210 Q102,150 104,90 L108,74 Z"
        fill="rgba(201,168,76,0.068)"/>

      {/* ── OUTER BODY — right side (lit, facing spotlight) ── */}
      <path d="M118,74 Q116,140 114,210 Q112,268 114,308 Q120,342 136,360 Q154,378 172,370 Q188,360 190,336 Q194,310 182,288 Q174,270 158,264"
        stroke="url(#sx2-body)" strokeWidth="3.0" fill="none" strokeLinecap="round"/>
      {/* Body specular highlight streak */}
      <path d="M180,82 Q188,182 182,288" stroke="rgba(255,244,140,0.24)" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M176,78 Q184,178 178,282" stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" strokeLinecap="round"/>

      {/* ── INNER BODY — left side (shadow) ── */}
      <path d="M102,74 Q100,140 98,210 Q96,268 100,308 Q106,342 120,360 Q136,376 152,372"
        stroke="rgba(201,168,76,0.40)" strokeWidth="2.0" fill="none" strokeLinecap="round"/>

      {/* ── BELL ── the most dramatic recognizable feature */}
      {/* Bell filled silhouette */}
      <path d="M158,264 Q142,252 124,252 Q104,252 88,266 Q68,282 66,308 Q64,336 80,356 Q96,376 124,380 Q152,382 170,364 Q186,346 186,318 Q186,298 174,280 Q168,270 158,264 L158,270 Q166,278 172,294 Q178,314 176,336 Q172,356 158,368 Q142,378 118,376 Q92,372 78,352 Q66,332 68,308 Q70,286 86,272 Q100,260 122,258 Q140,256 156,270 Z"
        fill="rgba(201,168,76,0.065)"/>
      {/* Bell outer stroke */}
      <path d="M158,264 Q142,252 124,252 Q104,252 88,266 Q68,282 66,308 Q64,336 80,356 Q96,376 124,380 Q152,382 170,364 Q186,346 186,318 Q186,298 174,280 Q168,270 158,264"
        stroke="url(#sx2-bell)" strokeWidth="2.8" fill="none"/>
      {/* Bell inner rim */}
      <path d="M68,304 Q66,328 78,350 Q92,374 122,378 Q150,380 168,362 Q182,348 182,320"
        stroke="rgba(201,168,76,0.34)" strokeWidth="1.6" fill="none"/>
      {/* Bell opening glow + specular */}
      <ellipse cx="126" cy="378" rx="48" ry="9" stroke="rgba(201,168,76,0.18)" strokeWidth="7" filter="url(#sx2-glow)"/>
      <path d="M184,296 Q192,318 186,344" stroke="rgba(255,244,130,0.52)" strokeWidth="1.6" strokeLinecap="round"/>

      {/* ── NECK ── */}
      {/* Neck fill (tube between mouthpiece and body) */}
      <path d="M120,74 Q116,56 118,40 Q120,26 130,18 L140,10 L126,14 Q116,22 108,34 Q102,46 104,62 L106,74 Z"
        fill="rgba(201,168,76,0.08)"/>
      {/* Neck right side (lit) */}
      <path d="M120,74 Q116,56 118,40 Q120,26 130,18 L140,10"
        stroke="url(#sx2-neck)" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      {/* Neck left side (shadow) */}
      <path d="M104,74 Q100,58 102,42 Q104,30 114,22 L124,14"
        stroke="rgba(201,168,76,0.50)" strokeWidth="2.0" fill="none" strokeLinecap="round"/>

      {/* ── MOUTHPIECE ── */}
      <path d="M140,10 Q152,7 158,16 L154,32 Q150,24 142,26 L126,32 Q122,36 120,42"
        stroke="rgba(240,215,90,0.90)" strokeWidth="2.6" fill="rgba(201,168,76,0.12)" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Mouthpiece tip specular */}
      <path d="M158,16 Q163,11 158,24" stroke="rgba(255,250,160,0.55)" strokeWidth="1.0" strokeLinecap="round"/>

      {/* ── OCTAVE / REGISTER KEY (distinctive sax feature) ── */}
      <ellipse cx="116" cy="65" rx="9" ry="7" fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.72)" strokeWidth="1.8"/>
      <ellipse cx="116" cy="65" rx="4.5" ry="3.5" stroke="rgba(240,212,90,0.52)" strokeWidth="1.0"/>
      <line x1="108" y1="66" x2="98" y2="74" stroke="rgba(201,168,76,0.50)" strokeWidth="1.4" strokeLinecap="round"/>

      {/* ── KEY PADS — left column (facing viewer, most visible) ── */}
      {leftPads.map((y, i) => {
        const t = 1 - i / leftPads.length
        const op = 0.55 + t * 0.28
        return (
          <g key={i}>
            {i < 4 && <ellipse cx="76" cy={y + 5} rx="15" ry="11" stroke="rgba(201,168,76,0.10)" strokeWidth="7" filter="url(#sx2-pad)"/>}
            <line x1="104" y1={y} x2="89" y2={y + 5} stroke="rgba(201,168,76,0.34)" strokeWidth="1.4" strokeLinecap="round"/>
            <ellipse cx="76" cy={y + 5} rx="13" ry="10" fill="rgba(201,168,76,0.08)" stroke={`rgba(201,168,76,${op})`} strokeWidth="1.7"/>
            <ellipse cx="76" cy={y + 5} rx="7" ry="5.5" stroke={`rgba(220,188,78,${op * 0.62})`} strokeWidth="1.0"/>
          </g>
        )
      })}

      {/* ── KEY PADS — right column ── */}
      {rightPads.map((y, i) => {
        const t = 1 - i / rightPads.length
        const op = 0.54 + t * 0.28
        return (
          <g key={i}>
            <line x1="116" y1={y} x2="130" y2={y + 2} stroke="rgba(201,168,76,0.36)" strokeWidth="1.3" strokeLinecap="round"/>
            <ellipse cx="140" cy={y + 4} rx="11" ry="8" fill="rgba(201,168,76,0.08)" stroke={`rgba(201,168,76,${op})`} strokeWidth="1.5"/>
          </g>
        )
      })}

      {/* ── THUMB REST ── */}
      <rect x="112" y="200" width="18" height="10" rx="4"
        fill="rgba(201,168,76,0.14)" stroke="rgba(201,168,76,0.50)" strokeWidth="1.5"/>

      {/* ── BOW SPECULAR ── */}
      <path d="M156,266 Q174,284 180,312" stroke="rgba(255,244,130,0.34)" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Violin ───────────────────────────────────────────────────────────────────
function Violin() {
  const g = 'rgba(201,168,76,'
  return (
    <svg viewBox="0 0 128 340" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={`M56,12 Q68,4 76,16 Q84,28 72,36 Q61,42 52,30 Q44,18 57,12`}
        stroke={`${g}0.50)`} strokeWidth="1.6" fill="none" />
      <circle cx="62" cy="20" r="5" stroke={`${g}0.38)`} strokeWidth="1.2" />
      <rect x="50" y="36" width="28" height="50" rx="4" stroke={`${g}0.52)`} strokeWidth="1.8" />
      <line x1="50" y1="48" x2="36" y2="44" stroke={`${g}0.45)`} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="50" y1="64" x2="36" y2="60" stroke={`${g}0.45)`} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="78" y1="48" x2="92" y2="44" stroke={`${g}0.45)`} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="78" y1="64" x2="92" y2="60" stroke={`${g}0.45)`} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="50" y1="86" x2="78" y2="86" stroke={`${g}0.55)`} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="86" x2="44" y2="116" stroke={`${g}0.48)`} strokeWidth="1.8" />
      <line x1="78" y1="86" x2="84" y2="116" stroke={`${g}0.48)`} strokeWidth="1.8" />
      <path d={`M44,116 Q12,128 10,156 Q10,178 64,182`} stroke={`${g}0.55)`} strokeWidth="2" fill="none" />
      <path d={`M84,116 Q116,128 118,156 Q118,178 64,182`} stroke={`${g}0.55)`} strokeWidth="2" fill="none" />
      <path d={`M10,156 Q20,174 10,192`} stroke={`${g}0.55)`} strokeWidth="2" fill="none" />
      <path d={`M118,156 Q108,174 118,192`} stroke={`${g}0.55)`} strokeWidth="2" fill="none" />
      <path d={`M10,192 Q8,238 64,244`} stroke={`${g}0.55)`} strokeWidth="2" fill="none" />
      <path d={`M118,192 Q120,238 64,244`} stroke={`${g}0.55)`} strokeWidth="2" fill="none" />
      <path d={`M18,244 Q64,258 110,244`} stroke={`${g}0.50)`} strokeWidth="2" />
      <path d={`M38,144 Q30,158 34,172`} stroke={`${g}0.48)`} strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M90,144 Q98,158 94,172`} stroke={`${g}0.48)`} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="32" cy="146" r="3.5" stroke={`${g}0.42)`} strokeWidth="1.4" />
      <circle cx="32" cy="174" r="3.5" stroke={`${g}0.42)`} strokeWidth="1.4" />
      <circle cx="96" cy="146" r="3.5" stroke={`${g}0.42)`} strokeWidth="1.4" />
      <circle cx="96" cy="174" r="3.5" stroke={`${g}0.42)`} strokeWidth="1.4" />
      <path d={`M40,210 Q64,200 88,210`} stroke={`${g}0.50)`} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="42" y1="210" x2="46" y2="220" stroke={`${g}0.40)`} strokeWidth="1.5" />
      <line x1="86" y1="210" x2="82" y2="220" stroke={`${g}0.40)`} strokeWidth="1.5" />
      <path d={`M44,242 L84,242 L80,256 L48,256 Z`} stroke={`${g}0.42)`} strokeWidth="1.5" />
      <path d={`M44,250 Q64,260 84,250 Q86,264 64,268 Q42,264 44,250`} stroke={`${g}0.35)`} strokeWidth="1.2" />
      {[55,60,68,73].map(x => (
        <line key={x} x1={x} y1="86" x2={x} y2="256" stroke={`${g}0.20)`} strokeWidth="0.9" />
      ))}
      <circle cx="64" cy="260" r="4" stroke={`${g}0.38)`} strokeWidth="1.3" />
    </svg>
  )
}

// ─── Flute ────────────────────────────────────────────────────────────────────
function Flute() {
  const g = 'rgba(201,168,76,'
  const keys = [92, 118, 144, 170, 198, 224, 252, 280, 308, 336, 364, 392]
  return (
    <svg viewBox="0 0 440 68" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="22" y1="20" x2="414" y2="20" stroke={`${g}0.55)`} strokeWidth="2.2" />
      <line x1="22" y1="36" x2="414" y2="36" stroke={`${g}0.55)`} strokeWidth="2.2" />
      <path d={`M22,18 Q8,18 8,28 Q8,40 22,40`} stroke={`${g}0.52)`} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={`M414,19 Q428,19 432,28 Q428,39 414,39`} stroke={`${g}0.45)`} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="44" y="16" width="30" height="22" rx="4" stroke={`${g}0.44)`} strokeWidth="1.4" />
      <ellipse cx="59" cy="28" rx="9" ry="6" stroke={`${g}0.52)`} strokeWidth="1.6" />
      <ellipse cx="59" cy="28" rx="5" ry="3" stroke={`${g}0.28)`} strokeWidth="0.8" />
      <line x1="92" y1="16" x2="392" y2="16" stroke={`${g}0.20)`} strokeWidth="0.9" />
      <line x1="92" y1="40" x2="392" y2="40" stroke={`${g}0.20)`} strokeWidth="0.9" />
      {keys.map((x, i) => (
        <g key={i}>
          <line x1={x} y1="20" x2={x} y2="13" stroke={`${g}0.38)`} strokeWidth="1.2" />
          <line x1={x} y1="36" x2={x} y2="43" stroke={`${g}0.38)`} strokeWidth="1.2" />
          <circle cx={x} cy="28" r="8.5" stroke={`${g}0.46)`} strokeWidth="1.4" />
          <circle cx={x} cy="28" r="4.5" stroke={`${g}0.26)`} strokeWidth="0.8" />
          <circle cx={x} cy="28" r="1.5" stroke={`${g}0.30)`} strokeWidth="0.7" />
        </g>
      ))}
      <line x1="148" y1="17" x2="148" y2="39" stroke={`${g}0.35)`} strokeWidth="2.2" />
      <line x1="152" y1="17" x2="152" y2="39" stroke={`${g}0.22)`} strokeWidth="1" />
      <line x1="285" y1="17" x2="285" y2="39" stroke={`${g}0.35)`} strokeWidth="2.2" />
      <line x1="289" y1="17" x2="289" y2="39" stroke={`${g}0.22)`} strokeWidth="1" />
    </svg>
  )
}

// ─── Spotlight cone ───────────────────────────────────────────────────────────
function SpotlightCone({ width = '120%', left = '-10%', brightness = 1 }: {
  width?: string; left?: string; brightness?: number
}) {
  const op1 = (0.11 * brightness).toFixed(2)
  const op2 = (0.04 * brightness).toFixed(2)
  return (
    <div aria-hidden className="absolute pointer-events-none" style={{
      top: '-110%', left, width, height: '200%',
      background: `radial-gradient(ellipse 60% 55% at 50% 0%, rgba(201,168,76,${op1}) 0%, rgba(201,168,76,${op2}) 40%, transparent 70%)`,
    }} />
  )
}

// ─── Full backdrop ────────────────────────────────────────────────────────────
export default function InstrumentBackdrop() {
  const [hovered, setHovered] = useState<string | null>(null)

  const pianoPlaying = {
    y: [0, -10, -2, -12, -4, -8, 0],
    rotate: ['-4deg', '-5deg', '-3.5deg', '-5.2deg', '-3.8deg', '-4.5deg', '-4deg'],
  }
  const saxPlaying = {
    y: [-5, -14, -3, -16, -5, -12, -5],
    rotate: ['4deg', '9deg', '2.5deg', '10deg', '3.5deg', '8deg', '4deg'],
  }
  const violinPlaying = {
    y: [-3, -11, 0, -13, -1, -9, -3],
    rotate: ['-10deg', '-5deg', '-15deg', '-6deg', '-14deg', '-7deg', '-10deg'],
  }
  const flutePlaying = {
    y: [-2, 5, -5, 4, -4, 5, -2],
    x: [-1, 4, -4, 3, -5, 3, -1],
    rotate: ['-8deg', '-7deg', '-9.5deg', '-7deg', '-9deg', '-7.5deg', '-8deg'],
  }

  return (
    <div className="absolute inset-0 overflow-hidden select-none" aria-hidden style={{ pointerEvents: 'none' }}>

      {/* Grand Piano — bottom-left */}
      <motion.div
        className="absolute"
        style={{ bottom: '-8%', left: '-8%', width: 460, pointerEvents: 'auto', cursor: 'pointer' }}
        animate={hovered === 'piano' ? pianoPlaying : { y: [-4, 5, -4], rotate: ['-4deg', '-3deg', '-4deg'] }}
        transition={hovered === 'piano'
          ? { duration: 0.44, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
          : { duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
        onMouseEnter={() => setHovered('piano')}
        onMouseLeave={() => setHovered(null)}
      >
        <SpotlightCone width="130%" left="-15%" brightness={2.8} />
        <GrandPiano />
      </motion.div>

      {/* Saxophone — right edge */}
      <motion.div
        className="absolute"
        style={{ top: '10%', right: '3%', width: 152, pointerEvents: 'auto', cursor: 'pointer' }}
        animate={hovered === 'sax' ? saxPlaying : { y: [-5, 6, -5], rotate: ['4deg', '5.5deg', '4deg'] }}
        transition={hovered === 'sax'
          ? { duration: 0.38, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
          : { duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2.8 }}
        onMouseEnter={() => setHovered('sax')}
        onMouseLeave={() => setHovered(null)}
      >
        <SpotlightCone width="180%" left="-40%" brightness={2.2} />
        <Saxophone />
      </motion.div>

      {/* Violin — upper-right */}
      <motion.div
        className="absolute"
        style={{ top: '5%', right: '22%', width: 94, pointerEvents: 'auto', cursor: 'pointer' }}
        animate={hovered === 'violin' ? violinPlaying : { y: [-3, 5, -3], rotate: ['-10deg', '-8.5deg', '-10deg'] }}
        transition={hovered === 'violin'
          ? { duration: 0.32, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
          : { duration: 9.5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
        onMouseEnter={() => setHovered('violin')}
        onMouseLeave={() => setHovered(null)}
      >
        <SpotlightCone width="200%" left="-50%" brightness={1} />
        <Violin />
      </motion.div>

      {/* Flute — upper area */}
      <motion.div
        className="absolute"
        style={{ top: '21%', left: '7%', width: 390, pointerEvents: 'auto', cursor: 'pointer' }}
        animate={hovered === 'flute' ? flutePlaying : { y: [-2, 4, -2], rotate: ['-8deg', '-6.5deg', '-8deg'] }}
        transition={hovered === 'flute'
          ? { duration: 0.28, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
          : { duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 4.2 }}
        onMouseEnter={() => setHovered('flute')}
        onMouseLeave={() => setHovered(null)}
      >
        <SpotlightCone width="110%" left="-5%" brightness={1} />
        <Flute />
      </motion.div>

      {/* Stage floor */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
        height: '35%',
        background: 'linear-gradient(to top, rgba(201,168,76,0.028) 0%, transparent 100%)',
      }} />
      <div className="absolute left-0 right-0 pointer-events-none" style={{
        bottom: '30%', height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.10) 25%, rgba(201,168,76,0.14) 50%, rgba(201,168,76,0.10) 75%, transparent 100%)',
      }} />
    </div>
  )
}

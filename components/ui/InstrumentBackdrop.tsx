'use client'

import { motion } from 'framer-motion'

// ─── Grand Piano ──────────────────────────────────────────────────────────────
// Light source: top-right (stage spotlight). Lid top face = brightest.
// Body right/upper = mid-light. Left edge / legs = shadow.
function GrandPiano() {
  return (
    <svg viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Lid: bright at the top-right open end, dims toward bottom-left */}
        <linearGradient id="gp-lid" x1="390" y1="-20" x2="60" y2="225" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F0D060" stopOpacity="0.95"/>
          <stop offset="30%"  stopColor="#C9A84C" stopOpacity="0.78"/>
          <stop offset="70%"  stopColor="#C9A84C" stopOpacity="0.50"/>
          <stop offset="100%" stopColor="#8A6C2A" stopOpacity="0.22"/>
        </linearGradient>
        {/* Open lid prop panel */}
        <linearGradient id="gp-lid-top" x1="295" y1="22" x2="185" y2="148" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F5DC70" stopOpacity="0.88"/>
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.45"/>
        </linearGradient>
        {/* Curved body: top is lit, bottom fades to shadow */}
        <linearGradient id="gp-body" x1="185" y1="60" x2="28" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#D4B050" stopOpacity="0.80"/>
          <stop offset="45%"  stopColor="#C9A84C" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#7A5A1A" stopOpacity="0.20"/>
        </linearGradient>
        {/* Keyboard: faces upward = well lit */}
        <linearGradient id="gp-keys" x1="22" y1="252" x2="164" y2="252" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#C9A84C" stopOpacity="0.45"/>
          <stop offset="50%"  stopColor="#E8C860" stopOpacity="0.70"/>
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.45"/>
        </linearGradient>
        {/* Glow bloom filter */}
        <filter id="gp-bloom" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="gp-soft" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── BLOOM layer (gives glowing halo around lit areas) ── */}
      <path d={`M60,220 L60,80 Q62,48 98,38 L295,22 Q345,20 354,58 Q362,88 350,118 Q338,146 315,158 Q288,170 258,162 L185,148`}
        stroke="#E8C84C" strokeWidth="10" strokeLinejoin="round" strokeOpacity="0.18" filter="url(#gp-bloom)" />
      <path d={`M295,22 L390,-18`} stroke="#F0D060" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.22" filter="url(#gp-bloom)" />
      <rect x="22" y="252" width="142" height="22" rx="3" stroke="#E8C84C" strokeWidth="7" strokeOpacity="0.15" filter="url(#gp-soft)" />

      {/* ── MAIN STRUCTURE ── */}
      {/* Lid outline — gradient: bright where spotlight hits the raised lid */}
      <path d={`M60,220 L60,80 Q62,48 98,38 L295,22 Q345,20 354,58 Q362,88 350,118 Q338,146 315,158 Q288,170 258,162 L185,148`}
        stroke="url(#gp-lid)" strokeWidth="2.4" strokeLinejoin="round" />

      {/* Open lid panel (the face catching the most light) */}
      <path d={`M295,22 L390,-18`} stroke="#F0D060" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.92" />
      <path d={`M185,148 L292,100`} stroke="url(#gp-lid-top)" strokeWidth="2.0" strokeLinecap="round" />

      {/* Lid brace dashed */}
      <path d="M228,22 L295,2" stroke="#C9A84C" strokeWidth="1.3" strokeDasharray="6,5" strokeLinecap="round" strokeOpacity="0.35"/>

      {/* Curved body side — lit at top, shadow at bottom */}
      <path d={`M60,80 Q30,90 22,130 Q14,168 28,204 Q44,240 80,252 L185,262 L185,148`}
        stroke="url(#gp-body)" strokeWidth="2.4" fill="none" />
      {/* Back straight edge — facing away from light → darker */}
      <line x1="60" y1="80" x2="60" y2="220" stroke="#C9A84C" strokeWidth="2.2" strokeOpacity="0.32"/>
      {/* Bottom edge */}
      <path d="M28,252 Q56,268 80,270 L185,278 L185,262" stroke="#C9A84C" strokeWidth="2" strokeOpacity="0.40"/>

      {/* ── SPECULAR HIGHLIGHT on lid rim (very thin, very bright) ── */}
      <path d={`M98,38 L295,22 Q345,20 354,58`}
        stroke="#FFF0A0" strokeWidth="0.9" strokeOpacity="0.55" strokeLinejoin="round"/>
      {/* Specular on open lid edge */}
      <path d={`M295,22 L390,-18`} stroke="#FFFFFF" strokeWidth="0.7" strokeLinecap="round" strokeOpacity="0.35"/>

      {/* ── KEYBOARD (faces upward → good light) ── */}
      <rect x="22" y="252" width="142" height="22" rx="3" stroke="url(#gp-keys)" strokeWidth="1.8"/>
      {/* Key dividers */}
      {Array.from({ length: 14 }).map((_, i) => (
        <line key={i} x1={30 + i * 10} y1="252" x2={30 + i * 10} y2="274"
          stroke="#C9A84C" strokeWidth="0.8" strokeOpacity={i < 7 ? 0.50 : 0.35}/>
      ))}
      {/* Black keys — lit on top face */}
      {[0,1,3,4,5,7,8,10,11,12].map(i => (
        <rect key={i} x={26 + i * 10} y="252" width="7" height="13" rx="1.5"
          stroke="#D4B050" strokeWidth="1.1" strokeOpacity={i < 7 ? 0.62 : 0.45}/>
      ))}

      {/* ── PEDALS (in shadow below, darker) ── */}
      <ellipse cx="80"  cy="310" rx="8" ry="4" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.32"/>
      <ellipse cx="105" cy="310" rx="8" ry="4" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.32"/>
      <ellipse cx="130" cy="310" rx="8" ry="4" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.32"/>
      <line x1="80"  y1="274" x2="80"  y2="310" stroke="#C9A84C" strokeWidth="1.8" strokeOpacity="0.28"/>
      <line x1="105" y1="274" x2="105" y2="310" stroke="#C9A84C" strokeWidth="1.8" strokeOpacity="0.28"/>
      <line x1="130" y1="274" x2="130" y2="310" stroke="#C9A84C" strokeWidth="1.8" strokeOpacity="0.28"/>

      {/* ── LEGS ── */}
      {/* Front-left leg: partially lit */}
      <line x1="36"  y1="274" x2="30"  y2="308" stroke="#C9A84C" strokeWidth="3.2" strokeLinecap="round" strokeOpacity="0.50"/>
      {/* Front-right leg: more lit */}
      <line x1="164" y1="274" x2="168" y2="308" stroke="#D4B050" strokeWidth="3.2" strokeLinecap="round" strokeOpacity="0.60"/>
      {/* Back leg: in shadow */}
      <line x1="272" y1="168" x2="280" y2="200" stroke="#C9A84C" strokeWidth="3"   strokeLinecap="round" strokeOpacity="0.38"/>

      {/* ── BODY SHEEN (reflected light on curved surface) ── */}
      <path d="M55,96 Q38,140 42,206" stroke="#E8C84C" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.28"/>
      <path d="M68,94 Q52,136 54,200" stroke="#F0D060" strokeWidth="0.6" strokeLinecap="round" strokeOpacity="0.18"/>
    </svg>
  )
}

// ─── Alto Saxophone ───────────────────────────────────────────────────────────
// Light source: top-right. Outer right curve = brightest.
// Inner left curve = shadow. Keys on lit side brighter. Bell rim = bright.
function Saxophone() {
  return (
    <svg viewBox="0 0 190 420" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Outer body: right curve faces light → bright at top-right, dark at bottom-left */}
        <linearGradient id="sx-outer" x1="192" y1="80" x2="86" y2="370" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F0D060" stopOpacity="0.92"/>
          <stop offset="25%"  stopColor="#D4B050" stopOpacity="0.78"/>
          <stop offset="60%"  stopColor="#C9A84C" stopOpacity="0.58"/>
          <stop offset="100%" stopColor="#8A6820" stopOpacity="0.28"/>
        </linearGradient>
        {/* Inner body: in shadow */}
        <linearGradient id="sx-inner" x1="104" y1="90" x2="94" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#C9A84C" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#8A6820" stopOpacity="0.12"/>
        </linearGradient>
        {/* Bell: bright at opening rim, dims inside curve */}
        <linearGradient id="sx-bell" x1="192" y1="276" x2="84" y2="365" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F0D060" stopOpacity="0.85"/>
          <stop offset="50%"  stopColor="#C9A84C" stopOpacity="0.58"/>
          <stop offset="100%" stopColor="#8A6820" stopOpacity="0.22"/>
        </linearGradient>
        {/* Neck: upper area, well lit */}
        <linearGradient id="sx-neck" x1="168" y1="12" x2="112" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F5DC70" stopOpacity="0.88"/>
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.55"/>
        </linearGradient>
        {/* Bloom glow */}
        <filter id="sx-bloom" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sx-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── BLOOM layer ── */}
      <path d={`M112,78 Q108,100 104,138 Q100,178 98,220 Q96,268 98,306 Q102,340 120,360 Q148,380 168,368 Q190,354 192,328 Q194,300 178,276`}
        stroke="#E8C84C" strokeWidth="12" fill="none" strokeLinecap="round" strokeOpacity="0.16" filter="url(#sx-bloom)"/>
      <path d={`M178,276 Q168,260 150,258 Q126,256 108,268 Q88,282 86,306 Q84,330 100,346 Q116,362 142,362`}
        stroke="#E8C84C" strokeWidth="10" fill="none" strokeOpacity="0.18" filter="url(#sx-bloom)"/>
      <path d={`M148,12 Q162,10 168,22 L158,36 Q152,28 142,32 L130,48`}
        stroke="#F0D060" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.20" filter="url(#sx-soft)"/>

      {/* ── MOUTHPIECE + NECK ── */}
      <path d={`M148,12 Q162,10 168,22 L158,36 Q152,28 142,32 L130,48`}
        stroke="url(#sx-neck)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={`M130,48 Q118,60 112,78`}
        stroke="url(#sx-neck)" strokeWidth="2.6" strokeLinecap="round" fill="none"/>

      {/* ── SPECULAR on mouthpiece tip ── */}
      <path d={`M158,20 Q164,14 168,22`} stroke="#FFF0A0" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.60"/>

      {/* ── OUTER BODY (right convex side — faces the spotlight) ── */}
      <path d={`M112,78 Q108,100 104,138 Q100,178 98,220 Q96,268 98,306 Q102,340 120,360 Q148,380 168,368 Q190,354 192,328 Q194,300 178,276`}
        stroke="url(#sx-outer)" strokeWidth="2.6" fill="none" strokeLinecap="round"/>

      {/* ── SPECULAR HIGHLIGHT on outer edge (very thin, very bright) ── */}
      <path d={`M113,85 Q110,115 107,160 Q104,210 103,255 Q103,295 110,328 Q122,358 148,372`}
        stroke="#FFF0A0" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.42"/>

      {/* ── INNER BODY (left concave side — in shadow) ── */}
      <path d={`M104,90 Q100,128 96,176 Q92,230 94,284 Q96,320 112,344 Q136,368 158,360`}
        stroke="url(#sx-inner)" strokeWidth="1.6" fill="none" strokeLinecap="round"/>

      {/* ── BELL (opening faces down-left, rim catches light on right) ── */}
      <path d={`M178,276 Q168,260 150,258 Q126,256 108,268 Q88,282 86,306 Q84,330 100,346 Q116,362 142,362`}
        stroke="url(#sx-bell)" strokeWidth="2.4" fill="none"/>
      {/* Bell inner rim (shadow side) */}
      <path d={`M86,300 Q84,318 92,332 Q106,354 134,360 Q156,364 172,354`}
        stroke="#C9A84C" strokeWidth="1.3" fill="none" strokeOpacity="0.35"/>
      {/* Bell rim specular */}
      <path d={`M178,276 Q186,290 190,310`} stroke="#FFF0A0" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.45"/>

      {/* ── KEYS — left column (facing outward/left — partially lit) ── */}
      {[100,126,154,182,210,238,264].map((y, i) => {
        // Keys at top (closer to light) are brighter
        const t = 1 - i / 7
        const padOp = 0.30 + t * 0.30
        const rimOp = 0.45 + t * 0.35
        return (
          <g key={i}>
            {/* Pad glow on brighter keys */}
            {i < 3 && (
              <ellipse cx="80" cy={y + 5} rx="12" ry="9"
                stroke="#E8C84C" strokeWidth="4" strokeOpacity="0.12" filter="url(#sx-soft)"/>
            )}
            <line x1="104" y1={y} x2="88" y2={y + 4} stroke="#C9A84C" strokeWidth="1.1" strokeOpacity={0.30 + t * 0.20}/>
            <ellipse cx="80" cy={y + 5} rx="10" ry="7" stroke="#C9A84C" strokeWidth="1.4" strokeOpacity={rimOp}/>
            <ellipse cx="80" cy={y + 5} rx="5" ry="3.5" stroke="#D4B050" strokeWidth="0.8" strokeOpacity={padOp}/>
          </g>
        )
      })}

      {/* ── KEYS — right column (facing right → more lit) ── */}
      {[108,148,196,244].map((y, i) => {
        const t = 1 - i / 4
        const op = 0.45 + t * 0.35
        return (
          <g key={i}>
            {i < 2 && (
              <ellipse cx="134" cy={y + 3} rx="10" ry="7"
                stroke="#E8C84C" strokeWidth="4" strokeOpacity="0.14" filter="url(#sx-soft)"/>
            )}
            <line x1="110" y1={y} x2="126" y2={y + 2} stroke="#D4B050" strokeWidth="1.1" strokeOpacity={op}/>
            <ellipse cx="134" cy={y + 3} rx="8" ry="5.5" stroke="#D4B050" strokeWidth="1.3" strokeOpacity={op + 0.10}/>
          </g>
        )
      })}

      {/* ── REGISTER KEY on neck ── */}
      <ellipse cx="122" cy="65" rx="7" ry="5" stroke="#D4B050" strokeWidth="1.4" strokeOpacity="0.65"/>
      <ellipse cx="122" cy="65" rx="3.5" ry="2.5" stroke="#F0D060" strokeWidth="0.8" strokeOpacity="0.50"/>
      <line x1="116" y1="65" x2="108" y2="74" stroke="#C9A84C" strokeWidth="1.1" strokeOpacity="0.45"/>

      {/* ── THUMB REST ── */}
      <rect x="114" y="200" width="16" height="8" rx="3" stroke="#C9A84C" strokeWidth="1.2" strokeOpacity="0.40"/>

      {/* ── BODY SHEEN (inner glow reflection on the right face) ── */}
      <path d="M178,100 Q185,180 182,270" stroke="#F0D060" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.20"/>
      <path d="M175,95 Q181,175 178,260" stroke="#FFFFFF" strokeWidth="0.5" strokeLinecap="round" strokeOpacity="0.12"/>
    </svg>
  )
}

// ─── Violin (unchanged — already bright) ─────────────────────────────────────
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

// ─── Flute (unchanged — already bright) ──────────────────────────────────────
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

// ─── Spotlight cone above each instrument ─────────────────────────────────────
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
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>

      {/* Grand Piano — bottom-left, massive — spotlight brightness ×2 */}
      <motion.div className="absolute" style={{ bottom: '-8%', left: '-8%', width: 460 }}
        animate={{ y: [-4, 5, -4], rotate: ['-4deg', '-3deg', '-4deg'] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0 }}>
        <SpotlightCone width="130%" left="-15%" brightness={2.2} />
        <GrandPiano />
      </motion.div>

      {/* Saxophone — right edge — spotlight brightness ×2 */}
      <motion.div className="absolute" style={{ top: '10%', right: '3%', width: 152 }}
        animate={{ y: [-5, 6, -5], rotate: ['4deg', '5.5deg', '4deg'] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2.8 }}>
        <SpotlightCone width="180%" left="-40%" brightness={2.2} />
        <Saxophone />
      </motion.div>

      {/* Violin — upper-right, tilted */}
      <motion.div className="absolute" style={{ top: '5%', right: '22%', width: 94 }}
        animate={{ y: [-3, 5, -3], rotate: ['-10deg', '-8.5deg', '-10deg'] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}>
        <SpotlightCone width="200%" left="-50%" brightness={1} />
        <Violin />
      </motion.div>

      {/* Flute — upper area, diagonal sweep */}
      <motion.div className="absolute" style={{ top: '21%', left: '7%', width: 390 }}
        animate={{ y: [-2, 4, -2], rotate: ['-8deg', '-6.5deg', '-8deg'] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 4.2 }}>
        <SpotlightCone width="110%" left="-5%" brightness={1} />
        <Flute />
      </motion.div>

      {/* Stage floor */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        height: '35%',
        background: 'linear-gradient(to top, rgba(201,168,76,0.028) 0%, transparent 100%)',
      }} />
      <div className="absolute left-0 right-0" style={{
        bottom: '30%', height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.10) 25%, rgba(201,168,76,0.14) 50%, rgba(201,168,76,0.10) 75%, transparent 100%)',
      }} />
    </div>
  )
}

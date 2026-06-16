'use client'

import { motion } from 'framer-motion'

// ─── Grand Piano ──────────────────────────────────────────────────────────────
function GrandPiano() {
  const g = 'rgba(201,168,76,'
  return (
    <svg viewBox="0 0 420 310" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={`M60,220 L60,80 Q62,48 98,38 L295,22 Q345,20 354,58 Q362,88 350,118 Q338,146 315,158 Q288,170 258,162 L185,148`}
        stroke={`${g}0.55)`} strokeWidth="2.2" strokeLinejoin="round" />
      <path d={`M295,22 L390,-18 M185,148 L292,100`} stroke={`${g}0.42)`} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M228,22 L295,2" stroke={`${g}0.25)`} strokeWidth="1.2" strokeDasharray="6,5" strokeLinecap="round" />
      <path d={`M60,80 Q30,90 22,130 Q14,168 28,204 Q44,240 80,252 L185,262 L185,148`}
        stroke={`${g}0.50)`} strokeWidth="2.2" fill="none" />
      <line x1="60" y1="80" x2="60" y2="220" stroke={`${g}0.50)`} strokeWidth="2.2" />
      <path d="M28,252 Q56,268 80,270 L185,278 L185,262" stroke={`${g}0.45)`} strokeWidth="2" />
      <rect x="22" y="252" width="142" height="22" rx="3" stroke={`${g}0.48)`} strokeWidth="1.6" />
      {Array.from({ length: 14 }).map((_, i) => (
        <line key={i} x1={30 + i * 10} y1="252" x2={30 + i * 10} y2="274" stroke={`${g}0.28)`} strokeWidth="0.8" />
      ))}
      {[0,1,3,4,5,7,8,10,11,12].map(i => (
        <rect key={i} x={26 + i * 10} y="252" width="7" height="13" rx="1.5" stroke={`${g}0.40)`} strokeWidth="1" />
      ))}
      <ellipse cx="80"  cy="310" rx="8" ry="4" stroke={`${g}0.30)`} strokeWidth="1.2" />
      <ellipse cx="105" cy="310" rx="8" ry="4" stroke={`${g}0.30)`} strokeWidth="1.2" />
      <ellipse cx="130" cy="310" rx="8" ry="4" stroke={`${g}0.30)`} strokeWidth="1.2" />
      <line x1="80"  y1="274" x2="80"  y2="310" stroke={`${g}0.28)`} strokeWidth="1.8" />
      <line x1="105" y1="274" x2="105" y2="310" stroke={`${g}0.28)`} strokeWidth="1.8" />
      <line x1="130" y1="274" x2="130" y2="310" stroke={`${g}0.28)`} strokeWidth="1.8" />
      <line x1="36"  y1="274" x2="30"  y2="308" stroke={`${g}0.40)`} strokeWidth="3" strokeLinecap="round" />
      <line x1="164" y1="274" x2="168" y2="308" stroke={`${g}0.40)`} strokeWidth="3" strokeLinecap="round" />
      <line x1="272" y1="168" x2="280" y2="200" stroke={`${g}0.40)`} strokeWidth="3" strokeLinecap="round" />
      <path d="M40,100 Q25,140 32,200" stroke={`${g}0.15)`} strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

// ─── Alto Saxophone ───────────────────────────────────────────────────────────
function Saxophone() {
  const g = 'rgba(201,168,76,'
  return (
    <svg viewBox="0 0 190 420" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={`M148,12 Q162,10 168,22 L158,36 Q152,28 142,32 L130,48`}
        stroke={`${g}0.52)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M130,48 Q118,60 112,78`} stroke={`${g}0.52)`} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d={`M112,78 Q108,100 104,138 Q100,178 98,220 Q96,268 98,306 Q102,340 120,360 Q148,380 168,368 Q190,354 192,328 Q194,300 178,276`}
        stroke={`${g}0.55)`} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d={`M104,90 Q100,128 96,176 Q92,230 94,284 Q96,320 112,344 Q136,368 158,360`}
        stroke={`${g}0.30)`} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d={`M178,276 Q168,260 150,258 Q126,256 108,268 Q88,282 86,306 Q84,330 100,346 Q116,362 142,362`}
        stroke={`${g}0.52)`} strokeWidth="2.2" fill="none" />
      <path d={`M86,300 Q84,318 92,332 Q106,354 134,360 Q156,364 172,354`}
        stroke={`${g}0.32)`} strokeWidth="1.2" fill="none" />
      {[100,126,154,182,210,238,264].map((y, i) => (
        <g key={i}>
          <line x1="104" y1={y} x2="88" y2={y + 4} stroke={`${g}0.35)`} strokeWidth="1" />
          <ellipse cx="80" cy={y + 5} rx="10" ry="7" stroke={`${g}0.42)`} strokeWidth="1.2" />
          <ellipse cx="80" cy={y + 5} rx="5" ry="3.5" stroke={`${g}0.22)`} strokeWidth="0.7" />
        </g>
      ))}
      {[108,148,196,244].map((y, i) => (
        <g key={i}>
          <line x1="110" y1={y} x2="126" y2={y + 2} stroke={`${g}0.30)`} strokeWidth="1" />
          <ellipse cx="134" cy={y + 3} rx="8" ry="5.5" stroke={`${g}0.36)`} strokeWidth="1.1" />
        </g>
      ))}
      <ellipse cx="122" cy="65" rx="7" ry="5" stroke={`${g}0.38)`} strokeWidth="1.2" />
      <line x1="116" y1="65" x2="108" y2="74" stroke={`${g}0.30)`} strokeWidth="1" />
      <rect x="114" y="200" width="16" height="8" rx="3" stroke={`${g}0.32)`} strokeWidth="1.1" />
      <path d="M109,92 Q106,150 103,230" stroke={`${g}0.14)`} strokeWidth="1" strokeLinecap="round" />
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
function SpotlightCone({ width = '120%', left = '-10%' }: { width?: string; left?: string }) {
  return (
    <div aria-hidden className="absolute pointer-events-none" style={{
      top: '-110%', left, width, height: '200%',
      background: 'radial-gradient(ellipse 60% 55% at 50% 0%, rgba(201,168,76,0.11) 0%, rgba(201,168,76,0.04) 40%, transparent 70%)',
    }} />
  )
}

// ─── Exported backdrop ────────────────────────────────────────────────────────
export default function InstrumentBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>

      {/* Grand Piano — bottom-left, massive */}
      <motion.div className="absolute" style={{ bottom: '-8%', left: '-8%', width: 460 }}
        animate={{ y: [-4, 5, -4], rotate: ['-4deg', '-3deg', '-4deg'] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0 }}>
        <SpotlightCone width="130%" left="-15%" />
        <GrandPiano />
      </motion.div>

      {/* Saxophone — right edge */}
      <motion.div className="absolute" style={{ top: '10%', right: '3%', width: 152 }}
        animate={{ y: [-5, 6, -5], rotate: ['4deg', '5.5deg', '4deg'] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2.8 }}>
        <SpotlightCone width="180%" left="-40%" />
        <Saxophone />
      </motion.div>

      {/* Violin — upper-right, tilted */}
      <motion.div className="absolute" style={{ top: '5%', right: '22%', width: 94 }}
        animate={{ y: [-3, 5, -3], rotate: ['-10deg', '-8.5deg', '-10deg'] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}>
        <SpotlightCone width="200%" left="-50%" />
        <Violin />
      </motion.div>

      {/* Flute — upper area, diagonal sweep */}
      <motion.div className="absolute" style={{ top: '21%', left: '7%', width: 390 }}
        animate={{ y: [-2, 4, -2], rotate: ['-8deg', '-6.5deg', '-8deg'] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 4.2 }}>
        <SpotlightCone width="110%" left="-5%" />
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

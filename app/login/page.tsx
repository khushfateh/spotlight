'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'
import { mockUsers } from '@/lib/mock-data/users'

const ease = [0.16, 1, 0.3, 1] as const

// ── Instrument SVGs (gold line-art, stroke only) ──────────────────────────────

function GrandPiano({ opacity = 0.45 }: { opacity?: number }) {
  const s = `rgba(201,168,76,${opacity})`
  return (
    <svg viewBox="0 0 230 195" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <path
        d="M14,165 L14,50 Q14,20 44,13 L152,9 Q196,9 202,44 Q208,66 198,92 Q186,115 164,124 Q140,132 118,124 L88,116 L88,165 Z"
        stroke={s} strokeWidth="1.8" strokeLinejoin="round"
      />
      {/* Open lid */}
      <line x1="152" y1="9" x2="220" y2="-26" stroke={s} strokeWidth="2" strokeLinecap="round" />
      {/* Lid prop (dashed) */}
      <line x1="105" y1="9" x2="162" y2="-14" stroke={s} strokeWidth="1" strokeLinecap="round" strokeDasharray="5 4" />
      {/* Keyboard housing */}
      <rect x="14" y="148" width="74" height="17" rx="2" stroke={s} strokeWidth="1.3" />
      {/* White key dividers */}
      {[0,1,2,3,4,5,6].map(i => (
        <line key={i} x1={24 + i * 10} y1="148" x2={24 + i * 10} y2="165" stroke={s} strokeWidth="0.6" />
      ))}
      {/* Black keys (suggestion) */}
      {[0,1,3,4,5].map(i => (
        <rect key={i} x={20 + i * 10} y="148" width="6" height="10" rx="1" stroke={s} strokeWidth="0.7" />
      ))}
      {/* Legs */}
      <line x1="24"  y1="165" x2="20"  y2="188" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="76"  y1="165" x2="76"  y2="188" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="192" y1="122" x2="196" y2="145" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
      {/* Pedals */}
      <line x1="40" y1="188" x2="37" y2="196" stroke={s} strokeWidth="1" strokeLinecap="round" />
      <line x1="50" y1="188" x2="50" y2="196" stroke={s} strokeWidth="1" strokeLinecap="round" />
      <line x1="60" y1="188" x2="63" y2="196" stroke={s} strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function TrumpetInstrument({ opacity = 0.42 }: { opacity?: number }) {
  const s = `rgba(201,168,76,${opacity})`
  return (
    <svg viewBox="0 0 285 115" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mouthpiece */}
      <path d="M8,58 L8,53 L30,52 L30,64 L8,63 Z" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Lead pipe */}
      <line x1="30" y1="58" x2="64" y2="58" stroke={s} strokeWidth="2.2" strokeLinecap="round" />
      {/* Valve block */}
      <rect x="64" y="38" width="54" height="40" rx="4" stroke={s} strokeWidth="1.6" />
      {/* Piston tops */}
      <rect x="68" y="32" width="13" height="9" rx="3" stroke={s} strokeWidth="1.3" />
      <rect x="86" y="32" width="13" height="9" rx="3" stroke={s} strokeWidth="1.3" />
      <rect x="104" y="32" width="13" height="9" rx="3" stroke={s} strokeWidth="1.3" />
      <circle cx="74"  cy="32" r="2.5" stroke={s} strokeWidth="1" />
      <circle cx="92"  cy="32" r="2.5" stroke={s} strokeWidth="1" />
      <circle cx="110" cy="32" r="2.5" stroke={s} strokeWidth="1" />
      {/* Tubing loop over valves */}
      <path d="M66,40 L66,23 Q66,14 75,14 L107,14 Q118,14 118,23 L118,40"
        stroke={s} strokeWidth="1.6" fill="none" />
      {/* After-valve bore */}
      <line x1="118" y1="58" x2="152" y2="58" stroke={s} strokeWidth="2.2" strokeLinecap="round" />
      {/* Upper return crook */}
      <path d="M152,58 Q160,58 163,48 Q167,36 162,26 Q157,18 148,18 L118,18"
        stroke={s} strokeWidth="1.5" fill="none" />
      {/* Bell taper */}
      <path d="M152,58 Q166,59 182,65 Q205,73 228,82"
        stroke={s} strokeWidth="2.6" strokeLinecap="round" />
      {/* Bell rim */}
      <path d="M228,82 Q240,89 252,85 Q242,78 228,73 Q214,68 206,65"
        stroke={s} strokeWidth="1.8" strokeLinecap="round" />
      {/* Bell inner highlight */}
      <path d="M228,82 Q236,84 248,81" stroke={s} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

function FluteInstrument({ opacity = 0.38 }: { opacity?: number }) {
  const s = `rgba(201,168,76,${opacity})`
  const keys = [85, 108, 130, 156, 178, 200, 224, 248, 272, 296]
  return (
    <svg viewBox="0 0 355 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tube walls */}
      <line x1="20" y1="17" x2="328" y2="17" stroke={s} strokeWidth="1.9" />
      <line x1="20" y1="31" x2="328" y2="31" stroke={s} strokeWidth="1.9" />
      {/* Closed end cap */}
      <path d="M20,15 Q10,15 10,24 Q10,33 20,33" stroke={s} strokeWidth="1.9" fill="none" strokeLinecap="round" />
      {/* Open end (slight flare) */}
      <path d="M328,16 Q340,16 342,24 Q340,32 328,32" stroke={s} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* Embouchure hole */}
      <ellipse cx="42" cy="24" rx="9" ry="5.5" stroke={s} strokeWidth="1.4" />
      {/* Key mechanism connecting rods */}
      <line x1="85" y1="13" x2="296" y2="13" stroke={s} strokeWidth="0.75" opacity="0.45" />
      <line x1="85" y1="35" x2="296" y2="35" stroke={s} strokeWidth="0.75" opacity="0.45" />
      {/* Keys */}
      {keys.map((x, i) => (
        <g key={i}>
          <line x1={x} y1="18" x2={x} y2="12" stroke={s} strokeWidth="1" />
          <line x1={x} y1="30" x2={x} y2="36" stroke={s} strokeWidth="1" />
          <circle cx={x} cy="24" r="6.5" stroke={s} strokeWidth="1.2" />
          <circle cx={x} cy="24" r="3" stroke={s} strokeWidth="0.7" opacity="0.6" />
        </g>
      ))}
    </svg>
  )
}

function ViolinInstrument({ opacity = 0.45 }: { opacity?: number }) {
  const s = `rgba(201,168,76,${opacity})`
  return (
    <svg viewBox="0 0 112 298" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Scroll */}
      <path d="M49,10 Q58,3 65,12 Q72,21 62,27 Q54,31 47,23 Q41,15 50,11" stroke={s} strokeWidth="1.3" />
      <circle cx="54" cy="17" r="3.5" stroke={s} strokeWidth="1" opacity="0.7" />
      {/* Pegbox */}
      <rect x="44" y="27" width="24" height="42" rx="3" stroke={s} strokeWidth="1.5" />
      {/* Pegs */}
      <line x1="44" y1="38" x2="33" y2="34" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="44" y1="52" x2="33" y2="48" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="68" y1="38" x2="79" y2="34" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="68" y1="52" x2="79" y2="48" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
      {/* Nut */}
      <line x1="44" y1="69" x2="68" y2="69" stroke={s} strokeWidth="2.2" />
      {/* Neck */}
      <line x1="44" y1="69" x2="40" y2="94" stroke={s} strokeWidth="1.5" />
      <line x1="68" y1="69" x2="72" y2="94" stroke={s} strokeWidth="1.5" />
      {/* Upper bout */}
      <path d="M40,94 Q13,103 12,126 Q11,143 56,145" stroke={s} strokeWidth="1.8" />
      <path d="M72,94 Q99,103 100,126 Q101,143 56,145" stroke={s} strokeWidth="1.8" />
      {/* C-bouts (waist) */}
      <path d="M12,126 Q19,145 12,164" stroke={s} strokeWidth="1.8" />
      <path d="M100,126 Q93,145 100,164" stroke={s} strokeWidth="1.8" />
      {/* Lower bout */}
      <path d="M12,164 Q11,204 56,209" stroke={s} strokeWidth="1.8" />
      <path d="M100,164 Q101,204 56,209" stroke={s} strokeWidth="1.8" />
      {/* Bottom edge */}
      <path d="M18,209 Q56,220 94,209" stroke={s} strokeWidth="1.8" />
      {/* F-holes */}
      <path d="M35,128 Q29,138 32,150" stroke={s} strokeWidth="1.4" />
      <path d="M77,128 Q83,138 80,150" stroke={s} strokeWidth="1.4" />
      <circle cx="30" cy="130" r="2.2" stroke={s} strokeWidth="1.1" />
      <circle cx="30" cy="150" r="2.2" stroke={s} strokeWidth="1.1" />
      <circle cx="82" cy="130" r="2.2" stroke={s} strokeWidth="1.1" />
      <circle cx="82" cy="150" r="2.2" stroke={s} strokeWidth="1.1" />
      {/* Bridge */}
      <path d="M38,179 Q56,172 74,179" stroke={s} strokeWidth="1.5" />
      <line x1="40" y1="179" x2="43" y2="187" stroke={s} strokeWidth="1.3" />
      <line x1="72" y1="179" x2="69" y2="187" stroke={s} strokeWidth="1.3" />
      {/* Tailpiece */}
      <path d="M42,206 L70,206 L67,216 L45,216 Z" stroke={s} strokeWidth="1.3" />
      {/* Strings */}
      {[48, 53, 59, 64].map(x => (
        <line key={x} x1={x} y1="69" x2={x} y2="216" stroke={s} strokeWidth="0.7" opacity={opacity * 0.65} />
      ))}
      {/* Chinrest */}
      <path d="M43,212 Q56,220 69,212 Q71,222 56,226 Q41,222 43,212" stroke={s} strokeWidth="1" />
    </svg>
  )
}

// ── Spotlight cone above each instrument ──────────────────────────────────────
function Spotlight({
  width = '120%',
  left = '-10%',
}: {
  width?: string
  left?: string
}) {
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        top: '-110%',
        left,
        width,
        height: '200%',
        background:
          'radial-gradient(ellipse 60% 55% at 50% 0%, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0.04) 40%, transparent 70%)',
      }}
    />
  )
}

// ── Stage background assembly ─────────────────────────────────────────────────
function StageBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>

      {/* Grand Piano — bottom-left, large */}
      <motion.div
        className="absolute"
        style={{ bottom: '-4%', left: '-6%', width: 310, opacity: 0.9 }}
        animate={{ y: [-3, 4, -3], rotate: [-0.3, 0.3, -0.3] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
      >
        <Spotlight width="130%" left="-15%" />
        <GrandPiano opacity={0.46} />
      </motion.div>

      {/* Violin — right side, upper-mid */}
      <motion.div
        className="absolute"
        style={{ top: '14%', right: '3%', width: 88, opacity: 0.9 }}
        animate={{ y: [-5, 4, -5], rotate: [0.5, -0.5, 0.5] }}
        transition={{ duration: 11.2, repeat: Infinity, ease: 'easeInOut', delay: 2.4 }}
      >
        <Spotlight width="180%" left="-40%" />
        <ViolinInstrument opacity={0.46} />
      </motion.div>

      {/* Trumpet — upper-right, slightly clipped */}
      <motion.div
        className="absolute"
        style={{ top: '7%', right: '-4%', width: 250, opacity: 0.85 }}
        animate={{ y: [-3, 5, -3], rotate: [-0.4, 0.6, -0.4] }}
        transition={{ duration: 8.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      >
        <Spotlight width="110%" left="10%" />
        <TrumpetInstrument opacity={0.40} />
      </motion.div>

      {/* Flute — upper-left, diagonal */}
      <motion.div
        className="absolute"
        style={{ top: '18%', left: '-3%', width: 295, opacity: 0.8, rotate: '-7deg' }}
        animate={{ y: [-2, 5, -2], rotate: ['-7deg', '-5.5deg', '-7deg'] }}
        transition={{ duration: 13.5, repeat: Infinity, ease: 'easeInOut', delay: 3.8 }}
      >
        <Spotlight width="80%" left="10%" />
        <FluteInstrument opacity={0.34} />
      </motion.div>

      {/* Stage floor line */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: '28%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.08) 30%, rgba(201,168,76,0.12) 50%, rgba(201,168,76,0.08) 70%, transparent 100%)',
        }}
      />
      {/* Stage floor gradient */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '30%',
          background: 'linear-gradient(to top, rgba(201,168,76,0.025) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}

// ── Login page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const { signIn, login, isSupabaseMode } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setAuthError(null)
    const { error } = await signIn(email, password)
    if (error) {
      setAuthError(error)
      setIsLoading(false)
      return
    }
    router.replace('/home')
  }

  function handleDemoUser(userId: string) {
    setIsLoading(true)
    setTimeout(() => {
      login(userId)
      router.replace('/home')
    }, 600)
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#0A0A0A]">

      {/* ── Stage: instruments + floor ─────────────────────────────────── */}
      <StageBackground />

      {/* ── Gradient overlays (form readability) ──────────────────────── */}
      {/* Bottom solid fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/82 to-transparent pointer-events-none" />
      {/* Centre darkening to anchor the form */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 65%, rgba(10,10,10,0.65) 0%, transparent 100%)',
        }}
      />
      {/* Gold ambient from top (stage lighting source) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.14) 0%, transparent 60%)',
        }}
      />

      {/* ── Form content ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="mb-10"
        >
          <SpotlightWordmark />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="text-center mb-10 max-w-xs"
        >
          <h1 className="text-white font-black text-3xl tracking-tight leading-tight mb-3">
            Discover icons<br />before the world does.
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            The platform for spotting tomorrow&apos;s cultural icons today.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <form onSubmit={handleLogin} className="space-y-3 mb-4">
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-hype-gold/50 focus:bg-white/[0.09] transition-all"
              />
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-hype-gold/50 focus:bg-white/[0.09] transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {authError && (
              <p className="text-red-400 text-xs pl-1">{authError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 hover:bg-hype-gold-dim transition-all active:scale-[0.99] shadow-[0_4px_24px_rgba(201,168,76,0.3)] disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Demo switcher — mock mode only */}
          {!isSupabaseMode && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/25 text-xs">or try a demo user</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {mockUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleDemoUser(user.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-all text-left disabled:opacity-50"
                  >
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${user.coverColor} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
                      {user.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{user.name.split(' ')[0]}</p>
                      <p className="text-white/35 text-[9px] truncate">{user.interests[0]?.replace('-', ' ') ?? 'Demo'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="text-center text-white/25 text-xs">
            No account?{' '}
            <Link href="/signup" className="text-hype-gold hover:text-hype-gold-dim transition-colors">
              Join SPOTLIGHT
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

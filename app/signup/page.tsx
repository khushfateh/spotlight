'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useAnimate } from 'framer-motion'
import { ArrowRight, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'
import InstrumentBackdrop from '@/components/ui/InstrumentBackdrop'

const ease = [0.16, 1, 0.3, 1] as const

// ── Golden bird SVG ───────────────────────────────────────────────────────────
function GoldenBird({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 110" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Tail feathers */}
      <path d="M28,56 Q10,44 2,30 Q12,42 4,54 Q14,46 8,60 Q18,50 12,66" fill="#A8753A" />
      {/* Body */}
      <path d="M32,50 Q60,34 92,42 Q100,47 97,56 Q78,64 50,62 Q30,60 32,50 Z" fill="#C9A84C" />
      {/* Wing upper surface */}
      <path d="M55,46 Q64,12 102,26 Q83,30 60,48 Z" fill="#E8C46A" />
      {/* Wing highlight */}
      <path d="M70,22 Q88,12 102,26 Q90,22 76,28 Z" fill="#F5D980" />
      {/* Wing lower shadow */}
      <path d="M56,50 Q60,60 80,58 Q72,53 60,52 Z" fill="#B8963A" />
      {/* Head */}
      <circle cx="100" cy="40" r="13" fill="#C9A84C" />
      {/* Head highlight */}
      <ellipse cx="97" cy="35" rx="5" ry="4" fill="#E8C46A" opacity="0.5" />
      {/* Eye */}
      <circle cx="106" cy="36" r="3" fill="#1A1005" />
      <circle cx="107" cy="35" r="1" fill="white" opacity="0.9" />
      {/* Beak */}
      <path d="M111,38 L138,32 L111,47 Z" fill="#96612A" />
      {/* Beak highlight */}
      <path d="M111,38 L138,32 L124,37 Z" fill="#B8803A" />
      {/* Envelope in beak */}
      <g transform="translate(134, 24)">
        {/* Envelope body */}
        <rect x="0" y="0" width="28" height="20" rx="2.5" fill="white" />
        {/* Envelope flap (open, letter being delivered) */}
        <path d="M0,0 L14,11 L28,0" stroke="#C9A84C" strokeWidth="1.2" fill="none" />
        {/* Envelope sides */}
        <line x1="0" y1="20" x2="10" y2="11" stroke="#D4B56A" strokeWidth="0.8" />
        <line x1="28" y1="20" x2="18" y2="11" stroke="#D4B56A" strokeWidth="0.8" />
        {/* Letter lines peeking out */}
        <line x1="5" y1="15" x2="23" y2="15" stroke="#C9A84C" strokeWidth="1" opacity="0.4" />
        <line x1="5" y1="18" x2="17" y2="18" stroke="#C9A84C" strokeWidth="1" opacity="0.4" />
        {/* Gold seal */}
        <circle cx="14" cy="10" r="3" fill="#C9A84C" opacity="0.2" />
        <circle cx="14" cy="10" r="1.5" fill="#C9A84C" opacity="0.4" />
      </g>
      {/* Body shimmer */}
      <path d="M45,48 Q62,38 78,40" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
    </svg>
  )
}

// ── Bird + message animation ──────────────────────────────────────────────────
function BirdEmailAnimation({
  email,
  onDone,
}: {
  email: string
  onDone: () => void
}) {
  const [scope, animate] = useAnimate()
  const [messageVisible, setMessageVisible] = useState(false)

  useEffect(() => {
    async function runSequence() {
      // Phase 1: Bird enters from left
      await animate(
        '#bird',
        { x: 0 },
        { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
      )

      // Phase 2: Letter envelope glows + message appears
      setMessageVisible(true)
      await animate('#bird', { y: -6 }, { duration: 0.25, ease: 'easeOut' })
      await animate('#bird', { y: 0 }, { duration: 0.25, ease: 'easeIn' })

      // Phase 3: Bird bobs gently while user reads (2.2s)
      for (let i = 0; i < 4; i++) {
        await animate('#bird', { y: -5 }, { duration: 0.28, ease: 'easeInOut' })
        await animate('#bird', { y: 2 }, { duration: 0.28, ease: 'easeInOut' })
      }

      // Phase 4: Message fades, bird prepares to leave
      setMessageVisible(false)
      await new Promise(r => setTimeout(r, 200))

      // Phase 5: Bird swoops out to right with a little lift
      await animate(
        '#bird',
        { x: '110vw', y: -50, rotate: -12 },
        { duration: 0.75, ease: [0.5, 0, 1, 0.5] }
      )

      onDone()
    }

    runSequence()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      ref={scope}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(201,168,76,0.10) 0%, rgba(10,10,10,0.97) 60%)',
      }}
    >
      {/* Ambient glow that pulses when bird is center */}
      <AnimatePresence>
        {messageVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 40% at 50% 55%, rgba(201,168,76,0.08) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Message card — appears above bird */}
      <AnimatePresence>
        {messageVisible && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[22%] left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-10"
          >
            <div
              className="rounded-3xl px-5 py-5 text-center"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.25)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 0 40px rgba(201,168,76,0.12), 0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              {/* Gold shimmer line */}
              <div
                className="w-8 h-0.5 mx-auto mb-4 rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}
              />
              <p className="text-white font-black text-lg tracking-tight leading-tight mb-1">
                Check your inbox.
              </p>
              <p className="text-white/50 text-xs leading-relaxed mb-3">
                We sent a confirmation link to
              </p>
              <p
                className="text-sm font-semibold break-all px-2 py-1.5 rounded-xl"
                style={{
                  color: '#C9A84C',
                  background: 'rgba(201,168,76,0.10)',
                  border: '1px solid rgba(201,168,76,0.20)',
                }}
              >
                {email}
              </p>
              {/* Gold shimmer line */}
              <div
                className="w-8 h-0.5 mx-auto mt-4 rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bird — starts offscreen left */}
      <div
        id="bird"
        className="relative z-20"
        style={{ transform: 'translateX(-110vw)' }}
      >
        <GoldenBird className="w-64 h-auto drop-shadow-[0_0_24px_rgba(201,168,76,0.45)]" />
      </div>
    </motion.div>
  )
}

// ── Static confirmation screen ────────────────────────────────────────────────
function ConfirmationScreen({ email }: { email: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center"
    >
      {/* Floating envelope */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8 relative"
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.25)',
            boxShadow: '0 0 40px rgba(201,168,76,0.15)',
          }}
        >
          <Mail size={32} color="#C9A84C" />
        </div>
        {/* Shimmer ring */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ border: '1px solid rgba(201,168,76,0.4)', transform: 'scale(1.08)' }}
        />
      </motion.div>

      <SpotlightWordmark />

      <div className="mt-6 mb-8">
        <h1 className="text-white font-black text-2xl tracking-tight leading-tight mb-3">
          One last step.
        </h1>
        <p className="text-white/40 text-sm leading-relaxed max-w-xs">
          We sent a confirmation link to
        </p>
        <p className="text-hype-gold font-semibold text-sm mt-1 break-all max-w-xs mx-auto">
          {email}
        </p>
        <p className="text-white/30 text-xs leading-relaxed max-w-xs mt-3">
          Click the link to activate your account and start discovering.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/login"
          className="w-full h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:bg-hype-gold-dim transition-all"
        >
          Go to Sign In <ArrowRight size={16} />
        </Link>
        <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/8 text-white/30 text-xs text-center">
          Don&apos;t see it? Check your spam folder.
        </div>
        <p className="text-center text-white/20 text-xs">
          Wrong email?{' '}
          <Link href="/signup" className="text-hype-gold/70 hover:text-hype-gold transition-colors">
            Start over
          </Link>
        </p>
      </div>
    </motion.div>
  )
}

// ── Main signup page ──────────────────────────────────────────────────────────
type SignupStage = 'form' | 'bird' | 'waiting' | 'duplicate'

export default function SignupPage() {
  const router = useRouter()
  const { signUp, signInWithGoogle } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [stage, setStage] = useState<SignupStage>('form')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) return
    setIsLoading(true)
    setAuthError(null)
    const result = await signUp(email, password, name)
    if (result.error) {
      const msg = result.error.toLowerCase()
      if (msg.includes('already') || msg.includes('registered') || msg.includes('in use')) {
        setIsLoading(false)
        setStage('duplicate')
        return
      }
      setAuthError(result.error)
      setIsLoading(false)
      return
    }
    if (result.confirmEmail) {
      setStage('bird')
      return
    }
    // No confirmation required — go straight to onboarding
    router.push('/onboarding')
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#0A0A0A]">
      {/* Instrument backdrop — matches login page */}
      <InstrumentBackdrop />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/82 to-transparent pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 65%, rgba(10,10,10,0.65) 0%, transparent 100%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.14) 0%, transparent 60%)' }} />

      {/* Aurora orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-orb-2 absolute w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(107,33,168,0.2) 0%, transparent 70%)', top: '-10%', left: '-15%' }} />
        <div className="aurora-orb-3 absolute w-[350px] h-[350px] rounded-full blur-[90px]" style={{ background: 'radial-gradient(circle, rgba(15,118,110,0.2) 0%, transparent 70%)', bottom: '5%', right: '-10%' }} />
      </div>

      {/* Bird animation — absolute layer */}
      <AnimatePresence>
        {stage === 'bird' && (
          <BirdEmailAnimation
            key="bird"
            email={email}
            onDone={() => setStage('waiting')}
          />
        )}
      </AnimatePresence>

      {/* Duplicate email screen */}
      <AnimatePresence>
        {stage === 'duplicate' && (
          <motion.div
            key="duplicate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#0A0A0A] z-40 flex flex-col items-center justify-center px-6"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.10) 0%, transparent 60%)' }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-sm text-center"
            >
              <div className="mb-8"><SpotlightWordmark /></div>
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.22)', boxShadow: '0 0 32px rgba(201,168,76,0.10)' }}
              >
                <span style={{ fontSize: 24, color: 'rgba(201,168,76,0.85)' }}>✦</span>
              </motion.div>
              <h1 className="text-white font-black text-2xl tracking-tight leading-tight mb-3">
                Looks like you already<br />have a SPOTLIGHT account.
              </h1>
              <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                Continue your journey instead.
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,168,76,0.28)] hover:bg-hype-gold-dim transition-all"
                >
                  Go to Log In <ArrowRight size={15} />
                </Link>
                <button
                  onClick={() => setStage('form')}
                  className="w-full h-12 rounded-2xl border border-white/10 text-white/40 text-sm hover:border-white/20 hover:text-white/55 transition-all"
                >
                  Use a different email
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting confirmation screen */}
      <AnimatePresence>
        {stage === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#0A0A0A]"
          >
            <ConfirmationScreen email={email} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signup form */}
      <div className={`relative z-10 flex flex-col min-h-screen px-6 py-12 transition-opacity duration-300 ${stage !== 'form' ? 'opacity-0 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3 mb-10">
          <Link
            href="/login"
            className="w-9 h-9 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="mb-2"
          >
            <SpotlightWordmark />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.08 }}
            className="mb-8 mt-6"
          >
            <h1 className="text-white font-black text-3xl tracking-tight leading-tight mb-2 font-display">
              Join SPOTLIGHT.
            </h1>
            <p className="text-white/40 text-sm">
              Build your reputation as a cultural discoverer.
            </p>
          </motion.div>

          {/* Google sign-in */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.14 }}
            className="mb-5"
          >
            <button
              type="button"
              onClick={async () => {
                setIsLoading(true)
                const { error } = await signInWithGoogle('join')
                if (error) { setAuthError(error); setIsLoading(false) }
              }}
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-white text-[#1A1A1A] font-semibold text-sm flex items-center justify-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.2)] hover:bg-white/90 transition-all active:scale-[0.99] disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/25 text-xs">or sign up with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.16 }}
            onSubmit={handleSignup}
            className="space-y-3"
          >
            <div>
              <label className="text-white/35 text-[10px] font-semibold uppercase tracking-wider block mb-1.5 pl-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-hype-gold/50 transition-all"
              />
            </div>
            <div>
              <label className="text-white/35 text-[10px] font-semibold uppercase tracking-wider block mb-1.5 pl-1">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-hype-gold/50 transition-all"
              />
            </div>
            <div>
              <label className="text-white/35 text-[10px] font-semibold uppercase tracking-wider block mb-1.5 pl-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-hype-gold/50 transition-all"
              />
            </div>

            {authError && (
              <p className="text-red-400 text-xs pl-1">{authError}</p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !name || !email || !password}
                className="w-full h-13 py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 hover:bg-hype-gold-dim transition-all active:scale-[0.99] shadow-[0_4px_24px_rgba(201,168,76,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] animate-spin" />
                ) : (
                  <>Create Account <ArrowRight size={16} /></>
                )}
              </button>
            </div>

            <p className="text-center text-white/25 text-xs pt-2">
              Already have an account?{' '}
              <Link href="/login" className="text-hype-gold hover:text-hype-gold-dim transition-colors">
                Sign in
              </Link>
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  )
}

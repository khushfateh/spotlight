'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'
import { mockUsers } from '@/lib/mock-data/users'
import InstrumentBackdrop from '@/components/ui/InstrumentBackdrop'

const ease = [0.16, 1, 0.3, 1] as const

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signInWithGoogle, login, isSupabaseMode } = useAuth()
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
      const msg = error.toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        setAuthError("That doesn't seem right. Try again or reset your password.")
      } else {
        setAuthError(error)
      }
      setIsLoading(false)
      return
    }
    router.replace('/')
  }

  function handleDemoUser(userId: string) {
    setIsLoading(true)
    setTimeout(() => {
      login(userId)
      router.replace('/')
    }, 600)
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#0A0A0A]">

      {/* Instrument backdrop — grand piano, saxophone, violin, flute */}
      <InstrumentBackdrop />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/82 to-transparent pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 65%, rgba(10,10,10,0.65) 0%, transparent 100%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.14) 0%, transparent 60%)' }} />

      {/* Aurora orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-orb-1 absolute w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(107,33,168,0.25) 0%, transparent 70%)', top: '-10%', right: '-15%' }} />
        <div className="aurora-orb-2 absolute w-[350px] h-[350px] rounded-full blur-[90px]" style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.2) 0%, transparent 70%)', bottom: '10%', left: '-10%' }} />
      </div>

      {/* Form */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">

        {/* Back to home */}
        <Link
          href="/"
          className="absolute top-5 left-5 w-9 h-9 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.12] transition-all"
        >
          <ArrowLeft size={16} />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="mb-10"
        >
          <SpotlightWordmark />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="text-center mb-10 max-w-xs"
        >
          <h1 className="text-white font-black text-3xl tracking-tight leading-tight mb-3 font-display">
            Discover icons<br />before the world does.
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            The platform for spotting tomorrow&apos;s cultural icons today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="w-full max-w-sm glass rounded-3xl p-6"
        >
          {/* Google sign-in */}
          <button
            type="button"
            onClick={async () => {
              setIsLoading(true)
              const { error } = await signInWithGoogle('login')
              if (error) { setAuthError(error); setIsLoading(false) }
            }}
            disabled={isLoading}
            className="w-full h-12 rounded-2xl bg-white text-[#1A1A1A] font-semibold text-sm flex items-center justify-center gap-3 mb-3 shadow-[0_2px_12px_rgba(0,0,0,0.2)] hover:bg-white/90 transition-all active:scale-[0.99] disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/25 text-xs">or sign in with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleLogin} className="space-y-3 mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-hype-gold/50 focus:bg-white/[0.09] transition-all"
            />
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-hype-gold/50 focus:bg-white/[0.09] transition-all pr-12"
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {authError && <p className="text-red-400 text-xs pl-1">{authError}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 hover:bg-hype-gold-dim transition-all active:scale-[0.99] shadow-[0_4px_24px_rgba(201,168,76,0.3)] disabled:opacity-70"
            >
              {isLoading
                ? <div className="w-5 h-5 rounded-full border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] animate-spin" />
                : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

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

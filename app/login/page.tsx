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
          <h1 className="text-white font-black text-3xl tracking-tight leading-tight mb-3">
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
          className="w-full max-w-sm"
        >
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

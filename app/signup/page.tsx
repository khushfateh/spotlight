'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'

const ease = [0.16, 1, 0.3, 1] as const

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    router.push('/onboarding')
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#0A0A0A]">
      {/* Gold spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(201,168,76,0.14) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-12">
        {/* Back */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/login" className="w-9 h-9 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
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
            <h1 className="text-white font-black text-3xl tracking-tight leading-tight mb-2">
              Join SPOTLIGHT.
            </h1>
            <p className="text-white/40 text-sm">
              Build your reputation as a cultural discoverer.
            </p>
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

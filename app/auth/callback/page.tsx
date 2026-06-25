'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'

type State = 'loading' | 'join_existing' | 'login_welcome' | 'login_no_account' | 'error'

function SpotlightBeam() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'linear-gradient(105deg, transparent 20%, rgba(201,168,76,0.07) 45%, rgba(201,168,76,0.13) 50%, rgba(201,168,76,0.07) 55%, transparent 80%)',
        backgroundSize: '200% 100%',
      }}
      animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
    />
  )
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [userName, setUserName] = useState('')
  const handled = useRef(false)

  useEffect(() => {
    if (!supabase) { router.replace('/'); return }

    const intent =
      (typeof window !== 'undefined' ? localStorage.getItem('spotlight_auth_intent') : null) ?? 'join'
    if (typeof window !== 'undefined') localStorage.removeItem('spotlight_auth_intent')

    // Fallback: if auth never resolves, redirect to home after 8s
    const fallback = setTimeout(() => router.replace('/'), 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user || handled.current) return
      handled.current = true
      clearTimeout(fallback)

      const user = session.user
      const identities = user.identities ?? []
      const hasEmailIdentity = identities.some(i => i.provider === 'email')
      const isNewAccount = Date.now() - new Date(user.created_at).getTime() < 30_000
      const fullName: string = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
      setUserName(fullName.split(' ')[0] || 'Spotter')

      if (intent === 'join') {
        if (hasEmailIdentity) {
          // They had an email/password account. Google is now linked to it.
          // Keep them signed in — data is 100% preserved.
          setState('join_existing')
        } else {
          // Brand new Google account — proceed to app (onboarding handles welcome)
          router.replace('/')
        }
      } else {
        // LOGIN intent
        if (isNewAccount && !hasEmailIdentity) {
          // No pre-existing account — Supabase auto-created one during OAuth.
          // Sign them out and redirect to signup instead.
          await supabase!.auth.signOut()
          setState('login_no_account')
        } else {
          // Returning user: Google already linked, or email account just linked.
          // Fast, minimal welcome → redirect.
          setState('login_welcome')
          setTimeout(() => router.replace('/'), 700)
        }
      }
    })

    // Also surface OAuth error params (e.g. Supabase blocks the redirect)
    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) setState('error')

    return () => {
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [router])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-hype-gold/20 border-t-hype-gold/60 animate-spin" />
      </div>
    )
  }

  // ── JOIN: existing account ───────────────────────────────────────────────────
  // "You're already a part of us."
  if (state === 'join_existing') {
    return (
      <div className="relative min-h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
        {/* Ambient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.12) 0%, transparent 60%)',
          }}
        />
        <SpotlightBeam />

        {/* Pause text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center px-8 pointer-events-none"
        >
          <p
            style={{
              fontSize: 24,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.80)',
              textAlign: 'center',
              letterSpacing: '0.015em',
              lineHeight: 1.6,
              textShadow: '0 2px 48px rgba(0,0,0,0.9)',
              fontStyle: 'italic',
            }}
          >
            You&apos;re already<br />a part of us.
          </p>
        </motion.div>

        {/* Glass panel slides up */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.65, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 bottom-0"
        >
          <div
            style={{
              background: 'linear-gradient(170deg, rgba(18,16,12,0.98) 0%, rgba(10,9,7,0.99) 100%)',
              borderTop: '1px solid rgba(201,168,76,0.22)',
              borderLeft: '1px solid rgba(201,168,76,0.06)',
              borderRight: '1px solid rgba(201,168,76,0.06)',
              borderRadius: '24px 24px 0 0',
              backdropFilter: 'blur(48px)',
              WebkitBackdropFilter: 'blur(48px)',
              boxShadow: '0 -32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(201,168,76,0.12)',
              padding: '28px 24px 16px',
              paddingBottom: 'max(36px, env(safe-area-inset-bottom, 20px))',
            }}
          >
            {/* Gold glow bar */}
            <div
              className="mx-auto mb-6"
              style={{
                width: 36,
                height: 3,
                borderRadius: 99,
                background:
                  'linear-gradient(90deg, rgba(201,168,76,0.15), rgba(201,168,76,0.55), rgba(201,168,76,0.15))',
              }}
            />

            {/* Gold ✦ seal */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.22)',
                boxShadow: '0 0 32px rgba(201,168,76,0.10)',
              }}
            >
              <span style={{ fontSize: 24, color: 'rgba(201,168,76,0.85)' }}>✦</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2
                className="text-white font-black text-2xl tracking-tight leading-tight text-center mb-3"
                style={{ letterSpacing: '-0.02em' }}
              >
                You&apos;re already<br />a part of us.
              </h2>
              <p className="text-white/40 text-sm text-center leading-relaxed mb-7 max-w-xs mx-auto">
                We found your SPOTLIGHT account and securely connected your Google sign-in.
                Your discoveries are exactly where you left them.
              </p>

              <button
                onClick={() => router.replace('/')}
                className="w-full h-13 py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,168,76,0.28)] hover:bg-hype-gold-dim transition-all active:scale-[0.99]"
              >
                Continue <ArrowRight size={15} />
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── LOGIN: welcome back ──────────────────────────────────────────────────────
  if (state === 'login_welcome') {
    return (
      <div className="relative min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 40% at 50% 50%, rgba(201,168,76,0.07) 0%, transparent 60%)',
          }}
        />
        <SpotlightBeam />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center px-8"
        >
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.88)',
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}
          >
            Welcome back{userName ? `, ${userName}` : ''}.
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.32)',
              letterSpacing: '0.01em',
            }}
          >
            Picking up where you left off...
          </p>
        </motion.div>
      </div>
    )
  }

  // ── LOGIN: no account found ──────────────────────────────────────────────────
  if (state === 'login_no_account') {
    return (
      <div className="relative min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-sm text-center"
        >
          <div className="mb-8">
            <SpotlightWordmark />
          </div>

          <h1 className="text-white font-black text-2xl tracking-tight leading-tight mb-3">
            Looks like you&apos;re<br />new here.
          </h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            We couldn&apos;t find a SPOTLIGHT account linked to this Google account.
            Would you like to become a Spotter?
          </p>

          <div className="space-y-3">
            <Link
              href="/signup"
              className="w-full h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,168,76,0.28)] hover:bg-hype-gold-dim transition-all"
            >
              Become a Spotter <ArrowRight size={15} />
            </Link>
            <Link
              href="/"
              className="w-full h-12 rounded-2xl border border-white/10 text-white/40 text-sm flex items-center justify-center hover:border-white/20 hover:text-white/55 transition-all"
            >
              Back
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mb-8">
          <SpotlightWordmark />
        </div>
        <p className="text-white/50 text-sm mb-6">Something went wrong. Please try again.</p>
        <Link
          href="/login"
          className="w-full h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2"
        >
          Try again <ArrowRight size={15} />
        </Link>
      </motion.div>
    </div>
  )
}

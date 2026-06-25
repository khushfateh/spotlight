'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'

type State = 'loading' | 'already_registered' | 'error' | 'ok'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) { router.replace('/'); return }

    // Supabase writes the session from the URL hash automatically.
    // Wait for onAuthStateChange to fire, then inspect the user's identities.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const identities = session.user.identities ?? []
        const hasEmailProvider = identities.some(i => i.provider === 'email')
        const hasGoogleProvider = identities.some(i => i.provider === 'google')

        if (hasEmailProvider && hasGoogleProvider) {
          // They had an email/password account — sign them back out and show the message.
          // We don't want to silently link accounts without them knowing.
          await supabase!.auth.signOut()
          setState('already_registered')
        } else {
          // Clean Google sign-in — proceed to app
          setState('ok')
          router.replace('/')
        }
      }

      if (event === 'SIGNED_OUT') {
        // Could be from our own signOut above — already handled
      }
    })

    // Also check for OAuth error params in the URL
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error_description') ?? params.get('error')
    if (urlError) {
      setState('error')
      setErrorMsg(urlError)
    }

    return () => subscription.unsubscribe()
  }, [router])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-hype-gold/30 border-t-hype-gold animate-spin" />
      </div>
    )
  }

  if (state === 'already_registered') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.10) 0%, transparent 60%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-sm text-center"
        >
          <div className="mb-8">
            <SpotlightWordmark />
          </div>

          {/* Gold seal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: 'rgba(201,168,76,0.10)',
              border: '1px solid rgba(201,168,76,0.25)',
              boxShadow: '0 0 40px rgba(201,168,76,0.12)',
            }}
          >
            <span style={{ fontSize: 28 }}>✦</span>
          </motion.div>

          <h1 className="text-white font-black text-2xl tracking-tight leading-tight mb-3">
            You&apos;re already<br />a part of us.
          </h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            This email is registered with a password. Sign in with your email and password to continue your journey.
          </p>

          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full h-12 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:bg-hype-gold-dim transition-all"
            >
              Continue Your Journey <ArrowRight size={15} />
            </Link>
            <Link
              href="/"
              className="w-full h-12 rounded-2xl border border-white/10 text-white/40 text-sm flex items-center justify-center hover:border-white/20 hover:text-white/60 transition-all"
            >
              Back to SPOTLIGHT
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mb-8">
            <SpotlightWordmark />
          </div>
          <p className="text-white/60 text-sm mb-2">Something went wrong.</p>
          {errorMsg && <p className="text-white/30 text-xs mb-6">{errorMsg}</p>}
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

  return null
}

'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AtSign, Check, X, Loader2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'
import {
  normalizeUsername,
  validateUsername,
  checkAvailability,
  generateSuggestions,
  saveUsername,
} from '@/lib/services/usernameService'

const ease = [0.16, 1, 0.3, 1] as const

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function UsernameSetupPage() {
  const router = useRouter()
  const { currentUser, refreshUser } = useAuth()

  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [availability, setAvailability] = useState<AvailabilityState>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkUsername = useCallback(async (raw: string) => {
    const normalized = normalizeUsername(raw)
    const validation = validateUsername(normalized)
    if (!validation.valid) {
      setUsernameError(validation.error ?? '')
      setAvailability('invalid')
      setSuggestions([])
      return
    }
    setAvailability('checking')
    setUsernameError('')
    const result = await checkAvailability(normalized, currentUser?.id)
    if (result.available) {
      setAvailability('available')
      setUsernameError('')
      setSuggestions([])
    } else {
      setAvailability('taken')
      setUsernameError(result.error ?? 'Already taken')
      setSuggestions(generateSuggestions(currentUser?.name ?? raw))
    }
  }, [currentUser?.id, currentUser?.name])

  function handleChange(raw: string) {
    setUsername(raw)
    setAvailability('idle')
    setUsernameError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!raw.trim()) return
    debounceRef.current = setTimeout(() => checkUsername(raw), 300)
  }

  async function handleSubmit() {
    if (!currentUser?.id) return
    if (!username.trim()) { setUsernameError('Please enter a username'); return }
    if (availability === 'checking') return
    if (availability !== 'available') { await checkUsername(username); return }

    setSaving(true)
    try {
      const normalized = normalizeUsername(username)
      const { error } = await saveUsername(currentUser.id, normalized)
      if (error) { setUsernameError(error); return }
      await refreshUser()
      router.replace('/')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.12) 0%, transparent 60%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex-1 flex flex-col items-center justify-center px-6 py-16"
      >
        <div className="mb-8"><SpotlightWordmark /></div>

        <div className="w-full max-w-xs">
          <h1 className="text-white font-black text-3xl tracking-tight leading-tight mb-2 text-center">
            Claim your username
          </h1>
          <p className="text-white/40 text-sm text-center mb-8">
            Your unique identity on Spotlight. You can change it once every 30 days.
          </p>

          <div className="mb-3">
            <div className="relative">
              <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={username}
                onChange={e => handleChange(e.target.value)}
                placeholder="yourname"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                className={`w-full h-13 py-3.5 bg-white/[0.06] border rounded-xl pl-10 pr-10 text-white text-sm placeholder-white/25 focus:outline-none focus:bg-white/[0.08] transition-all ${
                  availability === 'available'
                    ? 'border-emerald-500/50 focus:border-emerald-500/70'
                    : availability === 'taken' || availability === 'invalid'
                    ? 'border-red-500/50 focus:border-red-500/70'
                    : 'border-white/10 focus:border-hype-gold/40'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {availability === 'checking' && <Loader2 size={15} className="text-white/30 animate-spin" />}
                {availability === 'available' && <Check size={15} className="text-emerald-400" />}
                {(availability === 'taken' || availability === 'invalid') && <X size={15} className="text-red-400" />}
              </div>
            </div>
            {usernameError && <p className="mt-1.5 text-red-400 text-xs">{usernameError}</p>}
            {availability === 'available' && !usernameError && (
              <p className="mt-1.5 text-emerald-400 text-xs">@{normalizeUsername(username)} is yours</p>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="mb-5">
              <p className="text-white/30 text-xs mb-2">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => handleChange(s)}
                    className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/60 text-xs hover:border-hype-gold/40 hover:text-white/80 transition-all"
                  >
                    @{s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving || availability === 'checking'}
            className="w-full py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:bg-hype-gold-dim transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-4"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
          </button>

          <p className="text-center text-white/20 text-xs mt-3">
            3–20 characters · Letters, numbers, and underscores
          </p>
        </div>
      </motion.div>
    </div>
  )
}

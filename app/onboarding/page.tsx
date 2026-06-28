'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Check, AtSign, User, Camera, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useGenres } from '@/hooks/useGenres'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'
import { genres as mockGenres } from '@/lib/mock-data/genres'
import { creators } from '@/lib/mock-data/creators'
import { updateProfile } from '@/lib/services/profileService'
import { normalizeUsername, validateUsername, checkAvailability, generateSuggestions, saveUsername } from '@/lib/services/usernameService'
import { uploadAvatar, validateImage, createPreviewUrl } from '@/lib/services/avatarService'

const ease = [0.16, 1, 0.3, 1] as const

const STEPS = ['welcome', 'identity', 'genres', 'creators', 'photo', 'generating'] as const
type Step = typeof STEPS[number]

const ONBOARDING_TICKERS = [
  'APDHILLON', 'SABRINA', 'LILNASX', 'TYLERTC', 'NEWJEANS',
  'PESOPLUMA', 'DOJACAT', 'HANUMANKIND', 'SZA', 'WEEKND',
  'BURNA', 'DIPLO',
]

const LOADING_STEPS = [
  'Analyzing your taste profile…',
  'Finding hidden gems in your genres…',
  'Matching with early spotters like you…',
  'Building your personalized briefing…',
  'Your discovery feed is ready.',
]

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function OnboardingPage() {
  const router = useRouter()
  const { currentUser, isSupabaseMode } = useAuth()
  const { completeOnboarding } = useUserPreferences()
  const { genres: supabaseGenres, loading: genresLoading } = useGenres()

  const [step, setStep] = useState<Step>('welcome')
  const [selectedGenreSlugs, setSelectedGenreSlugs] = useState<string[]>([])
  const [selectedCreators, setSelectedCreators] = useState<string[]>([])
  const [loadStep, setLoadStep] = useState(0)

  // Identity step
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameAvailability, setUsernameAvailability] = useState<AvailabilityState>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [identitySaving, setIdentitySaving] = useState(false)

  // Photo step
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const displayGenres = isSupabaseMode && supabaseGenres.length > 0
    ? supabaseGenres
    : mockGenres.map(g => ({ id: g.id, slug: g.id, name: g.label, category: g.label, description: g.description, created_at: '' }))

  const onboardingCreators = creators.filter(c => ONBOARDING_TICKERS.includes(c.ticker))

  useEffect(() => {
    if (currentUser?.name && !displayName) setDisplayName(currentUser.name)
  }, [currentUser, displayName])

  const checkUsername = useCallback(async (raw: string) => {
    const normalized = normalizeUsername(raw)
    const validation = validateUsername(normalized)
    if (!validation.valid) {
      setUsernameError(validation.error ?? '')
      setUsernameAvailability('invalid')
      setSuggestions([])
      return
    }
    setUsernameAvailability('checking')
    setUsernameError('')
    const result = await checkAvailability(normalized, currentUser?.id)
    if (result.available) {
      setUsernameAvailability('available')
      setUsernameError('')
      setSuggestions([])
    } else {
      setUsernameAvailability('taken')
      setUsernameError(result.error ?? 'Already taken')
      setSuggestions(generateSuggestions(displayName || raw))
    }
  }, [currentUser?.id, displayName])

  function handleUsernameChange(raw: string) {
    setUsername(raw)
    setUsernameAvailability('idle')
    setUsernameError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!raw.trim()) return
    debounceRef.current = setTimeout(() => checkUsername(raw), 300)
  }

  function handleFileSelect(file: File) {
    const check = validateImage(file)
    if (!check.valid) { setPhotoError(check.error ?? ''); return }
    setPhotoError('')
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(createPreviewUrl(file))
    setAvatarFile(file)
  }

  function removeAvatar() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
    setAvatarFile(null)
    setPhotoError('')
  }

  function toggleGenre(slug: string) {
    setSelectedGenreSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  function toggleCreator(ticker: string) {
    setSelectedCreators(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
    )
  }

  async function saveIdentity(): Promise<boolean> {
    if (!currentUser?.id || !isSupabaseMode) return true
    setIdentitySaving(true)
    try {
      const normalized = normalizeUsername(username)
      await Promise.all([
        displayName.trim()
          ? updateProfile(currentUser.id, { display_name: displayName.trim() })
          : Promise.resolve(),
        normalized && usernameAvailability === 'available'
          ? saveUsername(currentUser.id, normalized)
          : Promise.resolve({ error: undefined }),
      ])
      return true
    } catch {
      setUsernameError('Failed to save. Try again.')
      return false
    } finally {
      setIdentitySaving(false)
    }
  }

  async function startGenerating() {
    setStep('generating')
    if (avatarFile && currentUser?.id) {
      await uploadAvatar(currentUser.id, avatarFile)
    }
    const savePromise = completeOnboarding(selectedGenreSlugs)
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 900))
      setLoadStep(i + 1)
    }
    await savePromise
    await new Promise(r => setTimeout(r, 400))
    router.replace('/')
  }

  async function next() {
    if (step === 'identity') {
      if (!username.trim()) { setUsernameError('Please choose a username'); return }
      if (usernameAvailability === 'checking') return
      if (usernameAvailability !== 'available') { await checkUsername(username); return }
      const ok = await saveIdentity()
      if (!ok) return
      setStep('genres')
      return
    }
    if (step === 'photo') { startGenerating(); return }
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 2) setStep(STEPS[idx + 1])
    else startGenerating()
  }

  function back() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  const progress = (STEPS.indexOf(step) / (STEPS.length - 1)) * 100
  const genreCategories = isSupabaseMode ? [...new Set(supabaseGenres.map(g => g.category))] : []

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.12) 0%, transparent 60%)' }}
      />

      {step !== 'generating' && (
        <div className="absolute top-0 left-0 right-0 h-[2px] z-20">
          <motion.div
            className="h-full bg-hype-gold"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease }}
          />
        </div>
      )}

      {step !== 'welcome' && step !== 'generating' && (
        <div className="relative z-10 px-6 pt-8">
          <button
            onClick={back}
            className="w-9 h-9 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">

        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center"
          >
            <div className="mb-8"><SpotlightWordmark /></div>
            <h1 className="text-white font-black text-4xl tracking-tight leading-tight mb-4">
              Welcome{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}.
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-xs mb-3">
              You&apos;re about to join the most discerning cultural discovery platform on the planet.
            </p>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs mb-12">
              In 4 steps, we&apos;ll build a feed that feels like it was made specifically for you.
            </p>
            <button
              onClick={next}
              className="w-full max-w-xs py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:bg-hype-gold-dim transition-all"
            >
              Let&apos;s go <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {step === 'identity' && (
          <motion.div
            key="identity"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease }}
            className="flex-1 flex flex-col px-5 pt-6 pb-36"
          >
            <div className="mb-8">
              <p className="text-hype-gold text-xs font-semibold uppercase tracking-widest mb-2">Step 1 of 4</p>
              <h2 className="text-white font-black text-2xl tracking-tight mb-1">Who are you?</h2>
              <p className="text-white/40 text-sm">Claim your identity on Spotlight.</p>
            </div>

            <div className="mb-5">
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                Display name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                  className="w-full h-12 bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-4 text-white text-sm placeholder-white/25 focus:outline-none focus:border-hype-gold/40 focus:bg-white/[0.08] transition-all"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  placeholder="yourname"
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={`w-full h-12 bg-white/[0.06] border rounded-xl pl-10 pr-10 text-white text-sm placeholder-white/25 focus:outline-none focus:bg-white/[0.08] transition-all ${
                    usernameAvailability === 'available'
                      ? 'border-emerald-500/50 focus:border-emerald-500/70'
                      : usernameAvailability === 'taken' || usernameAvailability === 'invalid'
                      ? 'border-red-500/50 focus:border-red-500/70'
                      : 'border-white/10 focus:border-hype-gold/40'
                  }`}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {usernameAvailability === 'checking' && (
                    <Loader2 size={15} className="text-white/30 animate-spin" />
                  )}
                  {usernameAvailability === 'available' && (
                    <Check size={15} className="text-emerald-400" />
                  )}
                  {(usernameAvailability === 'taken' || usernameAvailability === 'invalid') && (
                    <X size={15} className="text-red-400" />
                  )}
                </div>
              </div>
              {usernameError && <p className="mt-1.5 text-red-400 text-xs">{usernameError}</p>}
              {usernameAvailability === 'available' && !usernameError && (
                <p className="mt-1.5 text-emerald-400 text-xs">@{normalizeUsername(username)} is yours</p>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-white/30 text-xs mb-2">Try one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => handleUsernameChange(s)}
                      className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/60 text-xs hover:border-hype-gold/40 hover:text-white/80 transition-all"
                    >
                      @{s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-white/20 text-xs leading-relaxed">
              Your username is public and links to your discovery profile. You can change it once every 30 days.
            </p>
          </motion.div>
        )}

        {step === 'genres' && (
          <motion.div
            key="genres"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease }}
            className="flex-1 flex flex-col px-5 pt-6 pb-28 overflow-y-auto"
          >
            <div className="mb-6">
              <p className="text-hype-gold text-xs font-semibold uppercase tracking-widest mb-2">Step 2 of 4</p>
              <h2 className="text-white font-black text-2xl tracking-tight mb-1">What moves you?</h2>
              <p className="text-white/40 text-sm">Pick genres you care about. Select as many as you like.</p>
            </div>

            {genresLoading && isSupabaseMode ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-hype-gold animate-spin" />
              </div>
            ) : isSupabaseMode && genreCategories.length > 0 ? (
              <div className="space-y-6">
                {genreCategories.map(category => (
                  <div key={category}>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {supabaseGenres.filter(g => g.category === category).map(genre => {
                        const selected = selectedGenreSlugs.includes(genre.slug)
                        return (
                          <button
                            key={genre.id}
                            onClick={() => toggleGenre(genre.slug)}
                            className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 border ${
                              selected
                                ? 'border-hype-gold bg-hype-gold/15 text-hype-gold'
                                : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20'
                            }`}
                          >
                            {selected && <Check size={10} className="inline mr-1" />}
                            {genre.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {displayGenres.map(genre => {
                  const selected = selectedGenreSlugs.includes(genre.slug)
                  const mockGenre = mockGenres.find(m => m.id === genre.slug)
                  return (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.slug)}
                      className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 border ${
                        selected ? 'border-hype-gold bg-hype-gold/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-hype-gold flex items-center justify-center">
                          <Check size={11} className="text-[#0A0A0A]" />
                        </div>
                      )}
                      <span className="text-2xl mb-2 block">{mockGenre?.emoji ?? '🎵'}</span>
                      <p className="text-white text-xs font-bold leading-tight">{genre.name}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {step === 'creators' && (
          <motion.div
            key="creators"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease }}
            className="flex-1 flex flex-col px-5 pt-6 pb-28 overflow-y-auto"
          >
            <div className="mb-6">
              <p className="text-hype-gold text-xs font-semibold uppercase tracking-widest mb-2">Step 3 of 4</p>
              <h2 className="text-white font-black text-2xl tracking-tight mb-1">Creators you already know?</h2>
              <p className="text-white/40 text-sm">We&apos;ll find you the ones you haven&apos;t discovered yet.</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {onboardingCreators.map(creator => {
                const selected = selectedCreators.includes(creator.ticker)
                return (
                  <button
                    key={creator.ticker}
                    onClick={() => toggleCreator(creator.ticker)}
                    className={`relative rounded-2xl overflow-hidden text-center transition-all duration-200 border-2 ${selected ? 'border-hype-gold' : 'border-transparent'}`}
                    style={{ aspectRatio: '3/4' }}
                  >
                    {creator.imageUrl ? (
                      <img src={creator.imageUrl} alt={creator.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${creator.coverColor} flex items-center justify-center text-white text-2xl font-black`}>
                        {creator.avatar}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-hype-gold flex items-center justify-center z-10">
                        <Check size={11} className="text-[#0A0A0A]" />
                      </div>
                    )}
                    <p className="absolute bottom-0 left-0 right-0 pb-2.5 px-2 text-white text-[11px] font-bold leading-tight z-10">
                      {creator.name}
                    </p>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 'photo' && (
          <motion.div
            key="photo"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease }}
            className="flex-1 flex flex-col items-center px-5 pt-6 pb-36"
          >
            <div className="w-full mb-8">
              <p className="text-hype-gold text-xs font-semibold uppercase tracking-widest mb-2">Step 4 of 4</p>
              <h2 className="text-white font-black text-2xl tracking-tight mb-1">Add a photo</h2>
              <p className="text-white/40 text-sm">Put a face to your discoveries. Totally optional.</p>
            </div>

            <div className="flex flex-col items-center gap-5 w-full">
              <div
                className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={22} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-full bg-white/[0.04] group-hover:border-hype-gold/40 group-hover:bg-white/[0.07] transition-all">
                    <Camera size={24} className="text-white/30 group-hover:text-hype-gold/60 transition-colors" />
                    <span className="text-white/25 text-[10px] font-semibold group-hover:text-white/40 transition-colors">UPLOAD</span>
                  </div>
                )}
              </div>

              {avatarPreview && (
                <button
                  onClick={removeAvatar}
                  className="flex items-center gap-1.5 text-white/30 text-xs hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                  Remove photo
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                  e.target.value = ''
                }}
              />

              {photoError && <p className="text-red-400 text-xs text-center">{photoError}</p>}

              {displayName && (
                <div className="text-center">
                  <p className="text-white font-semibold text-base">{displayName}</p>
                  {username && <p className="text-white/40 text-sm">@{normalizeUsername(username)}</p>}
                </div>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-hype-gold/10 border border-hype-gold/20">
                <span className="text-sm">✨</span>
                <span className="text-hype-gold text-xs font-semibold">New Spotter</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex flex-col items-center justify-center px-8 text-center"
          >
            <motion.div
              className="relative mb-10"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(201,168,76,0.35) 0%, rgba(201,168,76,0.08) 70%)',
                  boxShadow: '0 0 50px rgba(201,168,76,0.25)',
                }}
              >
                <SpotlightWordmark />
              </div>
            </motion.div>

            <h2 className="text-white font-black text-2xl tracking-tight mb-6">Building your universe…</h2>

            <div className="space-y-3 w-full max-w-xs">
              {LOADING_STEPS.map((label, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: loadStep > i ? 1 : 0.25, x: loadStep > i ? 0 : -10 }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="flex items-center gap-3 text-left"
                >
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 ${loadStep > i ? 'bg-hype-gold' : 'bg-white/10'}`}>
                    {loadStep > i && <Check size={11} className="text-[#0A0A0A]" />}
                  </div>
                  <span className={`text-sm transition-colors duration-300 ${loadStep > i ? 'text-white' : 'text-white/25'}`}>
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {(step === 'identity' || step === 'genres' || step === 'creators' || step === 'photo') && (
        <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent">
          <button
            onClick={next}
            disabled={
              step === 'identity' && (identitySaving || usernameAvailability === 'checking')
            }
            className="w-full py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:bg-hype-gold-dim transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {identitySaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : step === 'identity' ? (
              <>Continue <ArrowRight size={16} /></>
            ) : step === 'genres' ? (
              <>Pick creators <ArrowRight size={16} /></>
            ) : step === 'creators' ? (
              <>Add a photo <ArrowRight size={16} /></>
            ) : (
              <>Complete setup <ArrowRight size={16} /></>
            )}
          </button>
          <p className="text-center text-white/20 text-xs mt-2">
            {step === 'identity'
              ? usernameAvailability === 'available' ? `@${normalizeUsername(username)} is yours` : 'Enter a username to continue'
              : step === 'genres'
              ? selectedGenreSlugs.length > 0 ? `${selectedGenreSlugs.length} genres selected` : 'Skip to use defaults'
              : step === 'creators'
              ? selectedCreators.length > 0 ? `${selectedCreators.length} creators selected` : 'Skip this step'
              : 'You can always add one later'}
          </p>
        </div>
      )}
    </div>
  )
}

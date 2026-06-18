'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useGenres } from '@/hooks/useGenres'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'
import { genres as mockGenres } from '@/lib/mock-data/genres'
import { creators } from '@/lib/mock-data/creators'

const ease = [0.16, 1, 0.3, 1] as const

const STEPS = ['welcome', 'genres', 'creators', 'generating'] as const
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

export default function OnboardingPage() {
  const router = useRouter()
  const { currentUser, isSupabaseMode } = useAuth()
  const { completeOnboarding } = useUserPreferences()
  const { genres: supabaseGenres, loading: genresLoading } = useGenres()

  const [step, setStep] = useState<Step>('welcome')
  const [selectedGenreSlugs, setSelectedGenreSlugs] = useState<string[]>([])
  const [selectedCreators, setSelectedCreators] = useState<string[]>([])
  const [loadStep, setLoadStep] = useState(0)

  // Use Supabase genres when available, fall back to mock genres
  const displayGenres = isSupabaseMode && supabaseGenres.length > 0
    ? supabaseGenres
    : mockGenres.map(g => ({ id: g.id, slug: g.id, name: g.label, category: g.label, description: g.description, created_at: '' }))

  const onboardingCreators = creators.filter(c => ONBOARDING_TICKERS.includes(c.ticker))

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

  async function startGenerating() {
    setStep('generating')

    // Animate loading steps while saving in background
    const savePromise = completeOnboarding(selectedGenreSlugs)

    for (let i = 0; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 900))
      setLoadStep(i + 1)
    }

    // Ensure save completes before redirecting
    await savePromise
    await new Promise(r => setTimeout(r, 400))
    router.replace('/')
  }

  function next() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 2) {
      setStep(STEPS[idx + 1])
    } else {
      startGenerating()
    }
  }

  function back() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  const progress = (STEPS.indexOf(step) / (STEPS.length - 1)) * 100

  // Categorized genre display for Supabase mode
  const genreCategories = isSupabaseMode
    ? [...new Set(supabaseGenres.map(g => g.category))]
    : []

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
            <div className="mb-8">
              <SpotlightWordmark />
            </div>
            <h1 className="text-white font-black text-4xl tracking-tight leading-tight mb-4">
              Welcome{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}.
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-xs mb-3">
              You&apos;re about to join the most discerning cultural discovery platform on the planet.
            </p>
            <p className="text-white/30 text-sm leading-relaxed max-w-xs mb-12">
              In 3 steps, we&apos;ll build a feed that feels like it was made specifically for you.
            </p>
            <button
              onClick={next}
              className="w-full max-w-xs h-13 py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:bg-hype-gold-dim transition-all"
            >
              Let&apos;s go <ArrowRight size={16} />
            </button>
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
              <p className="text-hype-gold text-xs font-semibold uppercase tracking-widest mb-2">Step 1 of 2</p>
              <h2 className="text-white font-black text-2xl tracking-tight mb-1">What moves you?</h2>
              <p className="text-white/40 text-sm">Pick genres you care about. Select as many as you like.</p>
            </div>

            {genresLoading && isSupabaseMode ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-hype-gold animate-spin" />
              </div>
            ) : isSupabaseMode && genreCategories.length > 0 ? (
              // Supabase mode: show categories grouped
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
              // Mock mode: 2-column card grid
              <div className="grid grid-cols-2 gap-2.5">
                {displayGenres.map(genre => {
                  const selected = selectedGenreSlugs.includes(genre.slug)
                  const mockGenre = mockGenres.find(m => m.id === genre.slug)
                  return (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.slug)}
                      className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 border ${
                        selected
                          ? 'border-hype-gold bg-hype-gold/10'
                          : 'border-white/10 bg-white/[0.04] hover:border-white/20'
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
              <p className="text-hype-gold text-xs font-semibold uppercase tracking-widest mb-2">Step 2 of 2</p>
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
                    className={`relative rounded-2xl overflow-hidden text-center transition-all duration-200 border-2 ${
                      selected
                        ? 'border-hype-gold'
                        : 'border-transparent'
                    }`}
                    style={{ aspectRatio: '3/4' }}
                  >
                    {/* Photo / fallback gradient */}
                    {creator.imageUrl ? (
                      <img
                        src={creator.imageUrl}
                        alt={creator.name}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${creator.coverColor} flex items-center justify-center text-white text-2xl font-black`}>
                        {creator.avatar}
                      </div>
                    )}

                    {/* Bottom gradient for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

                    {/* Selection tick */}
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-hype-gold flex items-center justify-center z-10">
                        <Check size={11} className="text-[#0A0A0A]" />
                      </div>
                    )}

                    {/* Name */}
                    <p className="absolute bottom-0 left-0 right-0 pb-2.5 px-2 text-white text-[11px] font-bold leading-tight z-10">
                      {creator.name}
                    </p>
                  </button>
                )
              })}
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

            <h2 className="text-white font-black text-2xl tracking-tight mb-6">
              Building your universe…
            </h2>

            <div className="space-y-3 w-full max-w-xs">
              {LOADING_STEPS.map((label, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: loadStep > i ? 1 : 0.25, x: loadStep > i ? 0 : -10 }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="flex items-center gap-3 text-left"
                >
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                    loadStep > i ? 'bg-hype-gold' : 'bg-white/10'
                  }`}>
                    {loadStep > i && <Check size={11} className="text-[#0A0A0A]" />}
                  </div>
                  <span className={`text-sm transition-colors duration-300 ${
                    loadStep > i ? 'text-white' : 'text-white/25'
                  }`}>
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {(step === 'genres' || step === 'creators') && (
        <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent">
          <button
            onClick={next}
            className="w-full h-13 py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,168,76,0.3)] hover:bg-hype-gold-dim transition-all"
          >
            {step === 'genres' ? (
              <>Pick creators <ArrowRight size={16} /></>
            ) : (
              <>Generate my feed <ArrowRight size={16} /></>
            )}
          </button>
          <p className="text-center text-white/20 text-xs mt-2">
            {step === 'genres'
              ? selectedGenreSlugs.length > 0 ? `${selectedGenreSlugs.length} genres selected` : 'Skip to use defaults'
              : selectedCreators.length > 0 ? `${selectedCreators.length} creators selected` : 'Skip this step'
            }
          </p>
        </div>
      )}
    </div>
  )
}

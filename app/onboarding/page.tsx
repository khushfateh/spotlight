'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'
import { genres } from '@/lib/mock-data/genres'
import { creators } from '@/lib/mock-data/creators'

const ease = [0.16, 1, 0.3, 1] as const

const STEPS = ['welcome', 'genres', 'creators', 'generating'] as const
type Step = typeof STEPS[number]

// Show a curated subset of creators for initial pick
const ONBOARDING_TICKERS = [
  'APDHILLON', 'MRBEAST', 'KAICENAT', 'SABRINA', 'LILNASX',
  'TYLERTC', 'NEWJEANS', 'PESOPLUMA', 'CHARLI', 'DOJACAT',
  'XQC', 'HANUMANKIND',
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
  const { updateInterests, currentUser } = useAuth()

  const [step, setStep] = useState<Step>('welcome')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedCreators, setSelectedCreators] = useState<string[]>([])
  const [loadStep, setLoadStep] = useState(0)

  const onboardingCreators = creators.filter(c => ONBOARDING_TICKERS.includes(c.ticker))

  function toggleGenre(id: string) {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  function toggleCreator(ticker: string) {
    setSelectedCreators(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
    )
  }

  async function startGenerating() {
    setStep('generating')
    if (selectedGenres.length > 0) {
      updateInterests(selectedGenres)
    }
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 900))
      setLoadStep(i + 1)
    }
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

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      {/* Gold ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.12) 0%, transparent 60%)' }}
      />

      {/* Progress bar */}
      {step !== 'generating' && (
        <div className="absolute top-0 left-0 right-0 h-[2px] z-20">
          <motion.div
            className="h-full bg-hype-gold"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease }}
          />
        </div>
      )}

      {/* Back button */}
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

        {/* ── STEP: Welcome ──────────────────────────────────────────────── */}
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

        {/* ── STEP: Genres ───────────────────────────────────────────────── */}
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

            <div className="grid grid-cols-2 gap-2.5">
              {genres.map(genre => {
                const selected = selectedGenres.includes(genre.id)
                return (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
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
                    <span className="text-2xl mb-2 block">{genre.emoji}</span>
                    <p className="text-white text-xs font-bold leading-tight">{genre.label}</p>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── STEP: Creators ─────────────────────────────────────────────── */}
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
                    className={`relative rounded-2xl p-3 flex flex-col items-center gap-2 text-center transition-all duration-200 border ${
                      selected
                        ? 'border-hype-gold bg-hype-gold/10'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-hype-gold flex items-center justify-center">
                        <Check size={9} className="text-[#0A0A0A]" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${creator.coverColor} flex items-center justify-center text-white text-sm font-black`}>
                      {creator.avatar}
                    </div>
                    <p className="text-white text-[10px] font-semibold leading-tight">{creator.name}</p>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── STEP: Generating ───────────────────────────────────────────── */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex flex-col items-center justify-center px-8 text-center"
          >
            {/* Pulsing logo orb */}
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

      {/* Fixed CTA bottom — genres and creators steps */}
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
              ? selectedGenres.length > 0 ? `${selectedGenres.length} genres selected` : 'Skip to use defaults'
              : selectedCreators.length > 0 ? `${selectedCreators.length} creators selected` : 'Skip this step'
            }
          </p>
        </div>
      )}
    </div>
  )
}

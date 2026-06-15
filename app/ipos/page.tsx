'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import { ipoCreators } from '@/lib/mock-data'
import { formatLargeNumber, cn } from '@/lib/utils'
import { fadeUp, reveal, sectionReveal, ease } from '@/lib/motion'
import type { IPOCreator } from '@/types'

// ── Countdown timer ───────────────────────────────────────────────────────────

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number }

function getTimeLeft(dateStr: string): TimeLeft {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [t, setT] = useState<TimeLeft>(getTimeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const blocks = [
    { value: t.days, label: 'days' },
    { value: t.hours, label: 'hrs' },
    { value: t.minutes, label: 'min' },
    { value: t.seconds, label: 'sec' },
  ]

  return (
    <div className="flex items-end gap-3">
      {blocks.map(({ value, label }, i) => (
        <div key={label} className="countdown-block">
          <span className="countdown-num text-white">{String(value).padStart(2, '0')}</span>
          <span className="countdown-label text-white">{label}</span>
          {i < 3 && (
            <span className="absolute -right-2 bottom-4 text-white/30 font-bold text-lg" style={{ position: 'static', marginLeft: -6, marginRight: -6, alignSelf: 'center', paddingBottom: 12 }}>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Featured IPO card — cinematic, full-width ─────────────────────────────────

function FeaturedIPOCard({ ipo }: { ipo: IPOCreator }) {
  const progress = (ipo.fundingProgress / ipo.fundraisingGoal) * 100
  const isOpen = ipo.status === 'open'

  return (
    <Link href={`/ipos/${ipo.id}`}>
      <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: 420 }}>
        {/* Background */}
        {ipo.imageUrl ? (
          <img
            src={ipo.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', ipo.coverColor)} />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          {/* Status */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-hype-green" style={{ boxShadow: '0 0 6px #10B981' }} />
            <span className="section-label text-hype-green">Live · Funding Now</span>
          </div>

          {/* Creator name */}
          <h2 className="text-white font-black text-4xl tracking-tight leading-none mb-1">
            {ipo.name}
          </h2>
          <p className="text-white/50 text-sm mb-5">
            {ipo.category} · {ipo.followers} fans
          </p>

          {/* Countdown */}
          <div className="mb-5">
            <p className="text-white/35 text-[9px] tracking-widest uppercase mb-2">Closes In</p>
            <Countdown targetDate={ipo.launchDate} />
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs">
                {formatLargeNumber(ipo.fundingProgress)} raised
              </span>
              <span className="text-hype-green font-bold text-sm tabular">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="h-full bg-hype-green rounded-full"
              />
            </div>
            <p className="text-white/30 text-[10px] mt-1.5">
              Goal: {formatLargeNumber(ipo.fundraisingGoal)} · {ipo.totalShares.toLocaleString()} shares at ${ipo.initialPrice.toFixed(2)}
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={e => e.preventDefault()}
            className="flex items-center justify-center gap-2 w-full h-13 py-3.5 rounded-2xl bg-hype-gold text-[#0A0A0A] font-bold text-[13px] hover:bg-hype-gold-dim transition-all active:scale-[0.99] shadow-[0_4px_24px_rgba(201,168,76,0.3)]"
          >
            {isOpen ? 'Invest Now' : 'Join Waitlist'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Link>
  )
}

// ── Secondary IPO card — more compact ────────────────────────────────────────

function SecondaryIPOCard({ ipo, delay = 0 }: { ipo: IPOCreator; delay?: number }) {
  const progress = (ipo.fundingProgress / ipo.fundraisingGoal) * 100
  const isOpen = ipo.status === 'open'
  const isComingSoon = ipo.status === 'coming_soon'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease, delay }}
      className="premium-card rounded-3xl overflow-hidden"
    >
      {/* Header image */}
      <div className={cn('relative h-28 bg-gradient-to-br overflow-hidden', ipo.coverColor)}>
        {ipo.imageUrl && (
          <img src={ipo.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-hype-surface/90 to-black/20" />
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/40 text-[9px] tracking-widest uppercase mb-0.5">{ipo.category}</p>
              <h3 className="text-white font-black text-xl tracking-tight">{ipo.name}</h3>
            </div>
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider',
                isOpen
                  ? 'bg-hype-green/20 text-hype-green border border-hype-green/30'
                  : isComingSoon
                  ? 'bg-hype-gold/20 text-hype-gold border border-hype-gold/30'
                  : 'bg-hype-indigo/20 text-hype-indigo border border-hype-indigo/30',
              )}
            >
              {isComingSoon ? 'Coming Soon' : isOpen ? 'Open' : 'Waitlist'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Pitch quote */}
        <p className="text-hype-secondary text-sm leading-relaxed mb-4 line-clamp-2">
          &ldquo;{ipo.pitch.split('.')[0]}.&rdquo;
        </p>

        {/* Key stats */}
        <div className="flex items-center gap-5 mb-4">
          <div>
            <p className="text-hype-text font-black text-base tabular">
              ${ipo.initialPrice.toFixed(2)}
            </p>
            <p className="text-hype-dim text-[9px] uppercase tracking-wider mt-0.5">IPO Price</p>
          </div>
          <div className="w-px h-8 bg-hype-border" />
          <div>
            <p className="text-hype-text font-black text-base tabular">
              {formatLargeNumber(ipo.fundraisingGoal)}
            </p>
            <p className="text-hype-dim text-[9px] uppercase tracking-wider mt-0.5">Goal</p>
          </div>
          <div className="w-px h-8 bg-hype-border" />
          <div className="flex items-center gap-1">
            <Users size={11} className="text-hype-muted" />
            <p className="text-hype-text font-black text-base">{ipo.followers}</p>
            <p className="text-hype-dim text-[9px] uppercase tracking-wider">fans</p>
          </div>
        </div>

        {/* Progress */}
        {!isComingSoon && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-hype-muted tabular">
                {formatLargeNumber(ipo.fundingProgress)} raised
              </span>
              <span className="text-hype-green font-bold tabular">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-hype-surface-3 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(progress, 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-hype-green rounded-full"
              />
            </div>
          </div>
        )}

        {isComingSoon && ipo.daysUntilLaunch && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-hype-gold/5 border border-hype-gold/20">
            <Clock size={12} className="text-hype-gold" />
            <p className="text-hype-gold text-xs font-semibold">
              Launching in {ipo.daysUntilLaunch} days
            </p>
          </div>
        )}

        {/* CTA */}
        <button className={cn(
          'w-full py-3 rounded-2xl text-[12px] font-bold transition-all',
          isOpen
            ? 'bg-hype-gold text-[#0A0A0A] hover:bg-hype-gold-dim shadow-[0_2px_16px_rgba(201,168,76,0.2)]'
            : 'border border-hype-border text-hype-muted hover:border-hype-border-light hover:text-hype-secondary',
        )}>
          {isComingSoon ? `Notify Me · ${ipo.daysUntilLaunch}d` : isOpen ? 'Invest Now' : 'Join Waitlist'}
        </button>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IPOsPage() {
  const openIPOs = ipoCreators.filter(i => i.status === 'open')
  const featuredIPO = openIPOs[0] ?? ipoCreators[0]
  const otherIPOs = ipoCreators.filter(i => i.id !== featuredIPO?.id)

  return (
    <div className="pb-32">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-8 pb-6">
        <motion.p {...fadeUp(0)} className="section-label text-hype-gold mb-3">
          Creator IPOs
        </motion.p>
        <motion.h1 {...fadeUp(0.07)} className="page-headline text-hype-text mb-2">
          THE NEXT<br />WAVE
        </motion.h1>
        <motion.p {...fadeUp(0.13)} className="text-hype-muted text-sm max-w-[260px]">
          Back emerging talent before the market opens. Own a piece of the culture.
        </motion.p>

        {/* Quick stats */}
        <motion.div {...fadeUp(0.18)} className="flex items-center gap-6 mt-5">
          <div>
            <p className="text-hype-text font-black text-2xl tabular tracking-tight">
              {openIPOs.length}
            </p>
            <p className="text-hype-muted text-[10px] uppercase tracking-wider mt-0.5">Open Now</p>
          </div>
          <div className="w-px h-8 bg-hype-border" />
          <div>
            <p className="text-hype-text font-black text-2xl tabular tracking-tight">
              {ipoCreators.length}
            </p>
            <p className="text-hype-muted text-[10px] uppercase tracking-wider mt-0.5">Total Launches</p>
          </div>
          <div className="w-px h-8 bg-hype-border" />
          <div>
            <p className="text-hype-green font-black text-2xl tabular tracking-tight">
              {formatLargeNumber(ipoCreators.reduce((s, i) => s + i.fundingProgress, 0))}
            </p>
            <p className="text-hype-muted text-[10px] uppercase tracking-wider mt-0.5">Raised</p>
          </div>
        </motion.div>
      </div>

      {/* ── What are Creator Shares ────────────────────────────────────── */}
      <motion.div
        {...reveal(0.05)}
        className="mx-5 mb-8 px-4 py-3.5 rounded-2xl border-l-2 border-hype-gold bg-hype-gold/5"
      >
        <div className="flex items-center gap-2 mb-1">
          <Zap size={12} className="text-hype-gold" />
          <p className="text-hype-gold text-xs font-bold uppercase tracking-wider">
            What are Creator Shares?
          </p>
        </div>
        <p className="text-hype-secondary text-xs leading-relaxed">
          Participation in a creator&apos;s revenue pool. As they grow, shareholders earn quarterly distributions — not ownership, but a real stake in their journey.
        </p>
      </motion.div>

      {/* ── Featured (biggest open IPO) ────────────────────────────────── */}
      {featuredIPO && (
        <motion.section {...sectionReveal} className="px-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-1 rounded-full bg-hype-green" />
            <span className="section-label text-hype-green">Featured Launch</span>
          </div>
          <FeaturedIPOCard ipo={featuredIPO} />
        </motion.section>
      )}

      {/* ── Other launches ────────────────────────────────────────────── */}
      {otherIPOs.length > 0 && (
        <motion.section {...sectionReveal} className="px-5 mb-8">
          <p className="text-hype-text font-black text-xl leading-none tracking-tight mb-5">
            More Launches
          </p>
          <div className="space-y-4">
            {otherIPOs.map((ipo, i) => (
              <SecondaryIPOCard key={ipo.id} ipo={ipo} delay={i * 0.07} />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── How it works ──────────────────────────────────────────────── */}
      <motion.section {...sectionReveal} className="px-5">
        <p className="text-hype-text font-black text-xl leading-none tracking-tight mb-5">
          How It Works
        </p>
        <div className="space-y-4">
          {[
            {
              step: '01',
              title: 'Creator Launches',
              body: 'Verified creators open a funding window. Set the goal, the share count, and the initial price.',
            },
            {
              step: '02',
              title: 'Community Backs Them',
              body: 'Investors back the creator during the funding window. No trading yet — just conviction.',
            },
            {
              step: '03',
              title: 'Shares Go Live',
              body: 'Once funded, shares trade on the open market. Price moves with the creator\'s cultural momentum.',
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-hype-surface-2 border border-hype-border flex items-center justify-center flex-shrink-0">
                <span className="text-hype-gold text-[10px] font-black">{step}</span>
              </div>
              <div>
                <p className="text-hype-text text-sm font-bold mb-0.5">{title}</p>
                <p className="text-hype-muted text-xs leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="text-center mt-10 px-5">
        <p className="text-hype-dim text-[10px] leading-relaxed">
          Mock investing only · Creator Shares ≠ equity · Not financial advice
        </p>
      </div>
    </div>
  )
}

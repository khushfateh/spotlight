'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Compass, Zap, Trophy, MapPin } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { SupabaseProfile } from '@/lib/supabase/types'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'

const ease = [0.16, 1, 0.3, 1] as const

function DiscoveryRankBadge({ rank }: { rank: string }) {
  if (rank === 'Top Discoverer' || rank === 'Elite')
    return <span className="text-hype-gold text-xs"><Trophy size={12} className="inline mr-1" />{rank}</span>
  if (rank === 'Culture Scout' || rank === 'Scout')
    return <span className="text-hype-indigo text-xs"><Compass size={12} className="inline mr-1" />{rank}</span>
  return <span className="text-hype-green text-xs"><Zap size={12} className="inline mr-1" />{rank}</span>
}

type ProfileState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'loaded'; profile: SupabaseProfile }

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const rawSlug = typeof params.username === 'string' ? params.username : ''
  const username = rawSlug.replace(/^@/, '').toLowerCase()

  const [state, setState] = useState<ProfileState>({ status: 'loading' })

  useEffect(() => {
    if (!username || !supabase) {
      setState({ status: 'not_found' })
      return
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setState({ status: 'loaded', profile: data })
        else setState({ status: 'not_found' })
      })
  }, [username])

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-hype-gold/30 border-t-hype-gold animate-spin" />
      </div>
    )
  }

  if (state.status === 'not_found') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 opacity-60"><SpotlightWordmark /></div>
        <h1 className="text-white font-black text-2xl mb-2">@{username}</h1>
        <p className="text-white/40 text-sm mb-8">This profile doesn&apos;t exist yet.</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/50 text-sm hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Go back
        </button>
      </div>
    )
  }

  const { profile } = state
  const displayName = profile.display_name || profile.full_name || `@${username}`
  const joinedYear = new Date(profile.created_at).getFullYear()
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Spotlight glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(201,168,76,0.09) 0%, transparent 65%)' }}
      />

      {/* Header */}
      <div className="relative z-10 px-4 pt-6 pb-2 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <Link href="/" className="opacity-60 hover:opacity-90 transition-opacity">
          <SpotlightWordmark />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="relative z-10 px-5 pt-6 pb-24"
      >
        {/* Avatar + identity */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-2 ring-white/10">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-black text-2xl"
                style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, rgba(201,168,76,0.08) 100%)' }}
              >
                {initials}
              </div>
            )}
          </div>

          <h1 className="text-white font-black text-2xl tracking-tight mb-0.5">{displayName}</h1>
          <p className="text-white/40 text-sm mb-2">@{username}</p>

          {profile.bio && (
            <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-3">{profile.bio}</p>
          )}

          <div className="flex items-center gap-1.5 text-white/30 text-xs">
            <MapPin size={11} />
            <span>Joined {joinedYear}</span>
          </div>
        </div>

        {/* Discovery badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.05] border border-white/10">
            <DiscoveryRankBadge rank={profile.discovery_rank} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Creators Spotted" value={profile.creators_spotted} />
          <StatCard label="Discovery Score" value={profile.discovery_score} />
          <StatCard label="Breakouts Found" value={profile.breakouts_identified} />
          <StatCard label="Avg Lead" value={profile.avg_lead_days > 0 ? `${profile.avg_lead_days}d` : '—'} />
        </div>

        {/* New Spotter badge for brand-new accounts */}
        {profile.creators_spotted < 3 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-hype-gold/10 border border-hype-gold/20">
              <span className="text-sm">✨</span>
              <span className="text-hype-gold text-xs font-semibold">New Spotter</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 text-center">
      <p className="text-white font-black text-xl mb-0.5">{value}</p>
      <p className="text-white/35 text-xs">{label}</p>
    </div>
  )
}

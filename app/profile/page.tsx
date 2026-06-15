'use client'

import { Settings, ChevronRight, Star, LogOut, Bell, Shield, HelpCircle, Zap, Compass, Trophy, Target, Clock, Award } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { holdings } from '@/lib/mock-data'
import { getMomentum, getMomentumTier } from '@/lib/mock-data'
import { genres } from '@/lib/mock-data/genres'

function getDiscoveryStatus(holdingCount: number, avgMomentum: number) {
  if (avgMomentum >= 80 && holdingCount >= 4) {
    return { label: 'Top Discoverer', icon: Trophy, color: 'text-hype-gold', bg: 'bg-hype-gold/10 border-hype-gold/30', desc: 'Found rising talent before anyone else.' }
  }
  if (avgMomentum >= 65 || holdingCount >= 3) {
    return { label: 'Culture Scout', icon: Compass, color: 'text-hype-indigo', bg: 'bg-hype-indigo/10 border-hype-indigo/30', desc: 'Identifying cultural momentum early.' }
  }
  return { label: 'Early Spotter', icon: Zap, color: 'text-hype-green', bg: 'bg-hype-green/10 border-hype-green/30', desc: 'Spotting creators before the world catches on.' }
}

const BADGE_ICONS: Record<string, string> = {
  'First 100': '🥇',
  'First 50': '🥈',
  'First 10': '🏅',
  'OG Spotter': '⭐',
  'Trending Caller': '📈',
  'Hidden Gem Hunter': '💎',
}

export default function ProfilePage() {
  const { user, userMode, setUserMode } = useUser()
  const { currentUser, logout } = useAuth()

  const avgMomentum = holdings.length
    ? Math.round(holdings.reduce((sum, h) => sum + getMomentum(h.ticker).score, 0) / holdings.length)
    : 0
  const status = getDiscoveryStatus(holdings.length, avgMomentum)
  const StatusIcon = status.icon

  // Use rich user data from AuthContext when available
  const discoveryScore = currentUser?.discoveryScore ?? 0
  const creatorsSpotted = currentUser?.creatorsSpotted ?? holdings.length
  const breakoutsIdentified = currentUser?.breakoutsIdentified ?? 0
  const avgLeadDays = currentUser?.avgLeadDays ?? 0
  const momentumAccuracy = currentUser?.momentumAccuracy ?? 0
  const discoveryRank = currentUser?.discoveryRank ?? status.label
  const badges = currentUser?.badges ?? []
  const userInterests = currentUser?.interests ?? []

  const userGenres = genres.filter(g => userInterests.includes(g.id))

  return (
    <div className="px-4 pt-4 pb-2 space-y-5">

      {/* Profile Card */}
      <div className="elevated-card rounded-3xl p-5">
        <div className="flex items-start gap-4">
          {currentUser ? (
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentUser.coverColor} flex items-center justify-center text-white text-xl font-black`}>
              {currentUser.initials}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-hype-purple to-hype-indigo flex items-center justify-center text-white text-xl font-bold">
              {user.avatar}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h2 className="text-hype-text font-bold text-lg">{user.name}</h2>
              <Badge variant="gold" size="sm">Pro</Badge>
            </div>
            <p className="text-hype-muted text-xs font-mono mb-1">{user.username}</p>
            <p className="text-hype-secondary text-xs leading-relaxed">{user.bio || 'Cultural discoverer.'}</p>
          </div>
        </div>

        {/* Discovery Rank Badge */}
        <div className={`mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl border ${status.bg}`}>
          <StatusIcon size={16} className={status.color} />
          <div className="flex-1">
            <p className={`text-xs font-bold ${status.color}`}>{discoveryRank}</p>
            <p className="text-hype-muted text-[10px]">{status.desc}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-hype-border">
          <div className="text-center">
            <p className="text-hype-text font-bold">{creatorsSpotted}</p>
            <p className="text-hype-dim text-[10px]">Spotted</p>
          </div>
          <div className="text-center">
            <p className="text-hype-gold font-bold tabular">{avgMomentum}</p>
            <p className="text-hype-dim text-[10px]">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="text-hype-gold font-bold text-xs">{getMomentumTier(avgMomentum)}</p>
            <p className="text-hype-dim text-[10px]">Tier</p>
          </div>
        </div>
      </div>

      {/* Discovery Score card */}
      {discoveryScore > 0 && (
        <div className="premium-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target size={14} className="text-hype-gold" />
            <p className="text-hype-text font-semibold text-sm">Discovery Score</p>
          </div>

          {/* Score ring */}
          <div className="flex items-center gap-5 mb-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke="#C9A84C" strokeWidth="6"
                  strokeDasharray={`${(discoveryScore / 100) * 201} 201`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white font-black text-xl">{discoveryScore}</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-hype-muted">Breakouts found</span>
                  <span className="text-white font-semibold">{breakoutsIdentified}</span>
                </div>
                <div className="h-1 bg-hype-surface-3 rounded-full">
                  <div className="h-full bg-hype-gold rounded-full" style={{ width: `${Math.min((breakoutsIdentified / 10) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-hype-muted">Momentum accuracy</span>
                  <span className="text-white font-semibold">{momentumAccuracy}%</span>
                </div>
                <div className="h-1 bg-hype-surface-3 rounded-full">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${momentumAccuracy}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="inset-surface rounded-xl p-3 flex items-center gap-2">
              <Clock size={13} className="text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-white text-xs font-bold">{avgLeadDays} days</p>
                <p className="text-hype-dim text-[9px]">Avg lead time</p>
              </div>
            </div>
            <div className="inset-surface rounded-xl p-3 flex items-center gap-2">
              <Award size={13} className="text-hype-gold flex-shrink-0" />
              <div>
                <p className="text-white text-xs font-bold">{breakoutsIdentified}</p>
                <p className="text-hype-dim text-[9px]">Breakouts called</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="premium-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-hype-gold" />
            <p className="text-hype-text font-semibold text-sm">Discovery Badges</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-hype-gold/10 border border-hype-gold/20">
                <span className="text-sm">{BADGE_ICONS[badge] ?? '🏷️'}</span>
                <span className="text-hype-gold text-[10px] font-bold">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genre Interests */}
      {userGenres.length > 0 && (
        <div className="premium-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-hype-text font-semibold text-sm">My Genres</p>
            <a href="/onboarding" className="text-hype-gold text-xs font-medium hover:underline">Edit</a>
          </div>
          <div className="flex flex-wrap gap-2">
            {userGenres.map(genre => (
              <div key={genre.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hype-border bg-hype-surface">
                <span className="text-sm">{genre.emoji}</span>
                <span className="text-hype-text text-xs font-medium">{genre.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="premium-card rounded-2xl p-4">
        <p className="text-hype-text font-semibold text-sm mb-3">Account Mode</p>
        <div className="flex gap-2">
          <button
            onClick={() => setUserMode('investor')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
              userMode === 'investor'
                ? 'bg-hype-gold/10 border-hype-gold/30 text-hype-gold'
                : 'bg-hype-surface-2 border-hype-border text-hype-muted hover:text-hype-secondary'
            }`}
          >
            Spotter
          </button>
          <button
            onClick={() => setUserMode('creator')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
              userMode === 'creator'
                ? 'bg-hype-purple/10 border-hype-purple/30 text-hype-purple'
                : 'bg-hype-surface-2 border-hype-border text-hype-muted hover:text-hype-secondary'
            }`}
          >
            Creator
          </button>
        </div>
        <p className="text-hype-dim text-[10px] mt-2 text-center">
          Switch to access {userMode === 'investor' ? 'Creator Dashboard' : 'Discovery Portfolio'}
        </p>
      </div>

      {/* Discovery Summary */}
      <div className="premium-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-hype-text font-semibold text-sm">Discovery Summary</p>
          <a href="/portfolio" className="text-hype-gold text-xs font-medium hover:underline">View all</a>
        </div>
        <div className="flex items-center gap-3 p-3 inset-surface rounded-xl">
          <Compass size={20} className="text-hype-gold flex-shrink-0" />
          <div>
            <p className="text-hype-text font-bold">{creatorsSpotted} creators spotted</p>
            <p className="text-hype-gold text-xs font-semibold">Avg momentum: {avgMomentum} · {getMomentumTier(avgMomentum)}</p>
          </div>
        </div>
      </div>

      {/* Settings Menu */}
      <div className="premium-card rounded-2xl overflow-hidden divide-y divide-hype-border">
        {[
          { icon: Bell, label: 'Notifications', value: 'On' },
          { icon: Shield, label: 'Security & KYC', value: 'Mock' },
          { icon: Settings, label: 'Preferences', value: '' },
          { icon: HelpCircle, label: 'Help & Support', value: '' },
        ].map(({ icon: Icon, label, value }) => (
          <button key={label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-hype-surface-2 transition-colors">
            <Icon size={16} className="text-hype-muted flex-shrink-0" />
            <span className="text-hype-text text-sm font-medium flex-1 text-left">{label}</span>
            {value && <span className="text-hype-dim text-xs">{value}</span>}
            <ChevronRight size={14} className="text-hype-dim" />
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="premium-card rounded-2xl p-4">
        <p className="text-hype-dim text-[10px] leading-relaxed">
          SPOTLIGHT is a demonstration platform. Cultural Shares represent participation in a creator&apos;s discovery pool and do not constitute equity ownership, investment contracts, or financial instruments. This is not financial advice.
        </p>
      </div>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-hype-red text-sm font-semibold bg-transparent border border-hype-red/20 hover:bg-hype-red/8 transition-colors"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  )
}

'use client'

import { Settings, ChevronRight, Star, TrendingUp, LogOut, Bell, Shield, HelpCircle, Zap, Compass, Trophy } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { Badge } from '@/components/ui/Badge'
import { totalPortfolioValue, totalPnlPercent, holdings } from '@/lib/mock-data'
import { formatLargeNumber, formatPercent } from '@/lib/utils'

function getInvestorStatus(pnlPercent: number, holdingCount: number) {
  if (pnlPercent >= 100 && holdingCount >= 4) {
    return { label: 'Top Discoverer', icon: Trophy, color: 'text-hype-gold', bg: 'bg-hype-gold/10 border-hype-gold/30', desc: 'Found rising talent before anyone else.' }
  }
  if (pnlPercent >= 40 || holdingCount >= 3) {
    return { label: 'Culture Scout', icon: Compass, color: 'text-hype-indigo', bg: 'bg-hype-indigo/10 border-hype-indigo/30', desc: 'Identifying cultural momentum early.' }
  }
  return { label: 'Early Backer', icon: Zap, color: 'text-hype-green', bg: 'bg-hype-green/10 border-hype-green/30', desc: 'Backing creators at the ground floor.' }
}

export default function ProfilePage() {
  const { user, userMode, setUserMode } = useUser()
  const status = getInvestorStatus(totalPnlPercent, holdings.length)
  const StatusIcon = status.icon

  return (
    <div className="px-4 pt-4 pb-2 space-y-5">
      {/* Profile Card */}
      <div className="elevated-card rounded-3xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-hype-purple to-hype-indigo flex items-center justify-center text-white text-xl font-bold">
            {user.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-hype-text font-bold text-lg">{user.name}</h2>
              <Badge variant="gold" size="sm">Pro</Badge>
            </div>
            <p className="text-hype-muted text-xs font-mono mb-1">{user.username}</p>
            <p className="text-hype-secondary text-xs leading-relaxed">{user.bio}</p>
          </div>
        </div>

        {/* Investor Status Badge */}
        <div className={`mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl border ${status.bg}`}>
          <StatusIcon size={16} className={status.color} />
          <div className="flex-1">
            <p className={`text-xs font-bold ${status.color}`}>{status.label}</p>
            <p className="text-hype-muted text-[10px]">{status.desc}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-hype-border">
          <div className="text-center">
            <p className="text-hype-text font-bold">{holdings.length}</p>
            <p className="text-hype-dim text-[10px]">Holdings</p>
          </div>
          <div className="text-center">
            <p className="text-hype-green font-bold tabular">{formatLargeNumber(totalPortfolioValue)}</p>
            <p className="text-hype-dim text-[10px]">Portfolio</p>
          </div>
          <div className="text-center">
            <p className="text-hype-green font-bold tabular">+{formatPercent(totalPnlPercent)}</p>
            <p className="text-hype-dim text-[10px]">All-time</p>
          </div>
        </div>
      </div>

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
            Investor
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
          Switch to access {userMode === 'investor' ? 'Creator Dashboard' : 'Investor Portfolio'}
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="premium-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-hype-text font-semibold text-sm">Portfolio Summary</p>
          <a href="/portfolio" className="text-hype-gold text-xs font-medium hover:underline">View all</a>
        </div>
        <div className="flex items-center gap-3 p-3 inset-surface rounded-xl">
          <TrendingUp size={20} className="text-hype-green flex-shrink-0" />
          <div>
            <p className="text-hype-text font-bold tabular">{formatLargeNumber(totalPortfolioValue)}</p>
            <p className="text-hype-green text-xs font-semibold tabular">+{formatPercent(totalPnlPercent)} all time</p>
          </div>
        </div>
      </div>

      {/* Watchlist */}
      <div className="premium-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star size={14} className="text-hype-gold" />
          <p className="text-hype-text font-semibold text-sm">Watchlist</p>
        </div>
        <div className="text-center py-4">
          <p className="text-hype-muted text-xs">No creators watched yet</p>
          <a href="/explore" className="text-hype-gold text-xs font-medium hover:underline">Explore creators →</a>
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
          SPOTLIGHT is a demonstration platform. Cultural Shares represent participation in a creator&apos;s revenue pool and do not constitute equity ownership, investment contracts, or financial instruments. This is not financial advice.
        </p>
      </div>

      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-hype-red text-sm font-semibold bg-transparent border border-hype-red/20 hover:bg-hype-red/8 transition-colors">
        <LogOut size={16} />
        Sign Out (Mock)
      </button>
    </div>
  )
}

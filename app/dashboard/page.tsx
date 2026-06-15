'use client'

import { useState } from 'react'
import { TrendingUp, Users, DollarSign, BarChart3, Plus, Bell } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import PostCard from '@/components/community/PostCard'
import { communityPosts } from '@/lib/mock-data'

export default function CreatorDashboardPage() {
  const [isPostingUpdate, setIsPostingUpdate] = useState(false)
  const [updateText, setUpdateText] = useState('')

  const creatorPosts = communityPosts.filter(p => p.creatorId === 'apdhillon')

  const stats = [
    { icon: DollarSign, label: 'Capital Raised', value: '$142,500', change: '+$12k this month', up: true },
    { icon: TrendingUp, label: 'Share Price', value: '$2.45', change: '+12.3% today', up: true },
    { icon: Users, label: 'Shareholders', value: '1,204', change: '+84 this week', up: true },
    { icon: BarChart3, label: 'Revenue Pool', value: '$8,340', change: 'Q2 distribution', up: true },
  ]

  return (
    <div className="px-4 pt-4 pb-2 space-y-5">
      {/* Creator Identity */}
      <div className="elevated-card rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Avatar initials="AD" gradientClass="from-purple-600 to-pink-600" size="lg" isVerified />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-hype-text font-black text-xl">AP Dhillon</h1>
              <Badge variant="green" size="sm">Active</Badge>
            </div>
            <p className="text-hype-muted text-xs font-mono">$APDHILLON · Music</p>
          </div>
        </div>

        {/* Score bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-hype-muted">Creator Score</span>
            <span className="text-hype-text font-bold">84<span className="text-hype-dim font-normal">/100</span></span>
          </div>
          <div className="h-1 bg-hype-surface-3 rounded-full overflow-hidden">
            <div className="h-full bg-hype-gold rounded-full" style={{ width: '84%' }} />
          </div>
          <p className="text-hype-dim text-[10px] mt-1">Top 15% of all creators</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ icon: Icon, label, value, change, up }) => (
          <div key={label} className="premium-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-hype-gold/10 flex items-center justify-center">
                <Icon size={14} className="text-hype-gold" />
              </div>
              <span className="text-hype-muted text-[10px]">{label}</span>
            </div>
            <p className="text-hype-text font-bold text-lg tabular">{value}</p>
            <p className={`text-[10px] font-semibold mt-0.5 ${up ? 'text-hype-green' : 'text-hype-red'}`}>{change}</p>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <div className="premium-card rounded-2xl p-4">
        <p className="text-hype-text font-semibold text-sm mb-3">Revenue Sources</p>
        <div className="space-y-3">
          {[
            { source: 'Streaming (Spotify / Apple)', amount: '$4,200', pct: 50 },
            { source: 'Brand Deals', amount: '$2,500', pct: 30 },
            { source: 'Merchandise', amount: '$1,000', pct: 12 },
            { source: 'YouTube AdSense', amount: '$640', pct: 8 },
          ].map(({ source, amount, pct }) => (
            <div key={source}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-hype-secondary">{source}</span>
                <span className="text-hype-text font-semibold tabular">{amount}</span>
              </div>
              <div className="h-1 bg-hype-surface-3 rounded-full overflow-hidden">
                <div className="h-full bg-hype-green rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-hype-dim text-[10px] mt-3">10% contributed to Revenue Pool · Quarterly distribution</p>
      </div>

      {/* Top Shareholders */}
      <div className="premium-card rounded-2xl p-4">
        <p className="text-hype-text font-semibold text-sm mb-3">Top Shareholders</p>
        <div className="space-y-0 divide-y divide-hype-border">
          {[
            { name: 'RajveerSingh', shares: '12,500', pct: '6.25%' },
            { name: 'MusicInvestor99', shares: '8,200', pct: '4.1%' },
            { name: 'LongTermHold', shares: '5,500', pct: '2.75%' },
            { name: 'Others', shares: '93,800', pct: '86.9%' },
          ].map(({ name, shares, pct }) => (
            <div key={name} className="flex items-center justify-between py-2.5">
              <span className="text-hype-text text-xs font-medium">{name}</span>
              <div className="flex items-center gap-3">
                <span className="text-hype-muted text-xs tabular">{shares} shares</span>
                <span className="text-hype-green text-xs font-semibold tabular">{pct}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post an Update */}
      <div className="premium-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-hype-text font-semibold text-sm">Post Update to Shareholders</p>
          <Bell size={14} className="text-hype-muted" />
        </div>
        {!isPostingUpdate ? (
          <Button variant="secondary" size="md" fullWidth onClick={() => setIsPostingUpdate(true)}>
            <Plus size={14} />
            New Update
          </Button>
        ) : (
          <div className="space-y-3">
            <textarea
              value={updateText}
              onChange={e => setUpdateText(e.target.value)}
              placeholder="Share a milestone, announcement, or update with your shareholders..."
              rows={3}
              className="w-full bg-hype-surface-2 border border-hype-border rounded-xl p-3 text-hype-text text-sm placeholder:text-hype-muted outline-none focus:border-hype-border-light transition-colors resize-none"
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="md" onClick={() => { setIsPostingUpdate(false); setUpdateText('') }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={!updateText.trim()}
                onClick={() => { setIsPostingUpdate(false); setUpdateText('') }}
              >
                Post Update
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Community feed */}
      <div>
        <p className="text-hype-text font-semibold text-sm mb-3">Community Activity</p>
        <div className="space-y-3">
          {creatorPosts.slice(0, 2).map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>

      <div className="text-center pb-2">
        <p className="text-hype-dim text-[10px]">Mock creator dashboard · All data simulated</p>
      </div>
    </div>
  )
}

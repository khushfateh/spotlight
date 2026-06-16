'use client'

import { use, useState, useEffect } from 'react'
import { ArrowLeft, Star, Share2, TrendingUp, TrendingDown, Users, BarChart3, MessageCircle, Calendar, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import TradeSheet from '@/components/trading/TradeSheet'
import PostCard from '@/components/community/PostCard'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useTradeSheet } from '@/hooks/useTradeSheet'
import { useAuth } from '@/context/AuthContext'
import { getCreatorByTicker } from '@/lib/mock-data'
import { communityPosts } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { getMomentum, getMomentumTier } from '@/lib/mock-data'
import { getMomentumDrivers, driverCategoryLabel } from '@/lib/mock-data/momentum-drivers'
import { getEarlySpotters } from '@/lib/mock-data/spots'
import { logCreatorView } from '@/lib/services/interactionService'
import { useCreatorSpotifyData } from '@/hooks/useCreatorSpotifyData'

type Tab = 'Overview' | 'Community' | 'Updates'

export default function CreatorProfilePage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [isWatched, setIsWatched] = useState(false)
  const trade = useTradeSheet()
  const { currentUser } = useAuth()
  const { snapshot: spotifyData } = useCreatorSpotifyData(ticker)

  useEffect(() => {
    if (currentUser?.id) {
      logCreatorView(currentUser.id, ticker)
    }
  }, [currentUser?.id, ticker])

  const creator = getCreatorByTicker(ticker)

  if (!creator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-6xl mb-4">🤔</div>
        <h2 className="text-hype-text font-bold text-xl mb-2">Creator not found</h2>
        <p className="text-hype-secondary text-sm mb-6">We couldn&apos;t find <span className="font-mono text-hype-text">${ticker.toUpperCase()}</span></p>
        <Button variant="secondary" onClick={() => router.push('/explore')}>Browse Creators</Button>
      </div>
    )
  }

  const { score, delta } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const isDeltaUp = delta >= 0
  const firstName = creator.name.split(' ')[0]
  const creatorPosts = communityPosts.filter(p => p.creatorId === creator.id)
  const drivers = getMomentumDrivers(creator.ticker)
  const spotters = getEarlySpotters(creator.ticker, 5)

  const DRIVER_COLORS: Record<string, string> = {
    growth: 'text-emerald-400',
    community: 'text-blue-400',
    catalysts: 'text-hype-gold',
    discussion: 'text-purple-400',
    events: 'text-orange-400',
  }

  return (
    <>
      <div className="pb-2">
        {/* Hero Header */}
        <div className={cn('relative h-52 bg-gradient-to-br overflow-hidden', creator.coverColor)}>
          {(spotifyData?.imageUrl ?? creator.imageUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={spotifyData?.imageUrl ?? creator.imageUrl ?? ''}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top focus-reveal"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-hype-bg via-hype-bg/40 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setIsWatched(w => !w)}
                className={cn(
                  'w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors',
                  isWatched ? 'text-hype-gold' : 'text-white',
                )}
              >
                <Star size={16} fill={isWatched ? 'currentColor' : 'none'} />
              </button>
              <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-3">
            <Avatar
              initials={creator.avatar}
              gradientClass={creator.coverColor}
              imageUrl={spotifyData?.imageUrl ?? creator.imageUrl}
              size="xl"
              isVerified={creator.isVerified}
              className="border-2 border-hype-bg"
            />
            <div className="pb-1">
              <h1 className="text-white font-black text-xl">{creator.name}</h1>
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-xs font-mono">${creator.ticker}</span>
                <Badge variant="muted" size="sm">{creator.category}</Badge>
                <div className="flex items-center gap-1 text-white/70 text-xs">
                  <Users size={10} />
                  {creator.followers}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* Momentum Widget */}
          <div className="premium-card rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-hype-text font-black text-3xl metric-display tabular">{score}</p>
                <div className={cn('flex items-center gap-1 mt-0.5', isDeltaUp ? 'text-hype-green' : 'text-hype-red')}>
                  {isDeltaUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span className="font-bold text-sm tabular">
                    {isDeltaUp ? '+' : ''}{delta} pts this week
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-hype-muted text-xs">Momentum</p>
                <p className="text-hype-gold font-black text-lg tracking-wide">{tier}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-hype-border">
              {[
                { label: 'Followers', value: creator.followers },
                { label: 'Creator Score', value: `${creator.creatorScore}/100` },
                { label: 'Category', value: creator.category },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-hype-text font-semibold text-sm">{value}</p>
                  <p className="text-hype-dim text-[10px] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Spot / Release */}
          <div className="flex gap-3">
            <Button variant="buy" size="lg" fullWidth onClick={() => trade.openBuy(creator)}>
              Spot {firstName}
            </Button>
            <Button variant="sell" size="lg" fullWidth onClick={() => trade.openSell(creator)}>
              Release
            </Button>
          </div>

          <p className="text-hype-dim text-[10px] text-center">
            Add to your Discoveries · Early access, not ownership · Mock only
          </p>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-hype-surface rounded-xl border border-hype-border">
            {(['Overview', 'Community', 'Updates'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                  activeTab === tab ? 'bg-hype-surface-2 text-hype-text border border-hype-border' : 'text-hype-muted',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              {/* Story / Why they're trending */}
              {creator.story && (
                <div className="premium-card rounded-2xl p-4 border-l-2 border-hype-gold">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={12} className="text-hype-gold" />
                    <p className="text-hype-gold text-[10px] font-bold uppercase tracking-wider">Why They&apos;re Moving</p>
                  </div>
                  <p className="text-hype-secondary text-sm leading-relaxed">{creator.story}</p>
                </div>
              )}

              {/* Momentum Drivers */}
              {drivers.length > 0 && (
                <div className="premium-card rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-4">
                    <TrendingUp size={13} className="text-hype-gold" />
                    <p className="text-hype-text font-semibold text-sm">What&apos;s Driving Momentum</p>
                  </div>
                  <div className="space-y-3">
                    {drivers.map((driver, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 pb-3 border-b border-hype-border/50 last:border-0 last:pb-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-hype-text text-xs font-medium">{driver.label}</p>
                          <p className={cn('text-[9px] font-bold uppercase tracking-wider mt-0.5', DRIVER_COLORS[driver.category] ?? 'text-white/40')}>
                            {driverCategoryLabel[driver.category]}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {driver.value && <p className="text-hype-text text-xs font-bold">{driver.value}</p>}
                          {driver.delta && (
                            <p className={cn('text-[10px] font-semibold', driver.isPositive ? 'text-hype-green' : 'text-hype-red')}>
                              {driver.delta}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Early Spotters */}
              {spotters.length > 0 && (
                <div className="premium-card rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-4">
                    <Users size={13} className="text-hype-gold" />
                    <p className="text-hype-text font-semibold text-sm">Early Spotters</p>
                    <span className="ml-auto text-hype-dim text-[10px]">Who was here first</span>
                  </div>
                  <div className="space-y-3">
                    {spotters.map((spotter, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {spotter.userAvatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-hype-text text-xs font-semibold">{spotter.userName}</p>
                          {spotter.badge && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] bg-hype-gold/15 text-hype-gold font-bold mt-0.5">
                              {spotter.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-hype-dim text-[10px] flex-shrink-0">{spotter.daysAgo}d ago</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Catalysts */}
              {creator.catalysts && creator.catalysts.length > 0 && (
                <div className="premium-card rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Calendar size={13} className="text-hype-gold" />
                    <p className="text-hype-text font-semibold text-sm">Upcoming Catalysts</p>
                  </div>
                  <div className="space-y-3">
                    {creator.catalysts.map((catalyst, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          catalyst.impact === 'high' ? 'bg-hype-gold' : 'bg-hype-dim',
                        )} />
                        <div className="flex-1">
                          <p className="text-hype-text text-xs font-semibold">{catalyst.label}</p>
                          <p className="text-hype-muted text-[10px]">{catalyst.date}</p>
                        </div>
                        {catalyst.impact === 'high' && (
                          <span className="px-2 py-0.5 rounded-full bg-hype-gold/10 text-hype-gold text-[9px] font-semibold uppercase tracking-wider border border-hype-gold/20">
                            High Impact
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="premium-card rounded-2xl p-4">
                <p className="text-hype-text font-semibold text-sm mb-2">About</p>
                <p className="text-hype-secondary text-sm leading-relaxed">{creator.bio}</p>
              </div>

              {/* Spotify Data */}
              {spotifyData && (
                <div className="premium-card rounded-2xl p-4 border border-[#1DB954]/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                      <p className="text-hype-text font-semibold text-sm">Spotify</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1DB954]/10 text-[#1DB954] font-semibold">Live Data</span>
                  </div>

                  {spotifyData.recentReleases.length > 0 && (
                    <>
                      <p className="text-hype-muted text-[10px] font-semibold uppercase tracking-wider mb-2">Recent Releases</p>
                      <div className="space-y-2 mb-3">
                        {spotifyData.recentReleases.slice(0, 3).map(release => (
                          <a
                            key={release.id}
                            href={release.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 group"
                          >
                            {release.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={release.imageUrl} alt="" className="w-10 h-10 rounded-lg flex-shrink-0 object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-hype-text text-xs font-semibold truncate group-hover:text-[#1DB954] transition-colors">{release.name}</p>
                              <p className="text-hype-dim text-[9px] capitalize">{release.type} · {release.releaseDate} · {release.totalTracks} {release.totalTracks === 1 ? 'track' : 'tracks'}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </>
                  )}

                  <a
                    href={spotifyData.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#1DB954]/20 text-[#1DB954] text-xs font-semibold hover:bg-[#1DB954]/5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    Open on Spotify
                  </a>
                </div>
              )}

              {Object.keys(creator.socialHandles).length > 0 && (
                <div className="premium-card rounded-2xl p-4">
                  <p className="text-hype-text font-semibold text-sm mb-3">Social Channels</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(creator.socialHandles).map(([platform, handle]) => (
                      <div key={platform} className="flex items-center gap-1.5 px-3 py-1.5 inset-surface rounded-xl">
                        <span className="text-hype-text text-xs font-semibold capitalize">{platform}</span>
                        <span className="text-hype-muted text-xs">{handle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="premium-card rounded-2xl p-4">
                <p className="text-hype-text font-semibold text-sm mb-3 flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-hype-gold" />
                  Revenue Metrics
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(creator.revenueMetrics).map(([key, value]) => (
                    <div key={key} className="inset-surface rounded-xl p-3">
                      <p className="text-hype-text font-bold text-sm">{value}</p>
                      <p className="text-hype-dim text-[10px] capitalize mt-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-card rounded-2xl p-4">
                <p className="text-hype-text font-semibold text-sm mb-3">Share Distribution</p>
                {[
                  { label: 'Creator Treasury', pct: 70, color: 'bg-hype-purple' },
                  { label: 'Public Float', pct: 20, color: 'bg-hype-gold' },
                  { label: 'Platform Reserve', pct: 10, color: 'bg-hype-dim' },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="mb-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-hype-secondary">{label}</span>
                      <span className="text-hype-text font-semibold tabular">{pct}%</span>
                    </div>
                    <div className="h-1 bg-hype-surface-3 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community */}
          {activeTab === 'Community' && (
            <div className="space-y-3">
              {creatorPosts.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle size={32} className="text-hype-dim mx-auto mb-3" />
                  <p className="text-hype-text font-semibold mb-1">No posts yet</p>
                  <p className="text-hype-secondary text-sm">Be the first to discuss {creator.name}</p>
                </div>
              ) : (
                creatorPosts.map(post => <PostCard key={post.id} post={post} />)
              )}
            </div>
          )}

          {/* Updates */}
          {activeTab === 'Updates' && (
            <div className="space-y-3">
              <div className="premium-card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-hype-green" />
                  <span className="text-hype-muted text-xs">2 days ago</span>
                </div>
                <p className="text-hype-text font-semibold text-sm mb-1">New single dropping Friday</p>
                <p className="text-hype-secondary text-xs leading-relaxed">
                  Excited to announce my next release. This one&apos;s been in the works for 6 months. Pre-save link in bio. Shareholders first.
                </p>
              </div>
              <div className="premium-card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-hype-gold" />
                  <span className="text-hype-muted text-xs">1 week ago</span>
                </div>
                <p className="text-hype-text font-semibold text-sm mb-1">Q1 Revenue Update</p>
                <p className="text-hype-secondary text-xs leading-relaxed">
                  Streaming revenue grew 34% this quarter. Revenue pool distribution will be processed by end of month. Thank you for your belief in my journey.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <TradeSheet
        isOpen={trade.isOpen}
        creator={trade.creator}
        tradeType={trade.tradeType}
        step={trade.step as 'form' | 'confirm' | 'success' | 'error'}
        pendingOrder={trade.pendingOrder}
        isSubmitting={trade.isSubmitting}
        onClose={trade.close}
        onSubmitOrder={trade.submitOrder}
        onConfirmOrder={trade.confirmOrder}
        onReset={trade.reset}
      />
    </>
  )
}

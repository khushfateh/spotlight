'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed'
import { useAuth } from '@/context/AuthContext'
import { buildMockTasteProfile } from '@/lib/engine/tasteProfile'
import { buildAllCreatorSignals } from '@/lib/engine/creatorSignals'
import { scoreForHome } from '@/lib/engine/ranking'
import { genres } from '@/lib/mock-data/genres'

export default function RecommendationDebugPanel() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { currentUser, isSupabaseMode } = useAuth()
  const { sections, loading } = usePersonalizedFeed()

  if (process.env.NODE_ENV !== 'development') return null

  const userId = currentUser?.id ?? 'khush'

  // Build taste profile + top signals in mock mode only
  const profile = !isSupabaseMode ? buildMockTasteProfile(userId) : null
  const allSignals = !isSupabaseMode ? buildAllCreatorSignals() : null
  const similarTickers = new Set<string>() // simplified — no cross-user calc here

  const topSignals = allSignals
    ? [...allSignals.values()]
        .map(s => ({ ticker: s.ticker, score: scoreForHome(s, profile!, similarTickers) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
    : []

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 left-4 z-[60] px-2.5 py-1.5 rounded-xl bg-black/90 border border-white/10 text-[10px] font-bold text-hype-gold tracking-widest backdrop-blur-md shadow-xl"
      >
        REC DEBUG
      </button>

      {open && (
        <div className="fixed inset-y-0 left-0 z-[70] w-80 bg-black/95 border-r border-white/10 backdrop-blur-xl overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-black/95 z-10">
            <span className="text-[10px] font-bold tracking-widest text-hype-gold">REC DEBUG</span>
            <button onClick={() => setOpen(false)}><X size={14} className="text-white/40" /></button>
          </div>

          <div className="p-4 space-y-4 text-[11px]">

            {/* Current user */}
            <section>
              <p className="text-white/30 font-semibold uppercase tracking-widest mb-2">Current User</p>
              <div className="bg-white/5 rounded-xl p-3 space-y-1">
                <p className="text-white font-semibold">{currentUser?.name ?? 'Not logged in'}</p>
                <p className="text-white/40 font-mono">{currentUser?.id ?? '—'}</p>
                <p className="text-white/30">{isSupabaseMode ? '🔴 Supabase mode' : '🟢 Mock mode'}</p>
              </div>
            </section>

            {/* Taste profile */}
            {profile && (
              <section>
                <p className="text-white/30 font-semibold uppercase tracking-widest mb-2">Taste Profile</p>
                <div className="bg-white/5 rounded-xl p-3 space-y-2">
                  <div>
                    <p className="text-white/40 mb-1">Genres</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.genreIds.map(g => {
                        const genre = genres.find(gr => gr.id === g)
                        return (
                          <span key={g} className="px-1.5 py-0.5 rounded-full bg-hype-gold/15 text-hype-gold text-[9px] font-medium">
                            {genre?.label ?? g}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-white/40 mb-1">Spotted ({profile.spottedTickers.length})</p>
                    <p className="text-white/60 font-mono text-[9px]">{profile.spottedTickers.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-white/40 mb-1">Recently viewed</p>
                    <p className="text-white/60 font-mono text-[9px]">{profile.viewedTickers.slice(0, 6).join(', ') || '—'}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Top scored creators */}
            {topSignals.length > 0 && (
              <section>
                <p className="text-white/30 font-semibold uppercase tracking-widest mb-2">Top Home Scores</p>
                <div className="bg-white/5 rounded-xl p-3 space-y-1.5">
                  {topSignals.map(({ ticker, score }) => (
                    <div key={ticker} className="flex items-center justify-between">
                      <span className="text-white font-mono">{ticker}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-hype-gold/70 rounded-full" style={{ width: `${score * 100}%` }} />
                        </div>
                        <span className="text-white/50 font-mono w-8 text-right">{(score * 100).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Active sections */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/30 font-semibold uppercase tracking-widest">
                  Home Sections {loading && <span className="text-hype-gold/50">loading…</span>}
                </p>
                <span className="text-white/30">{sections.length}</span>
              </div>
              <div className="space-y-2">
                {sections.map(s => (
                  <div key={s.id} className="bg-white/5 rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-3 py-2"
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    >
                      <div className="text-left">
                        <p className="text-white/80 font-semibold text-[10px] leading-tight">{s.title}</p>
                        {s.reasonType && (
                          <p className="text-hype-gold/50 text-[9px]">{s.reasonType}</p>
                        )}
                      </div>
                      {expanded === s.id
                        ? <ChevronUp size={10} className="text-white/30" />
                        : <ChevronDown size={10} className="text-white/30" />}
                    </button>
                    {expanded === s.id && (
                      <div className="px-3 pb-2 border-t border-white/5 pt-2">
                        <p className="text-white/30 text-[9px] mb-1">Tickers</p>
                        <p className="text-white/60 font-mono text-[9px] leading-relaxed">{s.tickers.join(' · ')}</p>
                        {s.reasonLabel && (
                          <>
                            <p className="text-white/30 text-[9px] mt-2 mb-1">Reason</p>
                            <p className="text-hype-gold/70 text-[9px]">{s.reasonLabel}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {sections.length === 0 && !loading && (
                  <p className="text-white/20 text-[10px] px-1">No sections — check engine output</p>
                )}
              </div>
            </section>

          </div>
        </div>
      )}
    </>
  )
}

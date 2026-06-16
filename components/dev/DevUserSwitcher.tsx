'use client'

import { useAuth } from '@/context/AuthContext'
import { mockUsers } from '@/lib/mock-data/users'

const coverColors: Record<string, string> = {
  khush:  'from-orange-500 to-pink-600',
  maya:   'from-pink-500 to-purple-600',
  jordan: 'from-violet-600 to-indigo-800',
  ariana: 'from-gray-700 to-slate-800',
}

export default function DevUserSwitcher() {
  const { currentUser, switchUser, isSupabaseMode } = useAuth()

  if (process.env.NODE_ENV !== 'development') return null

  // ── Supabase mode — switcher disabled ───────────────────────────────
  if (isSupabaseMode) {
    return (
      <div className="fixed bottom-[84px] right-4 z-50 md:bottom-6 md:right-6">
        <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 shadow-xl max-w-[200px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold tracking-widest text-hype-gold uppercase">Dev</span>
            <span className="text-[9px] font-medium text-white/40">· Supabase active</span>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Mock users unavailable.<br />
            Add to <span className="text-white/60 font-mono">.env.local</span>:
          </p>
          <code className="text-[10px] text-green-400 bg-white/5 rounded px-1.5 py-1 font-mono break-all">
            NEXT_PUBLIC_DEV_FORCE_MOCK=true
          </code>
          <p className="text-[10px] text-white/30">then restart the dev server.</p>
        </div>
      </div>
    )
  }

  // ── Mock mode — full switcher ─────────────────────────────────────
  return (
    <div className="fixed bottom-[84px] right-4 z-50 md:bottom-6 md:right-6">
      <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 shadow-xl">
        <span className="text-[9px] font-bold tracking-widest text-hype-gold uppercase pr-0.5">Dev</span>
        {mockUsers.map(u => {
          const isActive = currentUser?.id === u.id
          return (
            <button
              key={u.id}
              onClick={() => switchUser(u.id)}
              title={`${u.name} (${u.username})`}
              className={[
                'relative w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold transition-all duration-150',
                coverColors[u.id] ?? 'from-gray-600 to-gray-800',
                isActive
                  ? 'ring-2 ring-hype-gold ring-offset-1 ring-offset-black scale-110'
                  : 'opacity-45 hover:opacity-80 hover:scale-105',
              ].join(' ')}
            >
              {u.initials}
            </button>
          )
        })}
      </div>
      <p className="text-[9px] text-white/20 text-right mt-1 pr-1">
        {currentUser?.name ?? 'Not logged in'} · mock mode
      </p>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Bell, ArrowRight } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { useAuth } from '@/context/AuthContext'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'
import { notifications } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function TopBar() {
  const { user } = useUser()
  const { isAuthenticated, isLoading } = useAuth()
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-black/40 backdrop-blur-2xl">
      {/* Aurora gradient bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.12) 25%, rgba(107,33,168,0.1) 75%, transparent 100%)' }}
      />
      {/* Subtle inner glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }}
      />

      <Link href="/">
        <SpotlightWordmark />
      </Link>

      <div className="flex items-center gap-2">
        {isLoading ? (
          // Auth resolving — show invisible spacer to prevent layout shift
          <div className="w-16 h-8" />
        ) : !isAuthenticated ? (
          <>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl text-white/60 text-sm font-medium hover:text-white hover:bg-white/[0.06] transition-all"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="btn-magnetic flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-hype-gold text-[#0A0A0A] text-sm font-bold hover:bg-hype-gold-dim transition-all shadow-[0_2px_12px_rgba(201,168,76,0.35)]"
            >
              Join <ArrowRight size={13} />
            </Link>
          </>
        ) : (
          <>
            <Link href="/notifications">
              <button className={cn(
                'relative w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                'text-hype-muted hover:text-hype-secondary',
              )}>
                <Bell size={16} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-hype-gold rounded-full" style={{ boxShadow: '0 0 6px rgba(201,168,76,0.8)' }} />
                )}
              </button>
            </Link>

            <Link href="/profile">
              <div
                className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold"
                style={{ boxShadow: '0 0 10px rgba(168,85,247,0.4)' }}
              >
                {user.avatar}
              </div>
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

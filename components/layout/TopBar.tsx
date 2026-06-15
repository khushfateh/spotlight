'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { SpotlightWordmark } from '@/components/ui/SpotlightLogo'
import { notifications } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function TopBar() {
  const { user } = useUser()
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-hype-bg/90 backdrop-blur-md border-b border-hype-border/40">
      <Link href="/">
        <SpotlightWordmark />
      </Link>

      <div className="flex items-center gap-2">
        <Link href="/notifications">
          <button className={cn(
            'relative w-8 h-8 rounded-full flex items-center justify-center transition-colors',
            'text-hype-muted hover:text-hype-secondary',
          )}>
            <Bell size={16} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-hype-gold rounded-full" />
            )}
          </button>
        </Link>

        <Link href="/profile">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-hype-indigo to-hype-purple flex items-center justify-center text-white text-[10px] font-bold">
            {user.avatar}
          </div>
        </Link>
      </div>
    </header>
  )
}

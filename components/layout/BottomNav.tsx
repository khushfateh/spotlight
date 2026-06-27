'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Star, User, LayoutDashboard, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser } from '@/context/UserContext'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  isCenter?: boolean
}

export default function BottomNav() {
  const pathname = usePathname()
  const { userMode } = useUser()
  const { isAuthenticated, isLoading } = useAuth()

  const investorNav: NavItem[] = [
    { href: '/', label: 'Home', icon: <Home size={20} /> },
    { href: '/explore', label: 'Discover', icon: <Compass size={20} /> },
    { href: '/spotlight', label: 'Spotlight', icon: <Star size={20} />, isCenter: true },
    { href: '/profile', label: 'Profile', icon: <User size={20} /> },
  ]

  const creatorNav: NavItem[] = [
    { href: '/', label: 'Home', icon: <Home size={20} /> },
    { href: '/explore', label: 'Discover', icon: <Compass size={20} /> },
    { href: '/launch', label: 'Launch', icon: <Plus size={20} />, isCenter: true },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/profile', label: 'Profile', icon: <User size={20} /> },
  ]

  const navItems = userMode === 'creator' ? creatorNav : investorNav

  // Don't render anything while auth is still resolving
  if (isLoading) return <div className="h-[88px] safe-bottom" />

  // Unauthenticated: show public nav tabs (Home, Discover, Spotlight) — no Profile
  if (!isAuthenticated) {
    const publicItems: NavItem[] = [
      { href: '/', label: 'Home', icon: <Home size={20} /> },
      { href: '/explore', label: 'Discover', icon: <Compass size={20} /> },
      { href: '/spotlight', label: 'Spotlight', icon: <Star size={20} />, isCenter: true },
    ]
    return (
      <>
        <div className="h-[88px] safe-bottom" />
        <nav className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-4 pt-0 safe-bottom">
          <div className="nav-pill max-w-[240px] mx-auto flex items-center justify-around h-[56px] px-2">
            {publicItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              if (item.isCenter) {
                return (
                  <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-4">
                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 text-[#0A0A0A]',
                        isActive ? 'glow-gold shadow-lg' : 'shadow-md',
                      )}
                      style={{
                        background: 'linear-gradient(135deg, #C9A84C 0%, #F0D98B 50%, #C9A84C 100%)',
                      }}
                    >
                      {item.icon}
                    </motion.div>
                    <span className="text-[9px] font-medium text-hype-muted mt-1 tracking-wide">{item.label}</span>
                  </Link>
                )
              }
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-3 py-1">
                  <motion.div whileTap={{ scale: 0.85 }}>
                    {isActive ? (
                      <div className="nav-active-glow px-2 py-1">
                        <div className="transition-all duration-150 scale-110 text-hype-gold">{item.icon}</div>
                      </div>
                    ) : (
                      <div className="transition-all duration-150 text-hype-dim hover:text-hype-muted">{item.icon}</div>
                    )}
                  </motion.div>
                  <span className={cn('text-[9px] font-medium tracking-wide transition-colors duration-150', isActive ? 'text-hype-gold' : 'text-hype-dim')}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </>
    )
  }

  return (
    <>
      <div className="h-[88px] safe-bottom" />

      <nav className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-4 pt-0 safe-bottom">
        <div className="nav-pill max-w-[320px] mx-auto flex items-center justify-around h-[56px] px-2">
          {navItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

            if (item.isCenter) {
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-4">
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 text-[#0A0A0A]',
                      isActive ? 'glow-gold shadow-lg' : 'glow-gold-sm shadow-md',
                    )}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #C9A84C 0%, #F0D98B 50%, #C9A84C 100%)'
                        : 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 100%)',
                    }}
                  >
                    {item.icon}
                  </motion.div>
                  <span className="text-[9px] font-medium text-hype-muted mt-1 tracking-wide">{item.label}</span>
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <motion.div whileTap={{ scale: 0.85 }}>
                  {isActive ? (
                    <div className="nav-active-glow px-2 py-1">
                      <div className="transition-all duration-150 scale-110 text-hype-gold">{item.icon}</div>
                    </div>
                  ) : (
                    <div className={cn('transition-all duration-150', 'text-hype-dim hover:text-hype-muted')}>
                      {item.icon}
                    </div>
                  )}
                </motion.div>
                <span className={cn(
                  'text-[9px] font-medium tracking-wide transition-colors duration-150',
                  isActive ? 'text-hype-gold' : 'text-hype-dim',
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

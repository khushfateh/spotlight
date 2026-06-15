'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Rocket, PieChart, User, LayoutDashboard, Plus } from 'lucide-react'
import { useUser } from '@/context/UserContext'
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

  const investorNav: NavItem[] = [
    { href: '/', label: 'Home', icon: <Home size={20} /> },
    { href: '/explore', label: 'Explore', icon: <Compass size={20} /> },
    { href: '/ipos', label: 'IPOs', icon: <Rocket size={20} />, isCenter: true },
    { href: '/portfolio', label: 'Portfolio', icon: <PieChart size={20} /> },
    { href: '/profile', label: 'Profile', icon: <User size={20} /> },
  ]

  const creatorNav: NavItem[] = [
    { href: '/', label: 'Home', icon: <Home size={20} /> },
    { href: '/explore', label: 'Explore', icon: <Compass size={20} /> },
    { href: '/launch', label: 'Launch', icon: <Plus size={20} />, isCenter: true },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/profile', label: 'Profile', icon: <User size={20} /> },
  ]

  const navItems = userMode === 'creator' ? creatorNav : investorNav

  return (
    <>
      <div className="h-[72px] safe-bottom" />

      <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
        <div className="bg-hype-bg/98 backdrop-blur-md border-t border-hype-border">
          <div className="max-w-lg mx-auto flex items-center justify-around h-[56px] px-2">
            {navItems.map((item) => {
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)

              if (item.isCenter) {
                return (
                  <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200',
                        isActive
                          ? 'bg-hype-gold text-[#0A0A0A] shadow-lg'
                          : 'bg-hype-gold text-[#0A0A0A] shadow-md',
                      )}
                    >
                      {item.icon}
                    </div>
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
                  <div className={cn(
                    'transition-all duration-150',
                    isActive ? 'text-hype-gold' : 'text-hype-dim hover:text-hype-muted',
                  )}>
                    {item.icon}
                  </div>
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
        </div>
      </nav>
    </>
  )
}

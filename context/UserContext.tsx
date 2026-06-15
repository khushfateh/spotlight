'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { UserMode } from '@/types'
import { useAuth } from './AuthContext'

type UserContextType = {
  userMode: UserMode
  setUserMode: (mode: UserMode) => void
  user: {
    name: string
    username: string
    avatar: string
    bio: string
  }
}

const UserContext = createContext<UserContextType | null>(null)

function getInitialMode(): UserMode {
  if (typeof window === 'undefined') return 'investor'
  const saved = localStorage.getItem('spotlight_user_mode')
  return saved === 'creator' ? 'creator' : 'investor'
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [userMode, setUserModeState] = useState<UserMode>(getInitialMode)
  const { currentUser } = useAuth()

  function setUserMode(mode: UserMode) {
    setUserModeState(mode)
    localStorage.setItem('spotlight_user_mode', mode)
  }

  const user = currentUser
    ? {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.initials,
        bio: currentUser.bio,
      }
    : {
        name: 'Guest',
        username: '@guest',
        avatar: 'G',
        bio: '',
      }

  return (
    <UserContext.Provider value={{ userMode, setUserMode, user }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be inside UserProvider')
  return ctx
}

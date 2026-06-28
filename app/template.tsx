'use client'

import type { ReactNode } from 'react'
import { PageTransition } from '@/components/experience/PageTransition'

// template.tsx re-mounts on every navigation (unlike layout.tsx which persists).
// PageTransition wraps children with blur-fade + gold sweep bar.
export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}

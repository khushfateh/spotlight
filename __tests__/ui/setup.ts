// Setup for jsdom-environment UI tests
import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.spyOn(console, 'error').mockImplementation(() => {})

// Stub next/navigation (not available in jsdom)
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

// Stub next/link
vi.mock('next/link', () => ({
  default: ({ href, children, className, ...rest }: { href: string; children: React.ReactNode; className?: string; [key: string]: unknown }) => {
    const React = require('react')
    return React.createElement('a', { href, className, ...rest }, children)
  },
}))

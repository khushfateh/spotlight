import { supabase } from '@/lib/supabase/client'

const RESERVED = new Set([
  'admin', 'support', 'help', 'about', 'contact', 'terms', 'privacy',
  'login', 'signup', 'logout', 'onboarding', 'profile', 'discoveries',
  'discover', 'explore', 'api', 'auth', 'callback', 'share', 'settings',
  'notifications', 'dashboard', 'home', 'spotlight', 'creator', 'launch',
  'me', 'official', 'team', 'staff', 'mod', 'moderator', 'bot',
  'root', 'system', 'null', 'undefined', 'test', 'demo',
  'security', 'account', 'accounts', 'user', 'users',
  'username', 'setup', 'edit', 'delete',
])

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function normalizeUsername(raw: string): string {
  return raw.toLowerCase().trim().replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_')
}

export function validateUsername(username: string): ValidationResult {
  if (!username) return { valid: false, error: 'Username is required' }
  if (username.length < 3) return { valid: false, error: 'At least 3 characters' }
  if (username.length > 20) return { valid: false, error: '20 characters max' }
  if (!/^[a-z0-9]([a-z0-9_]*[a-z0-9])?$/.test(username)) {
    return { valid: false, error: 'Letters, numbers, and underscores only — no leading or trailing underscores' }
  }
  if (/__/.test(username)) {
    return { valid: false, error: 'No consecutive underscores' }
  }
  if (RESERVED.has(username)) {
    return { valid: false, error: 'This username is reserved' }
  }
  return { valid: true }
}

export async function checkAvailability(
  username: string,
  currentUserId?: string
): Promise<{ available: boolean; error?: string }> {
  if (!supabase) return { available: false, error: 'Not configured' }
  const normalized = normalizeUsername(username)
  const validation = validateUsername(normalized)
  if (!validation.valid) return { available: false, error: validation.error }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalized)
    .maybeSingle()

  if (error) return { available: false, error: error.message }
  if (!data) return { available: true }
  if (currentUserId && data.id === currentUserId) return { available: true }
  return { available: false, error: 'Already taken' }
}

export function generateSuggestions(displayName: string): string[] {
  const base = normalizeUsername(displayName).slice(0, 14)
  if (!base || base.length < 2) return []
  const year = new Date().getFullYear()
  const n = Math.floor(Math.random() * 900) + 100
  return [
    base,
    `${base}${n}`,
    `${base}_${year}`,
    `the_${base}`.slice(0, 20),
  ]
    .map(s => s.replace(/_+/g, '_').replace(/^_|_$/g, ''))
    .filter(s => s.length >= 3 && s.length <= 20 && validateUsername(s).valid)
    .slice(0, 4)
}

export async function saveUsername(userId: string, username: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Not configured' }
  const { error } = await supabase
    .from('profiles')
    .update({ username, username_changed_at: new Date().toISOString() })
    .eq('id', userId)
  return error ? { error: error.message } : {}
}

const COOLDOWN_DAYS = 30

export function usernameChangeCooldown(username_changed_at: string | null): {
  canChange: boolean
  daysRemaining: number
} {
  if (!username_changed_at) return { canChange: true, daysRemaining: 0 }
  const changedAt = new Date(username_changed_at)
  const diffDays = (Date.now() - changedAt.getTime()) / 86_400_000
  if (diffDays >= COOLDOWN_DAYS) return { canChange: true, daysRemaining: 0 }
  return { canChange: false, daysRemaining: Math.ceil(COOLDOWN_DAYS - diffDays) }
}

import { NextRequest, NextResponse } from 'next/server'
import { checkAvailability, normalizeUsername, validateUsername } from '@/lib/services/usernameService'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username') ?? ''
  const currentUserId = request.nextUrl.searchParams.get('userId') ?? undefined

  const normalized = normalizeUsername(username)
  const validation = validateUsername(normalized)
  if (!validation.valid) {
    return NextResponse.json({ available: false, error: validation.error })
  }

  const result = await checkAvailability(normalized, currentUserId)
  return NextResponse.json(result)
}

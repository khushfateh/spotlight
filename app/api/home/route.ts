import { NextRequest, NextResponse } from 'next/server'
import { getPersonalizedHome } from '@/lib/services/recommendationService'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') ?? 'khush'

  try {
    const sections = await getPersonalizedHome(userId)
    return NextResponse.json({ sections, userId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

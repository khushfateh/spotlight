import { NextRequest, NextResponse } from 'next/server'
import { getDailySpotlight } from '@/lib/services/recommendationService'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') ?? 'khush'

  try {
    const result = await getDailySpotlight(userId)
    if (!result) {
      return NextResponse.json({ error: 'No spotlight available' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

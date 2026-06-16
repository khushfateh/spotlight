import { NextRequest, NextResponse } from 'next/server'
import { getDiscoverResults } from '@/lib/services/recommendationService'
import type { DiscoverFilters } from '@/lib/engine/types'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const rawLens = params.get('lens')

  const filters: DiscoverFilters = {
    lens: (rawLens as DiscoverFilters['lens']) ?? undefined,
    genreId: params.get('genreId') ?? undefined,
    category: params.get('category') ?? undefined,
    query: params.get('query') ?? undefined,
    limit: params.get('limit') ? parseInt(params.get('limit')!, 10) : 20,
  }

  try {
    const creators = await getDiscoverResults(filters)
    return NextResponse.json({ creators, filters })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { buildTasteProfileAsync } from '@/lib/engine/tasteProfile'
import { buildCreatorSignal } from '@/lib/engine/creatorSignals'
import { getExplanation, reasonTypeLabel } from '@/lib/engine/explanations'
import type { ReasonType } from '@/lib/engine/types'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const userId = params.get('userId') ?? 'khush'
  const ticker = params.get('ticker')
  const reasonType = (params.get('reasonType') ?? 'genre_match') as ReasonType

  if (!ticker) {
    return NextResponse.json({ error: 'ticker is required' }, { status: 400 })
  }

  try {
    const profile = await buildTasteProfileAsync(userId)
    const signal = buildCreatorSignal(ticker)
    const explanation = getExplanation(ticker, signal, profile, reasonType)
    const label = reasonTypeLabel[reasonType]

    return NextResponse.json({ ticker, userId, reasonType, explanation, label })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

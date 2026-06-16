import { NextRequest, NextResponse } from 'next/server'
import { getCreatorSnapshot } from '@/lib/spotify/service'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const snapshot = await getCreatorSnapshot(id)
  if (!snapshot) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
  return NextResponse.json(snapshot)
}

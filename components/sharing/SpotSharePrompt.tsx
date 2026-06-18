'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Share2 } from 'lucide-react'
import type { Creator } from '@/types'
import type { ShareType, ShareCard } from '@/lib/services/shareService'
import { createShareCard, buildShareTexts } from '@/lib/services/shareService'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'
import { getSpotterRank } from '@/lib/mock-data/spots'
import ShareSheet from './ShareSheet'

export default function SpotSharePrompt({
  creator,
  userId,
  userName,
  shareType = 'first_spot',
}: {
  creator: Creator
  userId: string
  userName: string
  shareType?: ShareType
}) {
  const [shareCard, setShareCard] = useState<ShareCard | null>(null)
  const [loading, setLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { score } = getMomentum(creator.ticker)
  const tier = getMomentumTier(score)
  const rank = getSpotterRank(creator.ticker)

  async function handleShare() {
    if (shareCard) { setSheetOpen(true); return }
    setLoading(true)
    const card = await createShareCard(userId, creator.ticker, shareType, {
      creatorName: creator.name,
      creatorTicker: creator.ticker,
      creatorCategory: creator.category,
      creatorImageUrl: creator.imageUrl,
      coverColor: creator.coverColor,
      spotterRank: rank,
      score,
      tier,
      spotDate: new Date().toISOString(),
      userName,
    })
    setLoading(false)
    if (card) {
      setShareCard(card)
      setSheetOpen(true)
    }
  }

  const texts = buildShareTexts(shareType, creator.name, userName)

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
        style={{
          background: 'rgba(201,168,76,0.07)',
          border: '1px solid rgba(201,168,76,0.2)',
          color: 'rgba(201,168,76,0.8)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        {loading ? (
          <div className="w-3 h-3 rounded-full border border-hype-gold/30 border-t-hype-gold/80 animate-spin" />
        ) : (
          <Share2 size={13} />
        )}
        {texts.title.split(' ').slice(0, 2).join(' ')} → Share
      </motion.button>

      {sheetOpen && shareCard && (
        <ShareSheet shareCard={shareCard} onClose={() => setSheetOpen(false)} />
      )}
    </>
  )
}

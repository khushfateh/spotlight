'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link, Download, Share2 } from 'lucide-react'
import type { ShareCard } from '@/lib/services/shareService'
import { getShareUrl, trackShareEvent } from '@/lib/services/shareService'

type Props = {
  shareCard: ShareCard
  onClose: () => void
}

export default function ShareSheet({ shareCard, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const shareUrl = getShareUrl(shareCard.shareSlug)

  const ogParams = new URLSearchParams({
    title: shareCard.title,
    subtitle: shareCard.subtitle,
    creator: shareCard.metadata.creatorName,
    ticker: shareCard.metadata.creatorTicker,
    score: String(shareCard.metadata.score),
    tier: shareCard.metadata.tier,
    rank: String(shareCard.metadata.spotterRank),
    ...(shareCard.metadata.creatorImageUrl ? { image: shareCard.metadata.creatorImageUrl } : {}),
    date: new Date(shareCard.metadata.spotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  })
  const imageApiUrl = `/api/og?${ogParams}`

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl).catch(() => {})
    setCopied(true)
    trackShareEvent(shareCard.id, 'share_card_copied').catch(() => {})
    setTimeout(() => setCopied(false), 2000)
  }, [shareUrl, shareCard.id])

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: shareCard.title,
        text: shareCard.caption,
        url: shareUrl,
      }).catch(() => {})
      trackShareEvent(shareCard.id, 'share_card_native_shared').catch(() => {})
    } else {
      handleCopyLink()
    }
  }, [shareCard, shareUrl, handleCopyLink])

  const handleWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`${shareCard.caption}\n\n${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    trackShareEvent(shareCard.id, 'share_card_whatsapp_clicked').catch(() => {})
  }, [shareCard, shareUrl])

  const handleDownload = useCallback(async () => {
    trackShareEvent(shareCard.id, 'share_card_downloaded').catch(() => {})
    // Open the generated image in a new tab — user can save it
    window.open(imageApiUrl, '_blank')
  }, [imageApiUrl, shareCard.id])

  const handleInstagram = useCallback(() => {
    // On Instagram, best flow is: save image → add link sticker manually
    trackShareEvent(shareCard.id, 'share_card_instagram_clicked').catch(() => {})
    window.open(imageApiUrl, '_blank')
  }, [imageApiUrl, shareCard.id])

  const handleFacebook = useCallback(() => {
    trackShareEvent(shareCard.id, 'share_card_facebook_clicked').catch(() => {})
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(fbUrl, '_blank')
  }, [shareUrl, shareCard.id])

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          style={{ zIndex: 300 }}
          onClick={onClose}
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 280 }}
          className="fixed bottom-0 left-0 right-0 rounded-t-3xl"
          style={{ zIndex: 301, background: '#111', border: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
          </div>

          <div className="px-5 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white font-bold text-base">Share Discovery</p>
                <p className="text-white/40 text-xs mt-0.5" style={{ fontStyle: 'italic' }}>{shareCard.subtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X size={16} className="text-white/50" />
              </button>
            </div>

            {/* Quick share row */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                {
                  icon: '📸',
                  label: 'Instagram',
                  onClick: handleInstagram,
                },
                {
                  icon: '📘',
                  label: 'Facebook',
                  onClick: handleFacebook,
                },
                {
                  icon: '💬',
                  label: 'WhatsApp',
                  onClick: handleWhatsApp,
                },
                {
                  icon: <Share2 size={20} className="text-white/80" />,
                  label: 'More',
                  onClick: handleNativeShare,
                },
              ].map(({ icon, label, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {icon}
                  </div>
                  <p className="text-white/40 text-[10px] font-medium">{label}</p>
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full h-12 rounded-2xl flex items-center justify-between px-4"
                style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)' }}
              >
                <div className="flex items-center gap-3">
                  <Link size={16} style={{ color: 'rgba(201,168,76,0.7)' }} />
                  <span style={{ fontSize: 13, color: 'rgba(201,168,76,0.85)', fontWeight: 600 }}>
                    {copied ? '✓ Copied!' : 'Copy Link'}
                  </span>
                </div>
                <span className="text-white/20 text-[10px] truncate max-w-[140px]">{shareUrl.replace('https://', '').replace('http://', '')}</span>
              </button>

              {/* Download Card */}
              <button
                onClick={handleDownload}
                className="w-full h-12 rounded-2xl flex items-center gap-3 px-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Download size={16} className="text-white/50" />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Download Story Card</span>
              </button>
            </div>

            {/* Instagram instructions */}
            <div
              className="mt-4 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-1.5">For Instagram Stories</p>
              <p className="text-white/25 text-xs leading-relaxed">
                Download your card → Open Instagram → Add to Story → Tap the Link sticker → Paste your SPOTLIGHT link.
              </p>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}

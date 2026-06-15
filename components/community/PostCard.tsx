'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { Post } from '@/types'
import { formatTimeAgo, formatNumber, cn } from '@/lib/utils'

type PostCardProps = {
  post: Post
}

const sentimentConfig = {
  bullish: { label: 'Bullish', color: 'text-hype-green', icon: TrendingUp, bg: 'bg-hype-green/10' },
  bearish: { label: 'Bearish', color: 'text-hype-red', icon: TrendingDown, bg: 'bg-hype-red/10' },
  neutral: { label: 'Neutral', color: 'text-hype-muted', icon: Minus, bg: 'bg-hype-surface-3' },
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked)
  const [likeCount, setLikeCount] = useState(post.likes)

  function toggleLike() {
    setLiked(prev => !prev)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
  }

  const sentiment = sentimentConfig[post.sentiment]
  const SentimentIcon = sentiment.icon

  return (
    <div className="premium-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Avatar
          initials={post.authorAvatar}
          gradientClass="from-violet-500 to-blue-500"
          size="sm"
          isVerified={post.authorIsVerified}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-hype-text text-sm font-semibold">{post.authorName}</span>
              <span className="text-hype-muted text-xs">{formatTimeAgo(post.timestamp)}</span>
            </div>
            <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', sentiment.bg, sentiment.color)}>
              <SentimentIcon size={10} />
              {sentiment.label}
            </div>
          </div>

          <p className="text-hype-secondary text-sm leading-relaxed mb-3">{post.content}</p>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLike}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium transition-colors',
                liked ? 'text-hype-red' : 'text-hype-muted hover:text-hype-secondary',
              )}
            >
              <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
              {formatNumber(likeCount)}
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium text-hype-muted hover:text-hype-secondary transition-colors">
              <MessageCircle size={13} />
              {formatNumber(post.comments)}
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium text-hype-muted hover:text-hype-secondary transition-colors">
              <Share2 size={13} />
              {formatNumber(post.shares)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

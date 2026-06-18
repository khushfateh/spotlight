'use client'
/* eslint-disable @next/next/no-img-element */

import { motion } from 'framer-motion'
import type { Creator } from '@/types'

export default function GoldDiscoveryCard({
  creator,
  rank,
  score,
  tier,
  userName,
  spotTime,
  onClick,
}: {
  creator: Creator
  rank: number
  score: number
  tier: string
  userName: string
  spotTime: Date
  onClick?: () => void
}) {
  const dateStr = spotTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = spotTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden select-none"
      style={{
        width: 'min(78vw, 288px)',
        aspectRatio: '5 / 7',
        borderRadius: 16,
        cursor: onClick ? 'pointer' : 'default',
        background: 'linear-gradient(160deg, #1c1405 0%, #0e0b04 45%, #1c1405 100%)',
        border: '2.5px solid rgba(201,168,76,0.9)',
        boxShadow: [
          '0 0 0 1px rgba(201,168,76,0.15)',
          '0 0 45px rgba(201,168,76,0.32)',
          '0 0 90px rgba(201,168,76,0.12)',
          '0 28px 80px rgba(0,0,0,0.95)',
          'inset 0 0 40px rgba(201,168,76,0.04)',
        ].join(', '),
      }}
    >
      {/* Holographic rainbow sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 15, borderRadius: 14, overflow: 'hidden', mixBlendMode: 'overlay' }}
        initial={{ x: '-110%' }}
        animate={{ x: '110%' }}
        transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.9, repeat: Infinity, repeatDelay: 2.4 }}
      >
        <div
          style={{
            width: '55%',
            height: '100%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,220,90,0.45) 18%, rgba(210,90,255,0.35) 36%, rgba(70,200,255,0.35) 54%, rgba(90,255,160,0.28) 72%, rgba(255,180,60,0.3) 88%, transparent 100%)',
          }}
        />
      </motion.div>

      {/* Fine gold grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          opacity: 0.055,
          backgroundImage: [
            'repeating-linear-gradient(0deg, rgba(201,168,76,1) 0px, transparent 1px, transparent 9px)',
            'repeating-linear-gradient(90deg, rgba(201,168,76,1) 0px, transparent 1px, transparent 9px)',
          ].join(', '),
        }}
      />

      {/* Top gloss reflection */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          zIndex: 14,
          height: '38%',
          borderRadius: '14px 14px 0 0',
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 55%, transparent 100%)',
        }}
      />

      {/* Creator image — top 43% */}
      <div className="relative overflow-hidden" style={{ height: '43%' }}>
        {creator.imageUrl ? (
          <>
            <img
              src={creator.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(12px) brightness(0.5)', transform: 'scale(1.1)' }}
            />
            <img
              src={creator.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
            />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${creator.coverColor}`} />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, #0e0b04 0%, rgba(14,11,4,0.45) 30%, transparent 65%)',
          }}
        />
        <div className="absolute top-2 right-2.5" style={{ zIndex: 5 }}>
          <span
            className="font-black"
            style={{
              fontSize: 10,
              color: 'rgba(201,168,76,0.9)',
              letterSpacing: '0.06em',
              textShadow: '0 0 10px rgba(201,168,76,0.5)',
            }}
          >
            SP {score}
          </span>
        </div>
        <div className="absolute top-2 left-2.5" style={{ zIndex: 5 }}>
          <span
            style={{
              fontSize: 7,
              letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.35)',
              fontWeight: 700,
              textTransform: 'uppercase' as const,
            }}
          >
            {creator.category}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div
        className="relative px-3.5 pt-2 pb-1.5"
        style={{ height: '47%', zIndex: 10 }}
      >
        <div className="mb-2">
          <p
            className="text-white font-black tracking-tight leading-tight"
            style={{ fontSize: 16 }}
          >
            {creator.name}
          </p>
          <p
            className="font-mono"
            style={{ fontSize: 8.5, color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', marginTop: 1 }}
          >
            ${creator.ticker}
          </p>
        </div>

        <div
          className="mb-2"
          style={{
            height: 1,
            background:
              'linear-gradient(to right, rgba(201,168,76,0.7) 0%, rgba(201,168,76,0.3) 50%, rgba(201,168,76,0.7) 100%)',
          }}
        />

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-2">
          {[
            { label: 'SPOTTED BY', value: userName, gold: false },
            { label: 'SPOTTER RANK', value: `#${rank}`, gold: true },
            { label: 'DATE', value: dateStr, gold: false },
            { label: 'TIME', value: timeStr, gold: false },
          ].map(({ label, value, gold }) => (
            <div key={label}>
              <p
                style={{
                  fontSize: 6.5,
                  letterSpacing: '0.22em',
                  color: 'rgba(255,255,255,0.22)',
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  marginBottom: 1,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: 10.5,
                  color: gold ? 'rgba(201,168,76,0.95)' : 'rgba(255,255,255,0.82)',
                  fontWeight: gold ? 800 : 600,
                  lineHeight: 1.2,
                  textShadow: gold ? '0 0 12px rgba(201,168,76,0.4)' : 'none',
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mb-2"
          style={{
            height: 1,
            background:
              'linear-gradient(to right, rgba(201,168,76,0.7) 0%, rgba(201,168,76,0.3) 50%, rgba(201,168,76,0.7) 100%)',
          }}
        />

        <div className="flex items-end justify-between">
          <div>
            <p
              style={{
                fontSize: 6.5,
                letterSpacing: '0.22em',
                color: 'rgba(255,255,255,0.22)',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                marginBottom: 1,
              }}
            >
              Momentum
            </p>
            <p
              className="text-white font-black"
              style={{ fontSize: 21, lineHeight: 1 }}
            >
              {score}
            </p>
          </div>
          <div className="text-right">
            <p
              style={{
                fontSize: 6.5,
                letterSpacing: '0.22em',
                color: 'rgba(255,255,255,0.22)',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                marginBottom: 1,
              }}
            >
              Status
            </p>
            <p
              style={{
                fontSize: 12,
                color: 'rgba(201,168,76,0.9)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textShadow: '0 0 14px rgba(201,168,76,0.4)',
              }}
            >
              {tier}
            </p>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3.5"
        style={{
          height: '10%',
          zIndex: 10,
          background:
            'linear-gradient(to right, rgba(201,168,76,0.14), rgba(201,168,76,0.07) 50%, rgba(201,168,76,0.14))',
          borderTop: '1px solid rgba(201,168,76,0.28)',
        }}
      >
        <p
          style={{
            fontSize: 6.5,
            letterSpacing: '0.22em',
            color: 'rgba(201,168,76,0.5)',
            fontWeight: 600,
            textTransform: 'uppercase' as const,
          }}
        >
          Discovery Time Capsule · Spotlight
        </p>
        <p
          style={{
            fontSize: 8,
            color: 'rgba(201,168,76,0.55)',
            fontWeight: 700,
          }}
        >
          #{rank}
        </p>
      </div>

      {/* Corner accent marks */}
      {[
        { top: 6, left: 6 },
        { top: 6, right: 6 },
        { bottom: 6, left: 6 },
        { bottom: 6, right: 6 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            ...pos,
            width: 10,
            height: 10,
            borderTop: pos.bottom === undefined ? '1.5px solid rgba(201,168,76,0.6)' : 'none',
            borderBottom: pos.top === undefined ? '1.5px solid rgba(201,168,76,0.6)' : 'none',
            borderLeft: pos.right === undefined ? '1.5px solid rgba(201,168,76,0.6)' : 'none',
            borderRight: pos.left === undefined ? '1.5px solid rgba(201,168,76,0.6)' : 'none',
            zIndex: 12,
          }}
        />
      ))}
    </div>
  )
}

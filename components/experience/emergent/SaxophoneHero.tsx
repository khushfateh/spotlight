'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollState } from './scrollState'

// SSR-safe Canvas import — WebGL only runs in the browser
const SaxophoneCanvas = dynamic(() => import('./SaxophoneCanvas'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        color: '#c9a84c',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid #c9a84c',
          animation: 'spin 0.9s linear infinite',
        }}
      />
    </div>
  ),
})

export default function SaxophoneHero() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Reset on mount (hot-reload safety)
    scrollState.rotation = 0

    const tween = gsap.to(scrollState, {
      rotation: Math.PI * 2, // one full axial rotation over the scroll range
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=150%', // 1.5× viewport height → one full turn
        scrub: 1.2,   // slight lag for weighted feel
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return (
    <>
      {/* Keyframe for the SSR loading spinner */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <section
        ref={sectionRef}
        className="relative overflow-hidden"
        style={{ minHeight: '100svh', background: '#050505' }}
      >
        {/* ── Ambient radial glows ─────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(900px 700px at 75% 40%, rgba(201,168,76,0.13), transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(600px 500px at 8% 80%, rgba(201,168,76,0.06), transparent 60%)',
            }}
          />
        </div>

        {/* ── Film grain overlay ───────────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            zIndex: 1,
            opacity: 0.04,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* ── 3-D Canvas — full bleed, behind text ─────────────────────── */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          <SaxophoneCanvas />
        </div>

        {/* ── Text content — left column ───────────────────────────────── */}
        <div
          className="relative pointer-events-none"
          style={{
            zIndex: 10,
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0 20px',
            height: '100svh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <motion.div
            className="pointer-events-auto"
            style={{ maxWidth: 540 }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Discovery badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 9999,
                padding: '8px 16px',
                marginBottom: 28,
                background: 'rgba(255,255,255,0.045)',
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#c9a84c',
                  display: 'inline-block',
                  flexShrink: 0,
                  boxShadow: '0 0 6px rgba(201,168,76,0.7)',
                }}
              />
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase' as const,
                  color: '#a3a3a3',
                }}
              >
                Discover · Spot · Remember
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: 'Syne, system-ui, sans-serif',
                fontSize: 'clamp(2.8rem, 5.5vw, 5rem)',
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: '-0.025em',
                textShadow: '0 4px 48px rgba(0,0,0,0.8)',
                margin: 0,
                color: '#f5f5f5',
              }}
            >
              Discover{' '}
              <span
                style={{
                  background:
                    'linear-gradient(180deg, #f4d488 0%, #c9a84c 55%, #a87f2e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                future icons
              </span>
              <br />
              before everyone else
            </h1>

            {/* Body copy */}
            <p
              style={{
                color: '#a3a3a3',
                marginTop: 24,
                maxWidth: 420,
                lineHeight: 1.65,
                fontSize: 15,
                textShadow: '0 2px 20px rgba(0,0,0,0.9)',
              }}
            >
              Spot rising creators before they blow up. We mint you a vault card
              stamped with the exact moment you called it — and your spotter rank.
            </p>

            {/* CTAs */}
            <div
              style={{
                marginTop: 36,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap' as const,
              }}
            >
              <Link
                href="/auth"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'linear-gradient(180deg, #f3d488, #d9a93f)',
                  color: '#1a1305',
                  borderRadius: 9999,
                  padding: '10px 10px 10px 24px',
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow:
                    '0 0 28px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                }}
              >
                Become a Spotter
                <span
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.15)',
                    fontSize: 16,
                  }}
                >
                  →
                </span>
              </Link>
              <Link
                href="/discover"
                style={{
                  fontSize: 14,
                  color: '#a3a3a3',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                Explore roster →
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ── Scroll affordance ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          style={{
            position: 'absolute',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            color: '#404040',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              letterSpacing: '0.3em',
              textTransform: 'uppercase' as const,
            }}
          >
            SCROLL — SPIN THE ICON
          </span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          >
            <ChevronDown size={17} />
          </motion.div>
        </motion.div>
      </section>
    </>
  )
}

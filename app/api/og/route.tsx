import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get('title') ?? 'SPOTTED'
  const subtitle = searchParams.get('subtitle') ?? 'I spotted this before the crowd.'
  const creatorName = searchParams.get('creator') ?? 'Unknown Artist'
  const ticker = searchParams.get('ticker') ?? ''
  const score = searchParams.get('score') ?? '—'
  const tier = searchParams.get('tier') ?? ''
  const rank = searchParams.get('rank') ?? '—'
  const imageUrl = searchParams.get('image') ?? ''
  const spotDate = searchParams.get('date') ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Ambient gold glow */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 800,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.06) 45%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Top: SPOTLIGHT logo */}
        <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 22, letterSpacing: '0.5em', color: 'rgba(201,168,76,0.5)', fontWeight: 700, margin: 0 }}>
              SPOTLIGHT
            </p>
            <div style={{ width: 80, height: 1, background: 'rgba(201,168,76,0.3)', display: 'flex' }} />
          </div>
        </div>
        {/* User headline */}
        <div style={{ position: 'absolute', top: 220, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <p style={{ fontSize: 64, fontWeight: 900, color: 'rgba(201,168,76,0.95)', letterSpacing: '0.06em', margin: 0, textAlign: 'center', padding: '0 60px' }}>
            {title}
          </p>
        </div>
        {/* Card area */}
        <div
          style={{
            marginTop: 80,
            width: 600,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 24,
            background: 'linear-gradient(160deg, #1c1405 0%, #0e0b04 45%, #1c1405 100%)',
            border: '2.5px solid rgba(201,168,76,0.85)',
            overflow: 'hidden',
          }}
        >
          {/* Creator image */}
          {imageUrl ? (
            <div style={{ height: 340, position: 'relative', display: 'flex', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0e0b04 0%, transparent 60%)' }} />
            </div>
          ) : (
            <div style={{ height: 340, background: 'linear-gradient(135deg, #1a1008 0%, #0a0703 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 80, color: 'rgba(201,168,76,0.25)', margin: 0 }}>✦</p>
            </div>
          )}
          {/* Card body */}
          <div style={{ padding: '32px 40px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontSize: 42, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>{creatorName}</p>
              <p style={{ fontSize: 18, color: 'rgba(201,168,76,0.65)', fontWeight: 700, margin: 0, letterSpacing: '0.1em' }}>${ticker}</p>
            </div>
            <div style={{ width: '100%', height: 1, background: 'linear-gradient(to right, rgba(201,168,76,0.7), rgba(201,168,76,0.3), rgba(201,168,76,0.7))', display: 'flex' }} />
            <div style={{ display: 'flex', gap: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 14, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', fontWeight: 700, margin: 0 }}>SPOTTER RANK</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: 'rgba(201,168,76,0.95)', margin: 0 }}>#{rank}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 14, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', fontWeight: 700, margin: 0 }}>MOMENTUM</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', margin: 0 }}>{score}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 14, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.25)', fontWeight: 700, margin: 0 }}>STATUS</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'rgba(201,168,76,0.9)', margin: 0 }}>{tier}</p>
              </div>
            </div>
            {spotDate && (
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Spotted {spotDate}</p>
            )}
          </div>
          {/* Card footer */}
          <div style={{
            padding: '16px 40px',
            borderTop: '1px solid rgba(201,168,76,0.25)',
            background: 'rgba(201,168,76,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <p style={{ fontSize: 14, letterSpacing: '0.22em', color: 'rgba(201,168,76,0.45)', fontWeight: 600, margin: 0 }}>Discovery Time Capsule · Spotlight</p>
            <p style={{ fontSize: 18, color: 'rgba(201,168,76,0.5)', fontWeight: 700, margin: 0 }}>#{rank}</p>
          </div>
        </div>
        {/* Subtitle */}
        <div style={{ position: 'absolute', bottom: 280, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.38)', fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '0 80px' }}>
            {subtitle}
          </p>
        </div>
        {/* Bottom CTA */}
        <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 80, height: 1, background: 'rgba(201,168,76,0.25)', display: 'flex' }} />
          <p style={{ fontSize: 22, color: 'rgba(201,168,76,0.4)', letterSpacing: '0.35em', fontWeight: 700, margin: 0 }}>SPOTLIGHT</p>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.18)', margin: 0 }}>Discover future icons before everyone else.</p>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    }
  )
}

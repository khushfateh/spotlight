import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getShareCardBySlug, incrementShareView } from '@/lib/services/shareService'
import { getCreatorByTicker } from '@/lib/mock-data/creators'
import Link from 'next/link'

type Props = { params: Promise<{ shareSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareSlug } = await params
  const card = await getShareCardBySlug(shareSlug)
  if (!card) return { title: 'SPOTLIGHT' }

  const m = card.metadata
  const ogParams = new URLSearchParams({
    title: card.title,
    subtitle: card.subtitle,
    creator: m.creatorName,
    ticker: m.creatorTicker,
    score: String(m.score),
    tier: m.tier,
    rank: String(m.spotterRank),
    ...(m.creatorImageUrl ? { image: m.creatorImageUrl } : {}),
    date: new Date(m.spotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  })

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const imageUrl = `${base}/api/og?${ogParams}`
  const shareUrl = `${base}/share/${shareSlug}`

  return {
    title: `${m.userName} on SPOTLIGHT — ${m.creatorName}`,
    description: card.caption,
    openGraph: {
      title: `${m.userName} spotted ${m.creatorName} on SPOTLIGHT`,
      description: card.caption,
      url: shareUrl,
      images: [{ url: imageUrl, width: 1080, height: 1920, alt: card.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${m.userName} spotted ${m.creatorName} on SPOTLIGHT`,
      description: card.caption,
      images: [imageUrl],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const { shareSlug } = await params
  const card = await getShareCardBySlug(shareSlug)
  if (!card) notFound()

  // Increment view count (fire and forget server-side)
  incrementShareView(shareSlug).catch(() => {})

  const m = card.metadata
  const spotDate = new Date(m.spotDate)
  const dateStr = spotDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = spotDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const creator = getCreatorByTicker(m.creatorTicker)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#0A0A0A', padding: '24px 20px 100px' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          maxWidth: 500,
          aspectRatio: '1',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.14) 0%, rgba(201,168,76,0.04) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* SPOTLIGHT mark */}
      <div className="mb-10 flex flex-col items-center gap-2">
        <p style={{ fontSize: 12, letterSpacing: '0.5em', color: 'rgba(201,168,76,0.45)', fontWeight: 700 }}>SPOTLIGHT</p>
        <div style={{ width: 40, height: 1, background: 'rgba(201,168,76,0.25)' }} />
      </div>

      {/* User headline */}
      <h1
        className="text-center mb-2 font-black"
        style={{ fontSize: 'clamp(1.8rem, 8vw, 3rem)', letterSpacing: '0.04em', color: 'rgba(201,168,76,0.95)' }}
      >
        {card.title}
      </h1>
      <p
        className="text-center mb-8 italic"
        style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}
      >
        {card.subtitle}
      </p>

      {/* The card */}
      <div className="relative mb-10" style={{ zIndex: 2 }}>
        {/* Spotlight beam behind card */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -60, left: '50%', transform: 'translateX(-50%)',
            width: '100%', height: '60%',
            background: 'linear-gradient(to bottom, rgba(255,245,200,0.22) 0%, rgba(201,168,76,0.08) 50%, transparent 100%)',
            clipPath: 'polygon(35% 0%, 65% 0%, 90% 100%, 10% 100%)',
            filter: 'blur(18px)',
            zIndex: 0,
          }}
        />
        {/* The discovery card */}
        <div
          style={{
            width: 'min(80vw, 300px)',
            aspectRatio: '5 / 7',
            borderRadius: 16,
            background: 'linear-gradient(160deg, #1c1405 0%, #0e0b04 45%, #1c1405 100%)',
            border: '2.5px solid rgba(201,168,76,0.9)',
            boxShadow: [
              '0 0 0 1px rgba(201,168,76,0.15)',
              '0 0 45px rgba(201,168,76,0.32)',
              '0 0 90px rgba(201,168,76,0.12)',
              '0 28px 80px rgba(0,0,0,0.95)',
              'inset 0 0 40px rgba(201,168,76,0.04)',
            ].join(', '),
            position: 'relative',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          {/* Gold grid texture */}
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 1, opacity: 0.055, pointerEvents: 'none',
              backgroundImage: [
                'repeating-linear-gradient(0deg, rgba(201,168,76,1) 0px, transparent 1px, transparent 9px)',
                'repeating-linear-gradient(90deg, rgba(201,168,76,1) 0px, transparent 1px, transparent 9px)',
              ].join(', '),
            }}
          />
          {/* Top gloss */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 14, height: '38%',
            borderRadius: '14px 14px 0 0', pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 55%, transparent 100%)',
          }} />
          {/* Creator image */}
          <div style={{ height: '43%', position: 'relative', overflow: 'hidden' }}>
            {m.creatorImageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.creatorImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(12px) brightness(0.5)', transform: 'scale(1.1)' }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.creatorImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
              </>
            ) : (
              <div style={{ width: '100%', height: '100%' }} className={`bg-gradient-to-br ${creator?.coverColor ?? 'from-hype-purple to-hype-indigo'}`} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0e0b04 0%, rgba(14,11,4,0.45) 30%, transparent 65%)' }} />
            <div style={{ position: 'absolute', top: 8, right: 10, zIndex: 5 }}>
              <span style={{ fontSize: 10, color: 'rgba(201,168,76,0.9)', letterSpacing: '0.06em', fontWeight: 900 }}>SP {m.score}</span>
            </div>
            <div style={{ position: 'absolute', top: 8, left: 10, zIndex: 5 }}>
              <span style={{ fontSize: 7, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase' }}>{m.creatorCategory}</span>
            </div>
          </div>
          {/* Card body */}
          <div style={{ position: 'relative', padding: '8px 14px 6px', height: '47%', zIndex: 10 }}>
            <div style={{ marginBottom: 8 }}>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0, letterSpacing: '-0.01em' }}>{m.creatorName}</p>
              <p style={{ fontFamily: 'monospace', fontSize: 8.5, color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', margin: '2px 0 0' }}>${m.creatorTicker}</p>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(to right, rgba(201,168,76,0.7), rgba(201,168,76,0.3), rgba(201,168,76,0.7))', marginBottom: 8 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 8 }}>
              {[
                { label: 'SPOTTED BY', value: m.userName, gold: false },
                { label: 'SPOTTER RANK', value: `#${m.spotterRank}`, gold: true },
                { label: 'DATE', value: dateStr, gold: false },
                { label: 'TIME', value: timeStr, gold: false },
              ].map(({ label, value, gold }) => (
                <div key={label}>
                  <p style={{ fontSize: 6.5, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.22)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1px' }}>{label}</p>
                  <p style={{ fontSize: 10.5, color: gold ? 'rgba(201,168,76,0.95)' : 'rgba(255,255,255,0.82)', fontWeight: gold ? 800 : 600, lineHeight: 1.2, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'linear-gradient(to right, rgba(201,168,76,0.7), rgba(201,168,76,0.3), rgba(201,168,76,0.7))', marginBottom: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: 6.5, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.22)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1px' }}>Momentum</p>
                <p style={{ color: '#fff', fontWeight: 900, fontSize: 21, lineHeight: 1, margin: 0 }}>{m.score}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 6.5, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.22)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 1px' }}>Status</p>
                <p style={{ fontSize: 12, color: 'rgba(201,168,76,0.9)', fontWeight: 700, letterSpacing: '0.04em', margin: 0 }}>{m.tier}</p>
              </div>
            </div>
          </div>
          {/* Card footer */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 14px', height: '10%', zIndex: 10,
            background: 'linear-gradient(to right, rgba(201,168,76,0.14), rgba(201,168,76,0.07) 50%, rgba(201,168,76,0.14))',
            borderTop: '1px solid rgba(201,168,76,0.28)',
          }}>
            <p style={{ fontSize: 6.5, letterSpacing: '0.22em', color: 'rgba(201,168,76,0.5)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Discovery Time Capsule · Spotlight</p>
            <p style={{ fontSize: 8, color: 'rgba(201,168,76,0.55)', fontWeight: 700, margin: 0 }}>#{m.spotterRank}</p>
          </div>
          {/* Corner accents */}
          {([{ top: 6, left: 6 }, { top: 6, right: 6 }, { bottom: 6, left: 6 }, { bottom: 6, right: 6 }] as const).map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', ...pos, width: 10, height: 10,
              borderTop: !('bottom' in pos) ? '1.5px solid rgba(201,168,76,0.6)' : 'none',
              borderBottom: !('top' in pos) ? '1.5px solid rgba(201,168,76,0.6)' : 'none',
              borderLeft: !('right' in pos) ? '1.5px solid rgba(201,168,76,0.6)' : 'none',
              borderRight: !('left' in pos) ? '1.5px solid rgba(201,168,76,0.6)' : 'none',
              zIndex: 12,
            }} />
          ))}
        </div>
      </div>

      {/* Editorial label */}
      <p style={{ fontSize: 9, letterSpacing: '0.4em', color: 'rgba(201,168,76,0.3)', fontWeight: 700, marginBottom: 32 }}>
        ✦ SPOTLIGHT RECORD
      </p>

      {/* CTA section */}
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        <Link
          href="/signup"
          className="w-full flex items-center justify-center font-bold text-[#0A0A0A] rounded-2xl"
          style={{
            height: 52,
            background: 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 48%, #C9A84C 100%)',
            boxShadow: '0 4px 28px rgba(201,168,76,0.35)',
            fontSize: 14,
            letterSpacing: '0.04em',
          }}
        >
          Join SPOTLIGHT
        </Link>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
          Discover future icons before everyone else.
        </p>
        <Link
          href="/"
          style={{ fontSize: 12, color: 'rgba(201,168,76,0.4)', textDecoration: 'none' }}
        >
          Explore SPOTLIGHT →
        </Link>
      </div>

      {/* Discovery metadata footer */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col items-center py-4 gap-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }}>First spotted {dateStr}</p>
        <p style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(201,168,76,0.2)', fontWeight: 700 }}>SPOTLIGHT</p>
      </div>
    </div>
  )
}

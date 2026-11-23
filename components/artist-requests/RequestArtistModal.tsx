'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase/client'

const GOLD       = '#C9A84C'
const VOID       = '#050508'
const GLASS_BG   = 'rgba(5,5,8,0.97)'
const MONO       = "'JetBrains Mono', monospace"
const SERIF      = '"Cormorant Garamond", Georgia, serif'
const GLASS_BORDER = '1px solid rgba(201,168,76,0.18)'

const GENRES = [
  'Music', 'Hip-Hop', 'Pop', 'R&B', 'Latin', 'Punjabi / South Asian',
  'K-Pop', 'Afrobeats', 'Electronic', 'Indie / Alt',
  'Content Creation', 'Gaming', 'Sports', 'Fashion', 'Film & Visual Art',
  'Podcast', 'Other',
]

type Step = 'form' | 'success'

type Props = {
  isOpen:        boolean
  initialName?:  string
  onClose:       () => void
}

export default function RequestArtistModal({ isOpen, initialName = '', onClose }: Props) {
  const { currentUser, isAuthenticated } = useAuth()
  const [step, setStep]     = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [count, setCount]   = useState(0)

  const [form, setForm] = useState({
    artistName:      initialName,
    genre:           '',
    country:         '',
    spotifyUrl:      '',
    instagramHandle: '',
    youtubeUrl:      '',
    reason:          '',
  })

  // Sync initialName when it changes (e.g. opened from search)
  useEffect(() => {
    if (initialName) setForm(f => ({ ...f, artistName: initialName }))
  }, [initialName])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('form')
      setError(null)
      setLoading(false)
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.artistName.trim()) return
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase!.auth.getSession()
      const token = session?.access_token ?? ''

      const res = await fetch('/api/artist-requests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          artistName:      form.artistName.trim(),
          genre:           form.genre           || undefined,
          country:         form.country         || undefined,
          spotifyUrl:      form.spotifyUrl      || undefined,
          instagramHandle: form.instagramHandle || undefined,
          youtubeUrl:      form.youtubeUrl      || undefined,
          reason:          form.reason          || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'already_requested') {
          setError("You've already requested this artist. We'll let you know when they go live.")
          return
        }
        setError(data.error ?? 'Something went wrong')
        return
      }

      setCount(data.count ?? 1)
      setStep('success')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  function field(label: string, key: keyof typeof form, placeholder: string, hint?: string) {
    return (
      <div>
        <label style={{ display: 'block', fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', marginBottom: 7 }}>
          {label}
        </label>
        <input
          type="text"
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 2,
            padding: '10px 14px',
            fontFamily: MONO, fontSize: 12,
            color: 'rgba(255,255,255,0.80)',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.45)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
        />
        {hint && <p style={{ marginTop: 5, fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.08em' }}>{hint}</p>}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
          />

          {/* Modal — centering wrapper keeps transform(-50%,-50%) out of Framer Motion's hands */}
          <div
            key="modal-centering"
            style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
          >
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              pointerEvents: 'auto',
              width: 'min(560px, calc(100vw - 32px))',
              maxHeight: 'calc(100svh - 48px)',
              overflowY: 'auto',
              background: GLASS_BG,
              backdropFilter: 'blur(40px)',
              border: GLASS_BORDER,
              borderRadius: 4,
              boxShadow: '0 32px 80px rgba(0,0,0,0.80), 0 0 0 0.5px rgba(201,168,76,0.08)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 18px', borderBottom: '1px solid rgba(201,168,76,0.10)' }}>
              <div>
                <p style={{ margin: 0, fontFamily: MONO, fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.45)', marginBottom: 4 }}>◈ SPOTLIGHT</p>
                <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 300, fontSize: 22, color: 'rgba(255,255,255,0.90)', letterSpacing: '0.01em' }}>Request an Artist</h2>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.30)', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>

              {step === 'form' && (
                <form onSubmit={handleSubmit}>
                  <p style={{ margin: '0 0 24px', fontFamily: MONO, fontSize: 11, lineHeight: 1.75, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.04em' }}>
                    Know an artist that belongs on SPOTLIGHT? Request them. Once 5 spotters request the same artist, our team reviews and adds them.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Artist name — required */}
                    <div>
                      <label style={{ display: 'block', fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', marginBottom: 7 }}>
                        Artist Name <span style={{ color: GOLD }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.artistName}
                        onChange={e => setForm(f => ({ ...f, artistName: e.target.value }))}
                        placeholder="e.g. Tate McRae"
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(201,168,76,0.28)',
                          borderRadius: 2, padding: '11px 14px',
                          fontFamily: MONO, fontSize: 13,
                          color: 'rgba(255,255,255,0.90)',
                          outline: 'none', transition: 'border-color 0.2s',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.60)')}
                        onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.28)')}
                      />
                    </div>

                    {/* Genre */}
                    <div>
                      <label style={{ display: 'block', fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', marginBottom: 7 }}>
                        Genre
                      </label>
                      <select
                        value={form.genre}
                        onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(5,5,8,0.95)',
                          border: '1px solid rgba(255,255,255,0.09)',
                          borderRadius: 2, padding: '10px 14px',
                          fontFamily: MONO, fontSize: 12,
                          color: form.genre ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.28)',
                          outline: 'none', cursor: 'pointer',
                          appearance: 'none',
                        }}
                      >
                        <option value="">Select genre…</option>
                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>

                    {/* Country + Spotify on same row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {field('Country / Region', 'country', 'e.g. Canada')}
                      {field('Spotify URL', 'spotifyUrl', 'open.spotify.com/artist/…', 'optional — helps us link faster')}
                    </div>

                    {/* Instagram + YouTube on same row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {field('Instagram', 'instagramHandle', '@username')}
                      {field('YouTube', 'youtubeUrl', 'youtube.com/…')}
                    </div>

                    {/* Reason */}
                    <div>
                      <label style={{ display: 'block', fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', marginBottom: 7 }}>
                        Why SPOTLIGHT? <span style={{ color: 'rgba(255,255,255,0.20)' }}>(optional)</span>
                      </label>
                      <textarea
                        value={form.reason}
                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                        placeholder="Why do you believe in this artist? This becomes their origin story on SPOTLIGHT."
                        rows={3}
                        style={{
                          width: '100%', boxSizing: 'border-box', resize: 'vertical',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.09)',
                          borderRadius: 2, padding: '10px 14px',
                          fontFamily: MONO, fontSize: 12, lineHeight: 1.65,
                          color: 'rgba(255,255,255,0.80)',
                          outline: 'none', transition: 'border-color 0.2s',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.45)')}
                        onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                      />
                    </div>
                  </div>

                  {error && (
                    <p style={{ marginTop: 14, fontFamily: MONO, fontSize: 10, color: 'rgba(224,85,85,0.80)', letterSpacing: '0.08em' }}>{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !form.artistName.trim()}
                    style={{
                      marginTop: 24, width: '100%',
                      padding: '13px 0',
                      background: loading || !form.artistName.trim() ? 'rgba(201,168,76,0.25)' : GOLD,
                      border: 'none', borderRadius: 2,
                      fontFamily: MONO, fontSize: 10, fontWeight: 500,
                      letterSpacing: '0.26em', textTransform: 'uppercase',
                      color: '#0a0808', cursor: loading || !form.artistName.trim() ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {loading ? 'Submitting…' : 'Submit Request ◈'}
                  </button>

                  {!isAuthenticated && (
                    <p style={{ marginTop: 12, textAlign: 'center', fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em' }}>
                      You need to be signed in to submit a request
                    </p>
                  )}
                </form>
              )}

              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: 'center', padding: '12px 0 8px' }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'rgba(201,168,76,0.10)',
                    border: `1px solid rgba(201,168,76,0.35)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 24px rgba(201,168,76,0.18)',
                  }}>
                    <Check size={22} color={GOLD} />
                  </div>

                  <h3 style={{ margin: '0 0 12px', fontFamily: SERIF, fontWeight: 300, fontSize: 26, color: 'rgba(255,255,255,0.90)' }}>
                    Request submitted.
                  </h3>

                  <p style={{ margin: '0 0 8px', fontFamily: MONO, fontSize: 11, lineHeight: 1.75, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
                    <span style={{ color: GOLD }}>{count} spotter{count !== 1 ? 's' : ''}</span> {count === 1 ? 'has' : 'have'} now requested this artist.
                    We review once 5 spotters request the same artist.
                  </p>

                  <p style={{ margin: '0 0 28px', fontFamily: MONO, fontSize: 11, lineHeight: 1.75, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
                    You'll get an email when they go live — and a permanent{' '}
                    <span style={{ color: GOLD }}>◈ Founding Requester</span> badge on your vault card.
                  </p>

                  <div style={{
                    padding: '12px 20px',
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.18)',
                    borderRadius: 2,
                    marginBottom: 24,
                  }}>
                    <p style={{ margin: 0, fontFamily: MONO, fontSize: 9, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)' }}>
                      ◈ Founding Requester Badge
                    </p>
                    <p style={{ margin: '5px 0 0', fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.06em' }}>
                      When you spot this artist after they go live, your vault card will show a badge telling every viewer that you're the reason this artist is on SPOTLIGHT.
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    style={{
                      width: '100%', padding: '12px 0',
                      background: 'none',
                      border: '1px solid rgba(201,168,76,0.28)',
                      borderRadius: 2, fontFamily: MONO,
                      fontSize: 10, letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'rgba(201,168,76,0.75)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.color = GOLD }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(201,168,76,0.75)' }}
                  >
                    Continue Exploring
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

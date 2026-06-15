'use client'

import { useState } from 'react'
import { ChevronRight, Check, Music, Gamepad2, Video, Dumbbell, Coffee, Mic, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { CreatorCategory } from '@/types'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3 | 4 | 5

const categories: { label: CreatorCategory; icon: React.ReactNode; desc: string }[] = [
  { label: 'Music', icon: <Music size={20} />, desc: 'Musicians, producers, songwriters' },
  { label: 'Gaming', icon: <Gamepad2 size={20} />, desc: 'Streamers, esports, gaming creators' },
  { label: 'Content', icon: <Video size={20} />, desc: 'YouTube, TikTok, lifestyle vloggers' },
  { label: 'Sports', icon: <Dumbbell size={20} />, desc: 'Athletes, coaches, fitness creators' },
  { label: 'Lifestyle', icon: <Coffee size={20} />, desc: 'Fashion, beauty, wellness' },
  { label: 'Podcast', icon: <Mic size={20} />, desc: 'Podcasters, talk shows, interviews' },
]

export default function LaunchPage() {
  const [step, setStep] = useState<Step>(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [form, setForm] = useState({
    category: '' as CreatorCategory | '',
    instagram: '',
    tiktok: '',
    youtube: '',
    spotify: '',
    twitch: '',
    pitch: '',
    useOfFunds: '',
    fundraisingGoal: '',
    revenueSource: '',
  })

  function next() {
    if (step < 5) setStep((s) => (s + 1) as Step)
    else setIsSubmitted(true)
  }
  function back() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  const stepTitles = [
    'Your Category',
    'Social Handles',
    'Your Pitch',
    'Fundraising Goal',
    'Review & Submit',
  ]

  if (isSubmitted) {
    return (
      <div className="px-4 pt-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-hype-green/10 border border-hype-green/20 flex items-center justify-center mb-5">
          <Check size={36} className="text-hype-green" />
        </div>
        <h2 className="text-hype-text font-black text-2xl mb-2">Application Submitted!</h2>
        <p className="text-hype-secondary text-sm leading-relaxed mb-6 max-w-xs">
          Your creator application is under review. Our team will verify your details and get back to you within 48 hours.
        </p>
        <div className="w-full premium-card rounded-2xl p-4 text-left mb-6">
          <p className="text-hype-text font-semibold text-sm mb-3">What happens next</p>
          <div className="space-y-3">
            {[
              { step: '1', label: 'Identity & document verification', status: 'pending' },
              { step: '2', label: 'Social media validation', status: 'pending' },
              { step: '3', label: 'Admin approval & share setup', status: 'pending' },
              { step: '4', label: 'Creator profile goes live', status: 'locked' },
            ].map(({ step: s, label, status }) => (
              <div key={s} className="flex items-center gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  status === 'locked'
                    ? 'bg-hype-surface-2 text-hype-dim border border-hype-border'
                    : 'bg-hype-gold/10 text-hype-gold border border-hype-gold/20'
                )}>
                  {s}
                </div>
                <span className="text-hype-secondary text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-hype-dim text-[10px] mb-6">
          This is a mock application. No real review process will occur.
        </p>
        <Button variant="primary" size="lg" fullWidth onClick={() => { setIsSubmitted(false); setStep(1) }}>
          Start Over (Demo)
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-2">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={back} className="w-8 h-8 rounded-full bg-hype-surface-2 border border-hype-border flex items-center justify-center text-hype-muted hover:text-hype-text transition-colors">
                <ArrowLeft size={14} />
              </button>
            )}
            <h1 className="text-hype-text font-bold text-lg">{stepTitles[step - 1]}</h1>
          </div>
          <span className="text-hype-dim text-xs">{step}/5</span>
        </div>

        <div className="h-0.5 bg-hype-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-hype-gold rounded-full transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div className="space-y-2.5">
          <p className="text-hype-secondary text-sm mb-4">What type of creator are you?</p>
          {categories.map(({ label, icon, desc }) => (
            <button
              key={label}
              onClick={() => setForm(f => ({ ...f, category: label }))}
              className={cn(
                'w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left',
                form.category === label
                  ? 'bg-hype-gold/8 border-hype-gold/30 text-hype-text'
                  : 'premium-card hover:border-hype-border-light',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                form.category === label ? 'bg-hype-gold/15 text-hype-gold' : 'bg-hype-surface-2 text-hype-muted'
              )}>
                {icon}
              </div>
              <div>
                <p className={cn('font-semibold text-sm', form.category === label ? 'text-hype-text' : 'text-hype-secondary')}>{label}</p>
                <p className="text-hype-muted text-xs">{desc}</p>
              </div>
              {form.category === label && (
                <div className="ml-auto w-5 h-5 rounded-full bg-hype-gold flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-[#0A0A0A]" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Social Handles */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-hype-secondary text-sm mb-2">Connect your social channels so we can verify your reach.</p>
          {[
            { key: 'instagram', label: 'Instagram', placeholder: '@yourhandle' },
            { key: 'tiktok', label: 'TikTok', placeholder: '@yourhandle' },
            { key: 'youtube', label: 'YouTube', placeholder: 'Channel name' },
            { key: 'spotify', label: 'Spotify', placeholder: 'Artist name (if applicable)' },
            { key: 'twitch', label: 'Twitch', placeholder: 'Username (if applicable)' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-hype-muted text-xs mb-1.5 block">{label}</label>
              <input
                type="text"
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-hype-surface border border-hype-border rounded-xl px-4 py-3 text-hype-text text-sm placeholder:text-hype-muted outline-none focus:border-hype-border-light transition-colors"
              />
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Pitch */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-hype-secondary text-sm mb-2">Tell investors why they should back you.</p>
          <div>
            <label className="text-hype-muted text-xs mb-1.5 block">Creator Pitch</label>
            <textarea
              value={form.pitch}
              onChange={e => setForm(f => ({ ...f, pitch: e.target.value }))}
              placeholder="Why should fans invest in you? What's your story, your trajectory, your vision? Be authentic and specific."
              rows={5}
              className="w-full bg-hype-surface border border-hype-border rounded-xl p-4 text-hype-text text-sm placeholder:text-hype-muted outline-none focus:border-hype-border-light transition-colors resize-none"
            />
            <p className="text-hype-dim text-[10px] mt-1 text-right">{form.pitch.length}/500</p>
          </div>
          <div>
            <label className="text-hype-muted text-xs mb-1.5 block">Use of Funds</label>
            <textarea
              value={form.useOfFunds}
              onChange={e => setForm(f => ({ ...f, useOfFunds: e.target.value }))}
              placeholder="How will you use the capital raised? (e.g. studio time, tour costs, content equipment, team)"
              rows={3}
              className="w-full bg-hype-surface border border-hype-border rounded-xl p-4 text-hype-text text-sm placeholder:text-hype-muted outline-none focus:border-hype-border-light transition-colors resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 4: Fundraising Goal */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-hype-secondary text-sm mb-2">Set your fundraising target and explain your revenue streams.</p>
          <div>
            <label className="text-hype-muted text-xs mb-1.5 block">Fundraising Goal</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-hype-muted font-semibold">$</span>
              <input
                type="number"
                value={form.fundraisingGoal}
                onChange={e => setForm(f => ({ ...f, fundraisingGoal: e.target.value }))}
                placeholder="50000"
                className="w-full bg-hype-surface border border-hype-border rounded-xl px-4 pl-8 py-3 text-hype-text text-lg font-semibold tabular placeholder:text-hype-muted outline-none focus:border-hype-border-light transition-colors"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[10000, 50000, 100000, 500000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setForm(f => ({ ...f, fundraisingGoal: String(amount) }))}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-medium text-hype-muted bg-hype-surface-2 border border-hype-border hover:text-hype-secondary hover:border-hype-border-light transition-colors"
                >
                  ${(amount / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-hype-muted text-xs mb-1.5 block">Revenue Streams</label>
            <textarea
              value={form.revenueSource}
              onChange={e => setForm(f => ({ ...f, revenueSource: e.target.value }))}
              placeholder="List your revenue sources that will contribute to the investor revenue pool (e.g. streaming royalties, merch, brand deals)"
              rows={4}
              className="w-full bg-hype-surface border border-hype-border rounded-xl p-4 text-hype-text text-sm placeholder:text-hype-muted outline-none focus:border-hype-border-light transition-colors resize-none"
            />
          </div>

          <div className="premium-card rounded-xl p-3 border-l-2 border-hype-gold">
            <p className="text-hype-gold text-xs font-semibold mb-1">Revenue Pool Structure</p>
            <p className="text-hype-secondary text-[10px] leading-relaxed">
              10% of revenue pool distributed quarterly to shareholders · 90% stays with creator · Platform fee: 5–8% on fundraising
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div className="space-y-4">
          <p className="text-hype-secondary text-sm mb-2">Review your application before submitting.</p>

          <div className="premium-card rounded-2xl overflow-hidden divide-y divide-hype-border">
            {[
              { label: 'Category', value: form.category || 'Not selected' },
              { label: 'Instagram', value: form.instagram || 'Not provided' },
              { label: 'TikTok', value: form.tiktok || 'Not provided' },
              { label: 'Fundraising Goal', value: form.fundraisingGoal ? `$${Number(form.fundraisingGoal).toLocaleString()}` : 'Not set' },
              { label: 'Pitch', value: form.pitch ? form.pitch.slice(0, 80) + (form.pitch.length > 80 ? '...' : '') : 'Not provided' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4 px-4 py-3">
                <span className="text-hype-muted text-xs flex-shrink-0">{label}</span>
                <span className="text-hype-text text-xs font-medium text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="premium-card rounded-xl p-3 border-l-2 border-hype-amber">
            <p className="text-hype-amber text-xs font-semibold mb-1">Demo Application</p>
            <p className="text-hype-secondary text-[10px] leading-relaxed">
              This is a mock submission. No real application will be processed. Creator Shares are not real financial instruments.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          disabled={step === 1 && !form.category}
          onClick={next}
        >
          {step === 5 ? 'Submit Application' : 'Continue'}
          {step < 5 && <ChevronRight size={16} />}
        </Button>
      </div>
    </div>
  )
}

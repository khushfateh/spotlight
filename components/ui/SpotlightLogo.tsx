import { cn } from '@/lib/utils'

export function SpotlightMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.15)}
      viewBox="0 0 20 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M10 6 L2 22 L18 22 Z" fill="currentColor" fillOpacity={0.12} />
      <line x1="10" y1="6" x2="2" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="6" x2="18" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="3.5" r="3" fill="currentColor" />
    </svg>
  )
}

export function SpotlightWordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SpotlightMark size={16} className="text-hype-gold" />
      <span
        className="text-hype-text font-semibold uppercase"
        style={{ fontSize: 11, letterSpacing: '0.18em' }}
      >
        Spotlight
      </span>
    </div>
  )
}

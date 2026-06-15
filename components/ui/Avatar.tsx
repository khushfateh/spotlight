import { cn } from '@/lib/utils'

type AvatarProps = {
  initials: string
  gradientClass: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isVerified?: boolean
  className?: string
}

const sizes = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

export function Avatar({ initials, gradientClass, size = 'md', isVerified, className }: AvatarProps) {
  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-semibold text-white/90 bg-gradient-to-br ring-1 ring-white/5',
          `bg-gradient-to-br ${gradientClass}`,
          sizes[size],
        )}
      >
        {initials}
      </div>
      {isVerified && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-hype-gold rounded-full flex items-center justify-center ring-1 ring-hype-bg">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3 5.5L6.5 2" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
}

import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'red' | 'gold' | 'blue' | 'purple' | 'muted' | 'outline'

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  size?: 'sm' | 'md'
}

const variants: Record<BadgeVariant, string> = {
  green:   'bg-hype-green/10 text-hype-green border border-hype-green/20',
  red:     'bg-hype-red/10 text-hype-red border border-hype-red/20',
  gold:    'bg-hype-gold/10 text-hype-gold border border-hype-gold/20',
  blue:    'bg-hype-indigo/10 text-hype-indigo border border-hype-indigo/20',
  purple:  'bg-hype-purple/10 text-hype-purple border border-hype-purple/20',
  muted:   'bg-hype-surface-2 text-hype-muted border border-hype-border',
  outline: 'bg-transparent text-hype-muted border border-hype-border',
}

export function Badge({ children, variant = 'muted', className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full tracking-wide',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

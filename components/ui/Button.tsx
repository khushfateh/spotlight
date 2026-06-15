import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'buy' | 'sell'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-hype-gold text-[#0A0A0A] hover:bg-hype-gold-dim font-semibold shadow-sm',
  secondary:
    'bg-hype-surface-2 text-hype-text hover:bg-hype-surface-3 border border-hype-border font-medium',
  ghost:
    'bg-transparent text-hype-secondary hover:text-hype-text hover:bg-hype-surface-2 font-medium',
  danger:
    'bg-transparent text-hype-red hover:bg-hype-red/10 border border-hype-red/20 font-medium',
  outline:
    'bg-transparent text-hype-text hover:bg-hype-surface-2 border border-hype-border font-medium',
  buy:
    'bg-hype-gold text-[#0A0A0A] hover:bg-hype-gold-dim font-semibold shadow-sm',
  sell:
    'bg-transparent text-hype-red hover:bg-hype-red/10 border border-hype-red/20 font-semibold',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-sm rounded-xl',
  xl: 'px-8 py-3.5 text-sm rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

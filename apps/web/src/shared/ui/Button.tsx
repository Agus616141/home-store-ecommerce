import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'terra' | 'ghost' | 'light'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--color-ink)', color: 'var(--color-cream)', border: '1px solid transparent' },
  terra:   { background: 'var(--color-terra)', color: '#fff', border: '1px solid transparent' },
  ghost:   { background: 'transparent', color: 'var(--color-ink)', border: '1px solid var(--color-line-2)' },
  light:   { background: 'var(--color-paper)', color: 'var(--color-ink)', border: '1px solid var(--color-line)' },
}

const sizeStyles: Record<Size, string> = {
  sm: 'text-[13px] px-[18px] py-[9px]',
  md: 'text-[14.5px] px-[26px] py-[13px]',
  lg: 'text-[15.5px] px-[34px] py-[16px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', block = false, loading = false, disabled, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-[9px] font-sans font-semibold tracking-[.01em] rounded-full whitespace-nowrap transition-all duration-150 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${block ? 'w-full' : ''} ${className}`}
        style={variantStyles[variant]}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

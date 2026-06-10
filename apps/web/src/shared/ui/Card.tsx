import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
}

export function Card({ padded = false, className = '', children, style, ...props }: CardProps) {
  return (
    <div
      className={`rounded-[20px] ${padded ? 'p-[clamp(18px,2.4vw,28px)]' : ''} ${className}`}
      style={{
        background: 'var(--color-paper)',
        border: '1px solid var(--color-line)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

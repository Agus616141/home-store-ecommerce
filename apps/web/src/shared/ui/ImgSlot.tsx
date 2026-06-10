interface ImgSlotProps {
  n: number | string
  className?: string
  style?: React.CSSProperties
}

export function ImgSlot({ n, className = '', style }: ImgSlotProps) {
  return (
    <div
      className={`flex items-center justify-center select-none ${className}`}
      style={{
        background: '#d1d5db',
        color: '#374151',
        fontFamily: 'monospace',
        fontWeight: 700,
        fontSize: 'clamp(16px, 4vw, 40px)',
        letterSpacing: '-0.02em',
        ...style,
      }}
      aria-hidden="true"
    >
      {n}
    </div>
  )
}

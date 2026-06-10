const SIZE_MAP = { sm: 16, md: 24, lg: 36 }

interface SpinnerProps {
  size?: number | 'sm' | 'md' | 'lg'
  label?: string
}

export function Spinner({ size = 'md', label = 'Cargando…' }: SpinnerProps) {
  const px = typeof size === 'number' ? size : SIZE_MAP[size]
  return (
    <span role="status" aria-label={label} className="inline-block">
      <span
        className="block rounded-full border-2 border-t-transparent animate-spin"
        style={{
          width: px,
          height: px,
          borderColor: 'var(--color-terra) transparent transparent transparent',
        }}
        aria-hidden="true"
      />
    </span>
  )
}

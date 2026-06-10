interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ title = 'Algo salió mal', message, onRetry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 text-center py-12 px-6"
    >
      <span
        className="text-[40px] leading-none"
        aria-hidden="true"
      >
        ⚠
      </span>
      <div>
        <p className="font-semibold text-[16px]" style={{ color: 'var(--color-ink)' }}>
          {title}
        </p>
        <p className="text-[14px] mt-1" style={{ color: 'var(--color-ink-soft)' }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[13px] font-semibold px-5 py-2 rounded-full border transition-colors hover:border-[var(--color-ink)]"
          style={{ borderColor: 'var(--color-line-2)' }}
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-[7px]">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-semibold" style={{ color: 'var(--color-ink-2)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full font-sans text-[15px] rounded-[6px] px-[14px] py-3 transition-all duration-150 outline-none ${className}`}
          style={{
            background: 'var(--color-paper)',
            border: `1px solid ${error ? 'var(--color-terra)' : 'var(--color-line-2)'}`,
            color: 'var(--color-ink)',
            boxShadow: error ? '0 0 0 3px var(--color-terra-soft)' : undefined,
          }}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} role="alert" className="text-[12.5px] font-medium" style={{ color: 'var(--color-terra)' }}>
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${inputId}-hint`} className="text-[12.5px]" style={{ color: 'var(--color-ink-soft)' }}>
            {hint}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

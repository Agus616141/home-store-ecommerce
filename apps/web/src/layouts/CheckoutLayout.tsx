import { Link, Outlet } from 'react-router-dom'
import { ScrollToTop } from '../app/ScrollToTop'

export function CheckoutLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)' }}>
      <ScrollToTop />
      {/* Minimal nav */}
      <header
        className="border-b"
        style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper)' }}
      >
        <div
          className="wrap-wide flex justify-between items-center"
          style={{ height: 72 }}
        >
          <Link
            to="/"
            className="font-serif font-semibold text-[27px] tracking-[-0.01em] flex items-center gap-[9px]"
          >
            Casa
            <span
              className="inline-block rounded-full mb-[14px]"
              style={{ width: 9, height: 9, background: 'var(--color-terra)' }}
              aria-hidden="true"
            />
          </Link>

          <span
            className="flex items-center gap-2 text-[13px]"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Pago seguro
          </span>
        </div>
      </header>

      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}

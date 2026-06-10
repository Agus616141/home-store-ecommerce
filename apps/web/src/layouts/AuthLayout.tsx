import { Link, Outlet } from 'react-router-dom'
import { ScrollToTop } from '../app/ScrollToTop'

export function AuthLayout() {
  return (
    <div
      className="grid min-h-screen"
      style={{ gridTemplateColumns: '1fr 1fr' }}
    >
      <ScrollToTop />
      {/* Visual panel — oculto en mobile */}
      <div
        className="relative overflow-hidden max-md:hidden"
        style={{ background: 'var(--color-terra-soft)' }}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(34,30,24,.30), rgba(34,30,24,.55))' }}
        />

        {/* Imagen de fondo */}
        <img
          src="/img/login-404.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Brand overlay */}
        <Link
          to="/"
          className="absolute top-[34px] left-10 font-serif font-semibold text-[27px] flex items-center gap-[9px] z-10"
          style={{ color: 'var(--color-cream)' }}
        >
          Casa
          <span
            className="inline-block rounded-full mb-[14px]"
            style={{ width: 9, height: 9, background: 'var(--color-terra)' }}
            aria-hidden="true"
          />
        </Link>

        {/* Quote */}
        <div
          className="absolute left-10 right-10 bottom-11 z-10"
          style={{ color: 'var(--color-cream)' }}
        >
          <span
            className="block text-[12px] tracking-[.22em] uppercase font-semibold mb-3"
            style={{ color: 'var(--color-gold)' }}
          >
            Bienvenido
          </span>
          <p
            className="font-serif italic font-medium leading-[1.3] max-w-[440px]"
            style={{ fontSize: 'clamp(22px,2vw,28px)' }}
          >
            "Una casa bien hecha es una forma de cuidarse todos los días."
          </p>
        </div>
      </div>

      {/* Form slot */}
      <div className="flex items-center justify-center" style={{ padding: 'clamp(48px,5vw,64px)' }}>
        <div className="w-full max-w-[400px]">
          {/* Brand visible solo en mobile */}
          <Link
            to="/"
            className="md:hidden font-serif font-semibold text-[27px] flex items-center gap-[9px] mb-8"
          >
            Casa
            <span
              className="inline-block rounded-full mb-[14px]"
              style={{ width: 9, height: 9, background: 'var(--color-terra)' }}
              aria-hidden="true"
            />
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div
      className="grid min-h-[calc(100vh-80px)]"
      style={{ gridTemplateColumns: '1fr 1fr' }}
    >
      {/* Imagen izquierda */}
      <div className="relative overflow-hidden max-md:hidden">
        <img
          src="/img/login-404.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(34,30,24,.15), rgba(34,30,24,.45))' }}
        />
        <div
          className="absolute left-10 right-10 bottom-11 z-10"
          style={{ color: 'var(--color-cream)' }}
        >
          <span
            className="font-serif font-semibold block"
            style={{ fontSize: 'clamp(60px,9vw,120px)', lineHeight: 1, opacity: 0.18 }}
            aria-hidden="true"
          >
            404
          </span>
        </div>
      </div>

      {/* Contenido derecho */}
      <div className="flex items-center justify-center col-span-2 md:col-span-1" style={{ padding: 'clamp(48px,6vw,80px)' }}>
        <div className="max-w-[420px] w-full">
          <span
            className="font-serif font-semibold block mb-4"
            style={{ fontSize: 'clamp(64px,8vw,100px)', lineHeight: 1, color: 'var(--color-terra)' }}
            aria-hidden="true"
          >
            404
          </span>
          <h1
            className="font-serif font-semibold"
            style={{ fontSize: 'clamp(26px,3vw,38px)', color: 'var(--color-ink)' }}
          >
            Página no encontrada
          </h1>
          <p className="mt-3 mb-8 text-[16px] leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>
            La página que buscás no existe o fue movida. Podés volver al inicio o explorar la tienda.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-semibold text-[14.5px] px-[26px] py-[13px] rounded-full transition-colors"
              style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#000')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-ink)')}
            >
              Volver al inicio
            </Link>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 font-semibold text-[14.5px] px-[26px] py-[13px] rounded-full border transition-colors"
              style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-ink)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-line-2)')}
            >
              Ver tienda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

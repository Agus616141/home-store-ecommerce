import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard, type ProductCardData } from '../../products/components/ProductCard'
import { formatPrice } from '../../../shared/lib/format-price'
import { productsApi } from '../../../shared/api/endpoints'
import { toProductCardData } from '../../catalog/controllers/useCatalogController'
import { useAuthStore, selectIsAuthenticated } from '../../../shared/stores/auth.store'
import type { ProductSummary } from '../../../shared/api/dto.types'

/*
 * Slots pendientes (sin imagen aún):
 *  17 → PDP "Por qué la vas a amar"
 *  18 → PDP Highlight "Costuras ocultas"
 *  19 → PDP Highlight "Marco sólido"
 *  23 → PDP foto en reseña 1
 *  24 → PDP foto en reseña 2
 */

const TESTIMONIALS = [
  { stars: 5, text: 'Increíble calidad. La tela se siente lujosa y la silla llegó perfectamente armada. Vale cada peso.', name: 'Michel Jensen', avatar: '/img/img-14.jpg' },
  { stars: 5, text: 'El sofá es hermoso y súper cómodo. El color combina perfecto con mi sala. Lo recomiendo totalmente.', name: 'Danna Rusoff', avatar: '/img/img-15.jpg' },
  { stars: 5, text: 'Diseño simple y bien hecho. El proceso de compra y el envío fueron impecables. Volveré a comprar.', name: 'Jeanne Bal', avatar: '/img/img-16.jpg' },
]

const AMBIENT_CARDS = [
  { label: 'Living',      to: '/catalog/living',      img: '/img/img-11.jpg' },
  { label: 'Dormitorio',  to: '/catalog/dormitorio',  img: '/img/img-8.jpg' },
  { label: 'Decoración',  to: '/catalog/decoracion',  img: '/img/img-12.jpg' },
]

/* ---- Componentes de sección ---- */

function HeroSection() {
  const [featured, setFeatured] = useState<ProductSummary | null>(null)

  useEffect(() => {
    productsApi
      .getFeatured()
      .then(setFeatured)
      .catch(() => {
        // isFeatured no está en el schema aún — usar primer producto como fallback
        productsApi.list({ limit: 1, sort: 'newest' })
          .then(res => { if (res.products.length > 0) setFeatured(res.products[0]!) })
          .catch(() => null)
      })
  }, [])

  const heroImg  = featured?.images[0]?.url ?? '/img/img-5.jpg'
  const thumbImg = featured?.images[0]?.url ?? '/img/img-6.jpg'

  return (
    <section className="relative overflow-hidden" style={{ paddingTop: 'clamp(28px,5vw,64px)', paddingBottom: 'clamp(40px,6vw,90px)' }}>
      <span
        className="absolute -z-10 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ right: -120, top: -40, background: 'radial-gradient(circle, var(--color-terra-soft), transparent 68%)', opacity: .6 }}
        aria-hidden="true"
      />
      <div
        className="wrap-wide grid gap-[clamp(24px,4vw,64px)] items-center"
        style={{ gridTemplateColumns: '1.05fr 1fr' }}
      >
        {/* Texto */}
        <div>
          <span className="eyebrow">Colección 2026 · Diseño de autor</span>
          <h1 className="h-hero mt-[18px]">
            Tu casa, con<br />
            <em style={{ fontStyle: 'italic', color: 'var(--color-terra)' }}>intención.</em>
          </h1>
          <p className="lead mt-[22px] max-w-[430px]">
            Muebles y objetos hechos para durar. Piezas de autor, materiales nobles y un servicio
            de principio a fin: envío, armado y garantía.
          </p>
          <div className="flex gap-[14px] flex-wrap items-center mt-[30px]">
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-[9px] font-semibold rounded-full px-[34px] py-[16px] text-[15.5px] transition-colors"
              style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#000')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-ink)')}
            >
              Explorar la tienda
            </Link>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 font-semibold text-[14px] border-b-[1.5px] pb-[3px] transition-[gap] hover:gap-3"
              style={{ borderColor: 'var(--color-ink)' }}
            >
              Ver colecciones
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
          <div className="flex gap-[30px] mt-[34px]">
            {[
              { num: '4.9', lbl: '★ 2,100+ reseñas' },
              { num: '70%', lbl: 'hasta de descuento' },
              { num: '3 años', lbl: 'de garantía' },
            ].map(({ num, lbl }) => (
              <div key={num}>
                <div className="font-serif font-semibold text-[32px] leading-none">{num}</div>
                <div className="text-[12.5px] mt-1" style={{ color: 'var(--color-ink-soft)' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual — imagen y mini tarjeta del producto destacado */}
        <div className="relative">
          {featured ? (
            <Link to={`/product/${featured.slug}`} tabIndex={-1} aria-hidden="true">
              <img
                src={heroImg}
                alt={featured.name}
                className="aspect-[4/5] w-full rounded-[28px] object-cover"
                style={{ boxShadow: 'var(--shadow-lg)' }}
              />
            </Link>
          ) : (
            <img
              src={heroImg}
              alt="Producto destacado"
              className="aspect-[4/5] w-full rounded-[28px] object-cover"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            />
          )}

          {/* Floating product card */}
          {featured && (
            <Link
              to={`/product/${featured.slug}`}
              className="absolute -left-[34px] bottom-[34px] rounded-[20px] p-[14px_18px] flex gap-[13px] items-center max-w-[240px]"
              style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line)', boxShadow: 'var(--shadow-md)' }}
            >
              <img
                src={thumbImg}
                alt={featured.name}
                className="w-[48px] h-[48px] rounded-[10px] shrink-0 object-cover"
              />
              <div>
                <div className="font-bold text-[14px] line-clamp-1">{featured.name}</div>
                <div className="flex items-center gap-2 mt-[2px]">
                  <span className="stars text-[12px]">★★★★★</span>
                  <span className="mono">{formatPrice(featured.priceCents)}</span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function TrustSection() {
  const items = [
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>,
      title: 'Pago seguro', sub: 'Stripe · 256-bit SSL',
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/></svg>,
      title: 'Calidad premium', sub: 'Materiales nobles',
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="1" y="6" width="14" height="11" rx="1"/><path d="M15 9h4l3 3v5h-7z"/><circle cx="6" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/></svg>,
      title: 'Envío e instalación', sub: 'Gratis desde $150',
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/></svg>,
      title: '60 días de devolución', sub: 'Sin preguntas',
    },
  ]

  return (
    <section
      className="border-y"
      style={{ borderColor: 'var(--color-line)', background: 'var(--color-cream-2)' }}
      aria-label="Garantías y beneficios"
    >
      <div className="wrap-wide px-0">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {items.map((item, i) => (
            <div
              key={item.title}
              className="flex gap-[13px] items-center"
              style={{ padding: 'clamp(16px,2vw,22px) clamp(20px,4vw,56px)', borderLeft: i > 0 ? '1px solid var(--color-line)' : undefined }}
            >
              <span
                className="w-[38px] h-[38px] rounded-full grid place-items-center shrink-0"
                style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line-2)', color: 'var(--color-terra)' }}
              >
                {item.icon}
              </span>
              <div>
                <div className="font-semibold text-[14px]">{item.title}</div>
                <div className="text-[12.5px] mt-[2px]" style={{ color: 'var(--color-ink-soft)' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CollectionsSection() {
  const collections = [
    { label: 'Living',     sub: 'Sala de estar', to: '/catalog/living',     img: '/img/img-7.jpg' },
    { label: 'Dormitorio', sub: 'Descanso',       to: '/catalog/dormitorio', img: '/img/img-8.jpg' },
    { label: 'Decoración', sub: 'Detalles',       to: '/catalog/decoracion', img: '/img/img-9.jpg' },
  ]

  return (
    <section className="section" id="colecciones">
      <div className="wrap-wide">
        <div className="flex items-end justify-between mb-[36px]">
          <div>
            <span className="eyebrow">Curaduría</span>
            <h2 className="h1 mt-3">Colecciones exclusivas</h2>
          </div>
          <Link
            to="/catalog"
            className="hidden md:inline-flex items-center gap-2 font-semibold text-[14px] border-b-[1.5px] pb-[3px] transition-[gap] hover:gap-3"
            style={{ borderColor: 'var(--color-ink)' }}
          >
            Todos los productos
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
          {collections.map(col => (
            <Link
              key={col.label}
              to={col.to}
              className="relative rounded-[20px] overflow-hidden cursor-pointer group"
              aria-label={`Colección ${col.label}`}
            >
              <img
                src={col.img}
                alt={col.label}
                className="min-h-[300px] h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-105"
              />
              <div
                className="absolute inset-0 flex flex-col justify-end p-[26px]"
                style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(34,30,24,.62))' }}
              >
                <span className="text-[12px] tracking-[.18em] uppercase opacity-85" style={{ color: 'var(--color-cream)' }}>
                  {col.sub}
                </span>
                <span className="font-serif font-semibold text-[30px] leading-none mt-[6px]" style={{ color: 'var(--color-cream)' }}>
                  {col.label}
                </span>
                <span className="mt-[14px] text-[13.5px] font-semibold inline-flex gap-2 items-center opacity-92" style={{ color: 'var(--color-cream)' }}>
                  Explorar
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function EditorialSection() {
  return (
    <section className="wrap-wide" style={{ paddingBottom: 'clamp(56px,8vw,120px)' }}>
      <div
        className="overflow-hidden grid"
        style={{ background: 'var(--color-ink)', color: 'var(--color-cream)', borderRadius: 28, gridTemplateColumns: '1fr 1fr' }}
      >
        <div className="flex flex-col justify-center" style={{ padding: 'clamp(34px,5vw,68px)' }}>
          <span className="eyebrow" style={{ color: 'var(--color-gold)' }}>El taller</span>
          <h2 className="h2 mt-[14px] mb-[18px]">
            Hecho a mano,<br />pensado para la vida real.
          </h2>
          <p className="mb-[28px] max-w-[420px]" style={{ color: 'rgba(244,239,230,.78)' }}>
            Cada pieza nace en nuestro taller con maderas certificadas y telas naturales.
            Diseño honesto que envejece bien y se siente como propio desde el primer día.
          </p>
          <Link
            to="/catalog"
            className="self-start inline-flex items-center justify-center font-semibold text-[14.5px] px-[26px] py-[13px] rounded-full border transition-colors hover:bg-white/10"
            style={{ border: '1px solid rgba(244,239,230,.35)', color: 'var(--color-cream)' }}
          >
            Conoce el proceso
          </Link>
        </div>
        <img
          src="/img/img-10.jpg"
          alt="Taller artesanal"
          className="min-h-[380px] w-full h-full object-cover"
          aria-hidden="true"
        />
      </div>
    </section>
  )
}

function BestsellersSection() {
  const [products, setProducts] = useState<ProductCardData[]>([])

  useEffect(() => {
    productsApi.list({ limit: 4, sort: 'newest' }).then((res) =>
      setProducts(res.products.map(toProductCardData))
    )
  }, [])

  return (
    <section className="wrap-wide" style={{ paddingBottom: 'clamp(56px,8vw,120px)' }}>
      <div className="flex items-end justify-between mb-[34px]">
        <div>
          <span className="eyebrow">Favoritos</span>
          <h2 className="h1 mt-3">Los más queridos</h2>
        </div>
        <Link
          to="/catalog"
          className="hidden md:inline-flex items-center gap-2 font-semibold text-[14px] transition-colors hover:text-[var(--color-terra)]"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Ver todos →
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-[26px] max-md:grid-cols-2 max-sm:grid-cols-2 max-sm:gap-4">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} slotNumber={25 + i} />
        ))}
      </div>
    </section>
  )
}

function SaleBandSection() {
  return (
    <section className="wrap-wide" style={{ paddingBottom: 'clamp(56px,8vw,120px)' }}>
      <div
        className="grid items-center rounded-[28px] relative overflow-hidden"
        style={{ background: 'var(--color-terra)', padding: 'clamp(34px,5vw,60px)', gridTemplateColumns: '1.4fr 1fr', gap: 30 }}
      >
        <span
          className="absolute rounded-full pointer-events-none"
          style={{ width: 340, height: 340, background: 'rgba(255,255,255,.08)', right: -80, top: -120 }}
          aria-hidden="true"
        />
        <div>
          <span className="eyebrow" style={{ color: 'rgba(255,255,255,.80)' }}>Payday Sale</span>
          <h2 className="h2 mt-3" style={{ color: '#fff' }}>30% OFF en tu próxima compra</h2>
          <p className="mt-3 max-w-[420px]" style={{ color: 'rgba(255,255,255,.85)' }}>
            Gasta mínimo $100 y obtén un cupón del 30% para tu siguiente pedido. Válido en toda la tienda.
          </p>
          <div
            className="inline-flex items-center gap-[10px] rounded-[10px] mt-[18px] px-4 py-[10px] font-bold tracking-[.06em]"
            style={{ background: 'rgba(255,255,255,.16)', border: '1px dashed rgba(255,255,255,.55)', color: '#fff' }}
          >
            CÓDIGO: <span style={{ letterSpacing: '.12em' }}>CASA30</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Link
            to="/catalog"
            className="inline-flex items-center justify-center font-semibold text-[15.5px] px-[34px] py-[16px] rounded-full transition-colors"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-paper)')}
          >
            Comprar ahora
          </Link>
        </div>
      </div>
    </section>
  )
}

function CategorySplitSection() {
  return (
    <section className="wrap-wide" style={{ paddingBottom: 'clamp(56px,8vw,120px)' }}>
      <h2 className="h2 mb-[34px]">Compra por ambiente</h2>
      <div className="grid grid-cols-3 gap-5 max-sm:grid-cols-1">
        {AMBIENT_CARDS.map(card => (
          <Link
            key={card.label}
            to={card.to}
            className="relative rounded-[20px] overflow-hidden cursor-pointer group aspect-square block"
            aria-label={`Ir a ${card.label}`}
          >
            <img
              src={card.img}
              alt={card.label}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-105"
            />
            <div
              className="absolute inset-0 flex flex-col justify-end p-[26px]"
              style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(34,30,24,.62))' }}
            >
              <span className="font-serif font-semibold text-[30px] leading-none" style={{ color: 'var(--color-cream)' }}>
                {card.label}
              </span>
              <span className="mt-[8px] text-[13.5px] font-semibold opacity-90" style={{ color: 'var(--color-cream)' }}>
                Ver colección →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="wrap-wide" style={{ paddingBottom: 'clamp(56px,8vw,120px)' }}>
      <div className="text-center mb-[38px]">
        <span className="eyebrow">#CasaEnCasa</span>
        <h2 className="h1 mt-3">Lo que dicen nuestros clientes</h2>
      </div>
      <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
        {TESTIMONIALS.map(({ stars, text, name, avatar }) => (
          <blockquote
            key={name}
            className="flex flex-col rounded-[20px] p-[28px]"
            style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line)' }}
          >
            <span className="stars text-[15px]" aria-label={`${stars} de 5 estrellas`}>
              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
            </span>
            <p
              className="font-serif italic font-medium text-[20px] leading-[1.4] mt-[14px] mb-[18px] flex-1"
              style={{ color: 'var(--color-ink)' }}
            >
              {text}
            </p>
            <footer className="flex gap-3 items-center">
              <img
                src={avatar}
                alt={name}
                className="w-10 h-10 rounded-full shrink-0 object-cover"
              />
              <div>
                <div className="font-bold text-[14px]">{name}</div>
                <div className="mono" style={{ color: 'var(--color-ink-soft)' }}>Compra verificada</div>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}

function JoinSection() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  if (isAuthenticated) return null

  return (
    <section className="wrap-wide" style={{ paddingBottom: 'clamp(56px,8vw,120px)' }}>
      <div
        className="flex items-center justify-between rounded-[20px] gap-[30px] flex-wrap"
        style={{ background: 'var(--color-cream-2)', border: '1px solid var(--color-line)', padding: 'clamp(18px,2.4vw,28px)' }}
      >
        <div>
          <h2 className="h2">Únete a la familia Casa</h2>
          <p className="lead mt-[10px] max-w-[460px]">
            Creá tu cuenta y accedé a seguimiento de pedidos, historial de compras y ofertas exclusivas.
          </p>
        </div>
        <Link
          to="/auth"
          className="shrink-0 inline-flex items-center justify-center font-semibold text-[15.5px] px-[34px] py-[16px] rounded-full transition-colors"
          style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#000')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-ink)')}
        >
          Registrarme
        </Link>
      </div>
    </section>
  )
}

/* ---- Página ---- */

export function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <CollectionsSection />
      <EditorialSection />
      <BestsellersSection />
      <SaleBandSection />
      <CategorySplitSection />
      <TestimonialsSection />
      <JoinSection />
    </>
  )
}

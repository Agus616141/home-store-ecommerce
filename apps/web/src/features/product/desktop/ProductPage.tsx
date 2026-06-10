import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ProductCard, type ProductCardData } from '../../products/components/ProductCard'
import { formatPrice } from '../../../shared/lib/format-price'
import { Spinner } from '../../../shared/ui/Spinner'
import { ErrorMessage } from '../../../shared/ui/ErrorMessage'
import { ImgSlot } from '../../../shared/ui/ImgSlot'
import { useProductController } from '../controllers/useProductController'
import { productsApi, reviewsApi } from '../../../shared/api/endpoints'
import { ApiError } from '../../../shared/api/client'
import { toProductCardData } from '../../catalog/controllers/useCatalogController'
import { useAuthStore, selectIsAuthenticated, selectUser } from '../../../shared/stores/auth.store'
import type { ProductDetail, Review, ReviewListResponse } from '../../../shared/api/dto.types'

/* ---- Helpers ---- */

function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(i => <span key={i} aria-hidden="true">{i <= Math.round(rating) ? '★' : '☆'}</span>)}
    </span>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-[30px] transition-colors leading-none"
          style={{ color: n <= (hover || value) ? 'var(--color-terra)' : 'var(--color-line-2)' }}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
        >★</button>
      ))}
    </div>
  )
}

function Initials({ name, size = 42 }: { name: string; size?: number }) {
  const parts = name.trim().split(' ')
  const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
  const palette = ['#8B7355', '#6B8E6B', '#7B6B9E', '#9E7B6B', '#5E8E9E', '#9E8E6B']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % palette.length
  return (
    <div
      className="rounded-full grid place-items-center shrink-0 font-bold text-white select-none"
      style={{ width: size, height: size, background: palette[Math.abs(h) % palette.length], fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >{initials}</div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ---- Gallery ---- */
function Gallery({ images }: { images: { url: string; altText?: string | null }[] }) {
  const [active, setActive] = useState(0)
  const [failedUrls, setFailedUrls] = useState<Record<string, true>>({})
  const displayImages = images.length > 0 ? images : null
  const activeImage = displayImages?.[active] ?? displayImages?.[0] ?? null

  function markFailed(url: string) {
    setFailedUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }))
  }

  return (
    <div className="grid gap-4 sticky top-[96px]" style={{ gridTemplateColumns: '74px 1fr' }}>
      <div className="flex flex-col gap-3">
        {displayImages ? displayImages.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="aspect-square rounded-[10px] overflow-hidden border-2 transition-colors"
            style={{ borderColor: active === i ? 'var(--color-ink)' : 'transparent' }}
            aria-label={`Ver imagen ${i + 1}`}
            aria-pressed={active === i}
          >
            {failedUrls[img.url] ? (
              <ImgSlot n={i + 1} className="w-full h-full" style={{ fontSize: 14 }} />
            ) : (
              <img
                src={img.url}
                alt={img.altText ?? ''}
                loading="eager"
                decoding="async"
                onError={() => markFailed(img.url)}
                className="w-full h-full object-cover"
              />
            )}
          </button>
        )) : [1, 2, 3, 4].map(i => (
          <button
            key={i}
            onClick={() => setActive(i - 1)}
            className="aspect-square rounded-[10px] overflow-hidden border-2 transition-colors"
            style={{ borderColor: active === i - 1 ? 'var(--color-ink)' : 'transparent' }}
            aria-label={`Ver imagen ${i}`}
            aria-pressed={active === i - 1}
          >
            <ImgSlot n={i} className="w-full h-full" style={{ fontSize: 14 }} />
          </button>
        ))}
      </div>
      <div className="aspect-[4/5] rounded-[20px] overflow-hidden" aria-label="Imagen principal del producto">
        {activeImage && !failedUrls[activeImage.url] ? (
          <img
            src={activeImage.url}
            alt={activeImage.altText ?? ''}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={() => markFailed(activeImage.url)}
            className="w-full h-full object-cover rounded-[20px]"
          />
        ) : (
          <ImgSlot n={active + 1} className="w-full h-full rounded-[20px]" />
        )}
      </div>
    </div>
  )
}

/* ---- Accordion ---- */
function Accordion({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b" style={{ borderColor: 'var(--color-line)' }}>
      <button
        className="w-full flex justify-between items-center py-[18px] font-semibold text-[15.5px] cursor-pointer"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {title}
        <span
          className="text-[22px] transition-transform duration-200"
          style={{ color: 'var(--color-ink-soft)', display: 'inline-block', transform: open ? 'rotate(45deg)' : 'none' }}
          aria-hidden="true"
        >+</span>
      </button>
      {open && (
        <p className="pb-[20px] text-[14.5px] leading-[1.65]" style={{ color: 'var(--color-ink-2)' }}>
          {body}
        </p>
      )}
    </div>
  )
}

/* ---- Buy Box ---- */
interface ReviewMeta { avg: number | null; count: number }

interface BuyBoxProps {
  product: ProductDetail
  qty: number
  setQty: (q: number) => void
  onAddToCart: () => void
  canAddToCart: boolean
  reviewMeta: ReviewMeta | null
}

function BuyBox({ product, qty, setQty, onAddToCart, canAddToCart, reviewMeta }: BuyBoxProps) {
  const [selectedSwatch, setSelectedSwatch] = useState(0)
  const [justAdded, setJustAdded] = useState(false)

  function handleAddToCart() {
    if (!canAddToCart) return
    onAddToCart()
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
  }

  const swatches = product.attributes?.['Color'] ?? []
  const avg = reviewMeta?.avg ?? null
  const count = reviewMeta?.count ?? 0

  return (
    <div>
      {/* Rating row */}
      <div className="flex items-center gap-[10px]">
        <Stars rating={avg ?? 0} />
        <span className="text-[13.5px]" style={{ color: 'var(--color-ink-soft)' }}>
          {avg !== null ? avg.toFixed(1) : '—'} · {count} reseña{count !== 1 ? 's' : ''}
        </span>
        <span
          className="ml-auto text-[11.5px] font-bold tracking-[.04em] uppercase px-[10px] py-[5px] rounded-[6px]"
          style={{ background: 'color-mix(in srgb, var(--color-ok) 16%, white)', color: 'var(--color-ok)' }}
        >
          {product.stock > 0 ? 'En stock' : 'Sin stock'}
        </span>
      </div>

      <h1 className="h2 mt-3 mb-[6px]">{product.name}</h1>
      <div className="text-[14.5px]" style={{ color: 'var(--color-ink-soft)' }}>
        exclusivo de <strong style={{ color: 'var(--color-ink-2)' }}>home.store</strong>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-4 my-[18px]">
        <span className="font-serif font-semibold text-[38px] leading-none" style={{ color: 'var(--color-terra)' }}>
          {formatPrice(product.priceCents)}
        </span>
      </div>

      <p className="text-[15px] leading-[1.6] max-w-[460px]" style={{ color: 'var(--color-ink-2)' }}>
        {product.description}
      </p>

      {/* Color swatches */}
      {swatches.length > 0 && (
        <div className="mt-[20px]">
          <div className="text-[13px] font-semibold mb-[10px] flex gap-[10px]">
            Color
            <span className="font-normal" style={{ color: 'var(--color-ink-soft)' }}>
              · {swatches[selectedSwatch]}
            </span>
          </div>
          <div className="flex gap-3">
            {swatches.map((c, i) => (
              <button
                key={c}
                onClick={() => setSelectedSwatch(i)}
                className="w-[34px] h-[34px] rounded-full border-2 border-white transition-all"
                style={{
                  background: c,
                  boxShadow: selectedSwatch === i ? `0 0 0 2px var(--color-terra)` : '0 0 0 1px var(--color-line-2)',
                }}
                aria-label={c}
                aria-pressed={selectedSwatch === i}
              />
            ))}
          </div>
        </div>
      )}

      {/* Shipping note */}
      <div
        className="flex gap-[10px] items-center rounded-[10px] px-[14px] py-3 text-[14px] my-[18px]"
        style={{ background: 'var(--color-cream-2)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-terra)" strokeWidth="1.6" aria-hidden="true">
          <rect x="1" y="6" width="14" height="11" rx="1"/><path d="M15 9h4l3 3v5h-7z"/>
          <circle cx="6" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>
        </svg>
        Envío gratis · llega entre el <strong>22–25 de agosto</strong>
      </div>

      {/* Qty + Add to cart */}
      <div className="flex gap-3 items-stretch">
        <div
          className="flex items-center rounded-full px-1"
          style={{ border: '1px solid var(--color-line-2)', background: 'var(--color-paper)' }}
        >
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-[38px] h-[38px] rounded-full text-[18px] transition-colors hover:bg-[var(--color-cream-2)]"
            aria-label="Reducir cantidad"
          >−</button>
          <span className="min-w-[34px] text-center font-bold" aria-live="polite">{qty}</span>
          <button
            onClick={() => setQty(qty + 1)}
            className="w-[38px] h-[38px] rounded-full text-[18px] transition-colors hover:bg-[var(--color-cream-2)]"
            aria-label="Aumentar cantidad"
          >+</button>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart || justAdded}
          className="flex-1 inline-flex items-center justify-center gap-2 font-semibold text-[14.5px] rounded-full transition-colors disabled:opacity-70"
          style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
        >
          {justAdded ? '✓ Agregado' : product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
        </button>
      </div>

      <Link
        to="/checkout"
        className="mt-3 flex w-full items-center justify-center font-semibold text-[14.5px] py-[13px] rounded-full text-white transition-colors"
        style={{ background: 'var(--color-terra)' }}
      >
        Comprar ahora
      </Link>

      <p className="text-[13px] mt-3" style={{ color: 'var(--color-ink-soft)' }}>
        o 4 pagos sin interés de <strong>{formatPrice(Math.round(product.priceCents / 4))}</strong> con Klarna
      </p>

      {/* Trust box */}
      <div
        className="grid grid-cols-2 gap-3 mt-[22px] p-[18px] rounded-[14px]"
        style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}
      >
        {[
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/></svg>, text: 'Mejor precio garantizado' },
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/></svg>, text: 'Devolución 60 días' },
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>, text: 'Garantía de 3 años' },
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 3 3 5-6"/></svg>, text: 'Armado incluido' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex gap-[9px] items-center text-[13.5px]">
            <span style={{ color: 'var(--color-terra)', flexShrink: 0 }}>{icon}</span>
            {text}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Accordion title="Detalles del producto" body={product.description} />
        <Accordion title="Envío y devoluciones" body="Envío gratis en pedidos superiores a $150. Entrega estimada 5–8 días hábiles con armado incluido. Devoluciones gratuitas dentro de los 60 días." />
        <Accordion title="Garantía" body="3 años de garantía sobre defectos de fabricación. Cobertura incluida en el precio, sin costos adicionales." />
      </div>
    </div>
  )
}

/* ---- Related products ---- */
function RelatedProducts({ currentSlug }: { currentSlug: string }) {
  const [related, setRelated] = useState<ProductCardData[]>([])

  useEffect(() => {
    productsApi.list({ limit: 5 }).then((res) => {
      const filtered = res.products
        .filter((p) => p.slug !== currentSlug)
        .slice(0, 4)
        .map(toProductCardData)
      setRelated(filtered)
    })
  }, [currentSlug])

  if (related.length === 0) return null

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap-wide">
        <div className="flex justify-between items-center mb-[30px]">
          <h2 className="h2">También te puede gustar</h2>
          <Link
            to="/catalog"
            className="hidden md:inline-flex items-center gap-2 font-semibold text-[14px] border-b-[1.5px] pb-[3px]"
            style={{ borderColor: 'var(--color-ink)' }}
          >
            Ver más →
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-[26px] max-md:grid-cols-2">
          {related.map((p, i) => <ProductCard key={p.id} product={p} slotNumber={25 + i} />)}
        </div>
      </div>
    </section>
  )
}

/* ---- Reviews section ---- */
function ReviewsSection({
  product,
  onMeta,
}: {
  product: ProductDetail
  onMeta: (meta: ReviewMeta) => void
}) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formRating, setFormRating] = useState(5)
  const [formTitle, setFormTitle] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [myReviewId, setMyReviewId] = useState<string | null>(null)

  const isAuth = useAuthStore(selectIsAuthenticated)
  const user = useAuthStore(selectUser)

  const applyResponse = useCallback((res: ReviewListResponse, append: boolean) => {
    setReviews(prev => append ? [...prev, ...res.reviews] : res.reviews)
    setTotal(res.total)
    setAvgRating(res.averageRating)
    setTotalPages(res.pages)
    onMeta({ avg: res.averageRating, count: res.total })
    if (user) {
      const mine = res.reviews.find(r => r.userId === user.id)
      if (mine) {
        setAlreadyReviewed(true)
        setMyReviewId(mine.id)
      }
    }
  }, [onMeta, user])

  const loadPage = useCallback((p: number, append = false) => {
    setLoading(true)
    reviewsApi.list(product.id, p)
      .then(res => { applyResponse(res, append); setPage(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [applyResponse, product.id])

  useEffect(() => { loadPage(1) }, [loadPage])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (formRating < 1) return
    setSubmitting(true)
    setFormError('')
    try {
      await reviewsApi.create(product.id, {
        rating: formRating,
        title: formTitle.trim() || undefined,
        body: formBody.trim() || undefined,
      })
      setShowForm(false)
      setFormTitle('')
      setFormBody('')
      setFormRating(5)
      loadPage(1)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setAlreadyReviewed(true)
        setShowForm(false)
        // Si aún no tenemos el ID, recargamos para encontrar la reseña existente
        if (!myReviewId) loadPage(1)
      } else {
        setFormError(err instanceof Error ? err.message : 'No pudimos publicar tu reseña.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(reviewId: string) {
    try {
      await reviewsApi.delete(reviewId)
      setAlreadyReviewed(false)
      setMyReviewId(null)
      loadPage(1)
    } catch {
      // silent
    }
  }

  const ratingBars = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length
    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
    return { stars, count, pct }
  })

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap-wide">
        <h2 className="h1 mb-[34px]">Reseñas y valoraciones</h2>
        <div className="grid gap-[46px] items-start max-md:grid-cols-1" style={{ gridTemplateColumns: '300px 1fr' }}>

          {/* Summary card */}
          <div
            className="text-center p-[28px] rounded-[20px] sticky top-[96px]"
            style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}
          >
            <div className="font-serif font-semibold text-[64px] leading-none">
              {avgRating !== null ? avgRating.toFixed(1) : '—'}
            </div>
            <Stars rating={avgRating ?? 0} size={18} />
            <div className="text-[13.5px] mt-[6px]" style={{ color: 'var(--color-ink-soft)' }}>
              basado en {total} reseña{total !== 1 ? 's' : ''}
            </div>

            <div className="my-5 flex flex-col gap-2 text-left">
              {ratingBars.map(({ stars, count, pct }) => (
                <div key={stars} className="flex items-center gap-[10px] text-[13px]">
                  <span className="w-5">{stars}★</span>
                  <div className="flex-1 h-[7px] rounded-full overflow-hidden" style={{ background: 'var(--color-cream-2)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--color-terra)' }} />
                  </div>
                  <span className="w-5 text-right" style={{ color: 'var(--color-ink-soft)' }}>{count}</span>
                </div>
              ))}
            </div>

            {!isAuth ? (
              <Link
                to="/auth"
                className="w-full block py-[11px] px-[26px] rounded-full font-semibold text-[14px] border text-center transition-colors hover:border-[var(--color-ink)]"
                style={{ borderColor: 'var(--color-line-2)' }}
              >
                Iniciá sesión para reseñar
              </Link>
            ) : alreadyReviewed ? (
              <div className="text-center">
                <p className="text-[13px] mb-[10px]" style={{ color: 'var(--color-ink-soft)' }}>
                  Ya dejaste tu reseña
                </p>
                {myReviewId && (
                  <button
                    onClick={() => handleDelete(myReviewId)}
                    className="text-[12.5px] font-medium underline underline-offset-2 transition-opacity hover:opacity-60"
                    style={{ color: 'var(--color-ink-soft)' }}
                  >
                    Eliminar mi reseña
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowForm(v => !v)}
                className="w-full py-[11px] px-[26px] rounded-full font-semibold text-[14px] border transition-colors hover:border-[var(--color-ink)]"
                style={{ borderColor: showForm ? 'var(--color-ink)' : 'var(--color-line-2)' }}
              >
                {showForm ? 'Cancelar' : 'Escribir una reseña'}
              </button>
            )}
          </div>

          {/* Right column: form + list */}
          <div>
            {/* Inline write form */}
            {showForm && (
              <form
                onSubmit={handleSubmit}
                className="mb-6 p-[24px] rounded-[20px]"
                style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}
              >
                <h3 className="font-bold text-[16px] mb-[18px]">Tu reseña</h3>

                <div className="mb-[16px]">
                  <label className="block text-[13px] font-semibold mb-[8px]" style={{ color: 'var(--color-ink-soft)' }}>
                    Valoración
                  </label>
                  <StarPicker value={formRating} onChange={setFormRating} />
                </div>

                <div className="mb-[14px]">
                  <label className="block text-[13px] font-semibold mb-[8px]" style={{ color: 'var(--color-ink-soft)' }}>
                    Título <span className="font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Resume tu experiencia"
                    maxLength={120}
                    className="w-full px-[14px] py-[10px] rounded-[10px] text-[14.5px] outline-none"
                    style={{ border: '1px solid var(--color-line-2)', background: 'var(--color-cream)' }}
                  />
                </div>

                <div className="mb-[18px]">
                  <label className="block text-[13px] font-semibold mb-[8px]" style={{ color: 'var(--color-ink-soft)' }}>
                    Comentario <span className="font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={formBody}
                    onChange={e => setFormBody(e.target.value)}
                    placeholder="Contanos qué te pareció el producto…"
                    rows={4}
                    maxLength={1000}
                    className="w-full px-[14px] py-[10px] rounded-[10px] text-[14.5px] outline-none resize-none"
                    style={{ border: '1px solid var(--color-line-2)', background: 'var(--color-cream)' }}
                  />
                </div>

                {formError && (
                  <p className="text-[13.5px] mb-[14px]" style={{ color: '#c0392b' }}>
                    {formError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || formRating < 1}
                    className="flex-1 py-[11px] rounded-full font-semibold text-[14px] transition-colors disabled:opacity-60"
                    style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
                  >
                    {submitting ? 'Publicando…' : 'Publicar reseña'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-[20px] py-[11px] rounded-full font-semibold text-[14px] border transition-colors hover:bg-white"
                    style={{ borderColor: 'var(--color-line-2)' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Review list */}
            {loading && reviews.length === 0 ? (
              <div className="py-[40px] flex justify-center"><Spinner /></div>
            ) : reviews.length === 0 ? (
              <p className="py-[30px] text-[15px]" style={{ color: 'var(--color-ink-soft)' }}>
                Aún no hay reseñas. ¡Sé el primero en opinar!
              </p>
            ) : (
              <>
                {reviews.map(r => {
                  const fullName = `${r.user.firstName} ${r.user.lastName}`
                  const isOwn = user?.id === r.userId
                  return (
                    <article key={r.id} className="py-[22px] border-b" style={{ borderColor: 'var(--color-line)' }}>
                      <div className="flex gap-3 items-center mb-[10px]">
                        <Initials name={fullName} />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">{fullName}</div>
                          <div className="mono text-[12px]" style={{ color: 'var(--color-ink-soft)' }}>
                            {formatDate(r.createdAt)}
                            {r.isVerifiedPurchase && ' · Compra verificada'}
                          </div>
                        </div>
                        <Stars rating={r.rating} />
                      </div>
                      {r.title && (
                        <p className="font-semibold text-[14.5px] mb-[4px]">{r.title}</p>
                      )}
                      {r.body && (
                        <p className="text-[14.5px] leading-[1.65]" style={{ color: 'var(--color-ink-2)' }}>{r.body}</p>
                      )}
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="mt-[10px] text-[12.5px] font-medium transition-opacity hover:opacity-70"
                          style={{ color: 'var(--color-ink-soft)' }}
                        >
                          Eliminar reseña
                        </button>
                      )}
                    </article>
                  )
                })}

                {page < totalPages && (
                  <button
                    onClick={() => loadPage(page + 1, true)}
                    disabled={loading}
                    className="mt-[22px] py-[11px] px-[26px] rounded-full font-semibold text-[14px] border transition-colors hover:bg-white disabled:opacity-60"
                    style={{ background: 'var(--color-paper)', borderColor: 'var(--color-line)' }}
                  >
                    {loading ? 'Cargando…' : 'Ver más reseñas'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---- Página ---- */
export function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { product, loading, error, qty, setQty, addToCart, canAddToCart } = useProductController(slug)
  const [reviewMeta, setReviewMeta] = useState<ReviewMeta | null>(null)

  if (loading) {
    return (
      <div className="wrap-wide flex justify-center py-[80px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="wrap-wide py-[80px]">
        <ErrorMessage message={error || 'Producto no encontrado.'} />
      </div>
    )
  }

  return (
    <>
      <div className="wrap-wide">
        {/* Breadcrumb */}
        <nav className="text-[13px] py-[22px]" style={{ color: 'var(--color-ink-soft)' }} aria-label="Ruta de navegación">
          <Link to="/" className="hover:text-[var(--color-ink)]">Home</Link>{' / '}
          <Link to="/catalog" className="hover:text-[var(--color-ink)]">Tienda</Link>{' / '}
          <Link to="/catalog" className="hover:text-[var(--color-ink)]">Todos</Link>{' / '}
          <span style={{ color: 'var(--color-ink)' }}>{product.name}</span>
        </nav>

        {/* PDP grid */}
        <div
          className="grid gap-[54px] items-start pb-[30px]"
          style={{ gridTemplateColumns: '1.25fr 1fr' }}
        >
          <Gallery images={product.images} />
          <BuyBox
            product={product}
            qty={qty}
            setQty={setQty}
            onAddToCart={addToCart}
            canAddToCart={canAddToCart}
            reviewMeta={reviewMeta}
          />
        </div>
      </div>

      {/* Why you'll love it */}
      <section className="section">
        <div className="wrap-wide grid grid-cols-2 gap-[40px] items-center max-md:grid-cols-1">
          <div>
            <span className="eyebrow">Por qué la vas a amar</span>
            <h2 className="h2 mt-3">Comodidad escultórica<br />que dura años.</h2>
            <ul className="mt-[18px] flex flex-col gap-[14px] list-none p-0">
              {[
                'Estructura de fresno macizo que soporta el uso diario.',
                'Apoyabrazos esculpidos para soporte ergonómico.',
                'Tapizado suave y resistente a manchas.',
                'Mejor precio garantizado y armado incluido.',
              ].map(f => (
                <li key={f} className="flex gap-3 items-start text-[15.5px]">
                  <span
                    className="w-[30px] h-[30px] rounded-full grid place-items-center shrink-0 mt-px"
                    style={{ background: 'var(--color-cream-2)', color: 'var(--color-terra)' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <img src="/img/img-7.jpg" alt="Sala de estar con mobiliario" className="aspect-[4/3] rounded-[20px] w-full object-cover" />
        </div>
      </section>

      {/* Highlights */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap-wide">
          <div className="text-center mb-[38px]">
            <span className="eyebrow">Detalles que importan</span>
            <h2 className="h1 mt-3">Destacados del producto</h2>
          </div>
          <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
            {[
              { title: 'Costuras ocultas', desc: 'Uniones limpias y reforzadas, sin tornillos a la vista. Cada pieza se ensambla a mano para un acabado impecable.', img: '/img/products/p5.jpg', alt: 'Detalle de tela bouclé' },
              { title: 'Marco sólido y firme', desc: 'El fresno macizo da estabilidad y durabilidad. Una estructura pensada para acompañarte por años.', img: '/img/products/p8.jpg', alt: 'Detalle de madera maciza' },
            ].map(({ title, desc, img, alt }) => (
              <div key={title} className="grid gap-[18px] items-center" style={{ gridTemplateColumns: '140px 1fr' }}>
                <img src={img} alt={alt} className="aspect-square rounded-[12px] w-full h-full object-cover" />
                <div>
                  <h3 className="h3">{title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.6]" style={{ color: 'var(--color-ink-soft)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ReviewsSection product={product} onMeta={setReviewMeta} />

      <RelatedProducts currentSlug={slug} />
    </>
  )
}

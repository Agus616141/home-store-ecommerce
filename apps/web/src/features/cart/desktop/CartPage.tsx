import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard, type ProductCardData } from '../../products/components/ProductCard'
import { formatPrice } from '../../../shared/lib/format-price'
import { useCartController, itemStockIssue } from '../controllers/useCartController'
import { productsApi } from '../../../shared/api/endpoints'
import { toProductCardData } from '../../catalog/controllers/useCatalogController'
import type { CartItem } from '../../../shared/stores/cart.store'

/* ---- Quantity control ---- */
function QtyControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div
      className="flex items-center rounded-full"
      style={{ border: '1px solid var(--color-line-2)', background: 'var(--color-paper)', padding: 3 }}
    >
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-8 h-8 rounded-full text-[16px] transition-colors hover:bg-[var(--color-cream-2)]"
        aria-label="Reducir cantidad"
      >−</button>
      <span className="min-w-7 text-center font-bold text-[14px]" aria-live="polite">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full text-[16px] transition-colors hover:bg-[var(--color-cream-2)]"
        aria-label="Aumentar cantidad"
      >+</button>
    </div>
  )
}

/* ---- Cart item row ---- */
function CartItemRow({ item, onQty, onRemove }: {
  item: CartItem
  onQty: (id: string, qty: number) => void
  onRemove: (id: string) => void
}) {
  const issue = itemStockIssue(item)
  const hasIssue = issue !== 'none'

  return (
    <div
      className="grid items-center gap-5 py-[22px] border-b"
      style={{
        gridTemplateColumns: '108px 1fr auto',
        borderColor: hasIssue ? 'var(--color-terra)' : 'var(--color-line)',
      }}
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-[108px] aspect-square rounded-[12px] shrink-0 object-cover"
          style={hasIssue ? { opacity: 0.55 } : undefined}
        />
      ) : (
        <div
          className="w-[108px] aspect-square rounded-[12px] shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--color-cream-2), var(--color-line))' }}
          aria-hidden="true"
        />
      )}
      <div>
        <div className="font-semibold text-[16.5px]">{item.name}</div>

        {hasIssue && (
          <div
            role="alert"
            className="inline-flex items-center gap-[7px] mt-2 px-[10px] py-[5px] rounded-[6px] text-[12.5px] font-semibold"
            style={{ background: 'color-mix(in srgb, var(--color-terra) 14%, white)', color: 'var(--color-terra)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            {issue === 'out'
              ? 'Sin stock — eliminá este producto para continuar'
              : `Solo quedan ${item.stock} — reducí la cantidad o eliminá el producto`}
          </div>
        )}

        <div className="flex gap-4 mt-3">
          <button
            onClick={() => onRemove(item.productId)}
            className="text-[13px] border-b pb-[1px] transition-colors hover:text-[var(--color-terra)] hover:border-[var(--color-terra)]"
            style={{ color: 'var(--color-ink-soft)', borderColor: 'var(--color-line-2)' }}
          >
            Eliminar
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-[14px]">
        <QtyControl value={item.qty} onChange={qty => onQty(item.productId, qty)} />
        <div className="font-bold text-[17px]">{formatPrice(item.priceCents * item.qty)}</div>
      </div>
    </div>
  )
}

/* ---- Order summary ---- */
function CartSummary({ subtotal, count, blocked }: { subtotal: number; count: number; blocked: boolean }) {
  const shipping = subtotal >= 15000 ? 0 : 1500
  const total = subtotal + shipping

  return (
    <aside className="sticky top-[96px]">
      <div className="rounded-[20px] p-[clamp(18px,2.4vw,28px)]" style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line)' }}>
        <h2 className="h3 mb-4">Resumen</h2>

        <div className="flex justify-between py-2 text-[15px]">
          <span style={{ color: 'var(--color-ink-soft)' }}>Subtotal ({count} art.)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between py-2 text-[15px]">
          <span style={{ color: 'var(--color-ink-soft)' }}>Envío</span>
          {shipping === 0
            ? <span className="font-semibold" style={{ color: 'var(--color-ok)' }}>Gratis</span>
            : <span>{formatPrice(shipping)}</span>
          }
        </div>

        <hr className="my-[14px]" style={{ border: 0, borderTop: '1px solid var(--color-line)' }} />

        <div className="flex justify-between items-baseline py-2 font-bold text-[20px]">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        {blocked ? (
          <>
            <button
              type="button"
              disabled
              className="mt-[18px] flex w-full items-center justify-center font-semibold text-[15.5px] py-[16px] rounded-full cursor-not-allowed"
              style={{ background: 'var(--color-line)', color: 'var(--color-ink-soft)' }}
            >
              Ir a pagar →
            </button>
            <p role="alert" className="text-center text-[13px] mt-3 font-semibold" style={{ color: 'var(--color-terra)' }}>
              Hay productos sin stock en tu carrito. Eliminálos para continuar.
            </p>
          </>
        ) : (
          <>
            <Link
              to="/checkout"
              className="mt-[18px] flex w-full items-center justify-center font-semibold text-[15.5px] py-[16px] rounded-full transition-colors"
              style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
            >
              Ir a pagar →
            </Link>

            <p className="text-center mono mt-3" style={{ color: 'var(--color-ink-soft)' }}>
              🔒 Pago 100% seguro con Stripe
            </p>
          </>
        )}
      </div>

      <div className="flex gap-[14px] justify-center mt-[18px] text-[12.5px]" style={{ color: 'var(--color-ink-soft)' }}>
        <span>✓ Devolución 60 días</span>
        <span>✓ Garantía 3 años</span>
      </div>
    </aside>
  )
}

/* ---- Empty state ---- */
function EmptyCart() {
  return (
    <div className="text-center py-[50px] max-w-[440px] mx-auto">
      <div
        className="w-24 h-24 rounded-full grid place-items-center mx-auto mb-[22px]"
        style={{ background: 'var(--color-cream-2)' }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-terra)" strokeWidth="1.3" aria-hidden="true">
          <path d="M6 6h15l-1.5 9h-12z"/>
          <circle cx="9" cy="20" r="1.5"/>
          <circle cx="18" cy="20" r="1.5"/>
          <path d="M6 6 5 3H2"/>
        </svg>
      </div>
      <h2 className="h2">Tu carrito está vacío</h2>
      <p className="lead mt-[10px] mb-6">
        Aún no agregaste nada. Descubre piezas de autor para cada rincón de tu casa.
      </p>
      <Link
        to="/catalog"
        className="inline-flex items-center justify-center font-semibold text-[15.5px] px-[34px] py-[16px] rounded-full transition-colors"
        style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
      >
        Explorar la tienda
      </Link>
    </div>
  )
}

/* ---- Página ---- */
export function CartPage() {
  const { items, isEmpty, count, total, hasStockIssues, setQty, removeItem } = useCartController()
  const [recs, setRecs] = useState<ProductCardData[]>([])

  useEffect(() => {
    productsApi.list({ limit: 4, sort: 'newest' })
      .then(res => setRecs(res.products.map(toProductCardData)))
      .catch(() => null)
  }, [])

  return (
    <div className="wrap-wide">
      {/* Header */}
      <div className="flex justify-between items-end pt-6 mb-2">
        <div>
          <span className="eyebrow muted">Paso 1 de 3</span>
          <h1 className="h1 mt-2">Tu carrito</h1>
        </div>
        <Link
          to="/catalog"
          className="hidden md:inline-flex items-center gap-2 font-semibold text-[14px] transition-colors hover:text-[var(--color-terra)]"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          ← Seguir comprando
        </Link>
      </div>

      {isEmpty ? (
        <EmptyCart />
      ) : (
        <div
          className="grid gap-[44px] items-start pb-[90px]"
          style={{ gridTemplateColumns: '1fr 380px' }}
        >
          <div>
            {items.map(item => (
              <CartItemRow
                key={item.productId}
                item={item}
                onQty={setQty}
                onRemove={removeItem}
              />
            ))}
          </div>
          <CartSummary subtotal={total} count={count} blocked={hasStockIssues} />
        </div>
      )}

      {/* Recommendations */}
      {recs.length > 0 && (
        <section className="pb-[90px]">
          <h2 className="h2 mb-[26px]">Completa tu espacio</h2>
          <div className="grid grid-cols-4 gap-[26px] max-md:grid-cols-2">
            {recs.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}

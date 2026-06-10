import { Link, useParams } from 'react-router-dom'
import { formatPrice } from '../../../shared/lib/format-price'
import { formatDate } from '../../../shared/lib/format-date'
import { Spinner } from '../../../shared/ui/Spinner'
import { useOrderDetailController } from '../controllers/useOrderDetailController'

export function OrderSuccessPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { order, loading } = useOrderDetailController(id)

  return (
    <div className="max-w-[640px] mx-auto" style={{ padding: 'clamp(40px,5vw,72px) clamp(20px,4vw,40px) 90px' }}>
      {/* Success header */}
      <div className="text-center mb-[40px]">
        <div
          className="w-[80px] h-[80px] rounded-full grid place-items-center mx-auto mb-5"
          style={{ background: 'color-mix(in srgb, var(--color-ok) 14%, var(--color-paper))', animation: 'pop .5s cubic-bezier(.2,.9,.3,1.4)' }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--color-ok)" strokeWidth="2.2" aria-hidden="true">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <span className="eyebrow">Pedido confirmado</span>
        <h1 className="h1 mt-2">¡Gracias por tu compra!</h1>
        <p className="lead mt-3 max-w-[420px] mx-auto">
          Tu pago fue procesado correctamente. Recibirás un email con los detalles del envío.
        </p>
      </div>

      {/* Order detail */}
      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : order ? (
        <div className="rounded-[20px] overflow-hidden mb-6" style={{ border: '1px solid var(--color-line)' }}>
          {/* Header */}
          <div className="px-6 py-4 border-b flex justify-between items-center flex-wrap gap-2"
            style={{ background: 'var(--color-cream-2)', borderColor: 'var(--color-line)' }}>
            <div>
              <div className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-ink-soft)' }}>Pedido</div>
              <div className="font-bold text-[15px] mt-[2px]">{order.id.slice(0, 16)}…</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-ink-soft)' }}>Fecha</div>
              <div className="font-semibold text-[14px] mt-[2px]">{formatDate(order.createdAt)}</div>
            </div>
          </div>

          {/* Items */}
          {order.items.map((item) => (
            <div key={item.productId} className="flex gap-[14px] justify-between items-center px-6 py-[14px] border-b"
              style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper)' }}>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="w-[58px] h-[58px] rounded-[10px] shrink-0 object-cover"
                />
              ) : (
                <div
                  className="w-[58px] h-[58px] rounded-[10px] shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--color-cream-2), var(--color-line))' }}
                  aria-hidden="true"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14.5px]">{item.productName}</div>
                <div className="text-[12.5px] mt-[2px]" style={{ color: 'var(--color-ink-soft)' }}>Cant. {item.quantity}</div>
              </div>
              <span className="font-bold text-[14px] shrink-0">{formatPrice(item.subtotalCents)}</span>
            </div>
          ))}

          {/* Totals */}
          <div className="px-6 py-4" style={{ background: 'var(--color-paper)' }}>
            {order.shippingCents > 0 && (
              <div className="flex justify-between text-[14px] py-1" style={{ color: 'var(--color-ink-soft)' }}>
                <span>Envío</span><span>{formatPrice(order.shippingCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[18px] pt-2 mt-1 border-t" style={{ borderColor: 'var(--color-line)' }}>
              <span>Total</span><span>{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* CTA */}
      <div className="flex flex-col gap-3 items-center">
        <Link
          to="/account"
          className="inline-flex items-center justify-center font-semibold text-[15px] px-[34px] py-[15px] rounded-full transition-colors w-full max-w-[320px]"
          style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
        >
          Ver mis pedidos
        </Link>
        <Link
          to="/catalog"
          className="text-[14px] font-semibold border-b pb-[1px] transition-colors hover:text-[var(--color-terra)]"
          style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-soft)' }}
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}

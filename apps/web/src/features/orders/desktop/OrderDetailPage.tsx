import { Link, useParams } from 'react-router-dom'
import { formatPrice } from '../../../shared/lib/format-price'
import { formatDate } from '../../../shared/lib/format-date'
import { Spinner } from '../../../shared/ui/Spinner'
import { ErrorMessage } from '../../../shared/ui/ErrorMessage'
import { useOrderDetailController } from '../controllers/useOrderDetailController'
import type { OrderDetail, OrderStatus } from '../../../shared/api/dto.types'

/* ---- Helpers ---- */
const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PROCESSING: 'En preparación',
  SHIPPED: 'En camino', DELIVERED: 'Entregado', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
}

const TIMELINE_STEPS = [
  'Pedido confirmado',
  'En preparación',
  'En tránsito',
  'En reparto',
  'Entregado',
]

const STATUS_TO_STEP: Record<OrderStatus, number> = {
  PENDING: -1, CONFIRMED: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 4,
  CANCELLED: -1, REFUNDED: -1,
}

function statusBadgeStyle(s: OrderStatus) {
  if (s === 'DELIVERED') return { background: 'color-mix(in srgb, var(--color-ok) 16%, white)',   color: 'var(--color-ok)' }
  if (s === 'CANCELLED' || s === 'REFUNDED') return { background: 'color-mix(in srgb, var(--color-terra) 16%, white)', color: 'var(--color-terra)' }
  return { background: 'color-mix(in srgb, var(--color-warn) 16%, white)', color: 'var(--color-warn)' }
}

/* ---- Timeline ---- */
function Timeline({ status }: { status: OrderStatus }) {
  const currentStep = STATUS_TO_STEP[status]
  return (
    <div className="rounded-[20px] overflow-hidden mb-5" style={{ border: '1px solid var(--color-line)' }}>
      <div className="flex justify-between items-center px-[22px] py-4 border-b font-semibold text-[15.5px]" style={{ borderColor: 'var(--color-line)' }}>
        Seguimiento del pedido
        <span className="text-[11.5px] font-bold tracking-[.04em] uppercase px-[10px] py-[5px] rounded-[6px]" style={statusBadgeStyle(status)}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      <div className="p-[22px] flex flex-col gap-[18px]">
        {TIMELINE_STEPS.map((title, i) => {
          const state = i < currentStep ? 'done' : i === currentStep ? 'now' : 'pending'
          return (
            <div key={title} className="flex gap-[14px] items-start">
              <div className="flex flex-col items-center shrink-0 mt-[3px]">
                <span
                  className="w-[14px] h-[14px] rounded-full border-2"
                  style={
                    state === 'done' ? { background: 'var(--color-terra)', borderColor: 'var(--color-terra)' }
                    : state === 'now' ? { background: 'var(--color-cream)', borderColor: 'var(--color-terra)', boxShadow: '0 0 0 4px var(--color-terra-soft)' }
                    : { background: 'var(--color-cream-2)', borderColor: 'var(--color-line-2)' }
                  }
                />
                {i < TIMELINE_STEPS.length - 1 && (
                  <span className="w-[2px] h-[28px] mt-[4px] rounded-full" style={{ background: i < currentStep ? 'var(--color-terra)' : 'var(--color-line-2)' }} />
                )}
              </div>
              <div>
                <div className="font-semibold text-[14.5px]" style={{ color: state === 'pending' ? 'var(--color-ink-soft)' : 'var(--color-ink)' }}>
                  {title}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---- Order items ---- */
function ItemsList({ order }: { order: OrderDetail }) {
  return (
    <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid var(--color-line)' }}>
      <div className="px-[22px] py-4 border-b font-semibold text-[15.5px]" style={{ borderColor: 'var(--color-line)' }}>
        Artículos del pedido
      </div>
      {order.items.map(item => (
        <div key={item.productId} className="flex gap-4 items-center px-[22px] py-4 border-b last:border-0" style={{ borderColor: 'var(--color-line)' }}>
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.productName}
              className="w-[60px] h-[60px] rounded-[10px] shrink-0 object-cover"
            />
          ) : (
            <div
              className="w-[60px] h-[60px] rounded-[10px] shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-cream-2), var(--color-line))' }}
              aria-hidden="true"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[14px] leading-tight">{item.productName}</div>
            <div className="text-[12.5px] mt-[3px]" style={{ color: 'var(--color-ink-soft)' }}>
              Cant. {item.quantity}
            </div>
          </div>
          <span className="font-bold text-[14px] shrink-0">{formatPrice(item.subtotalCents)}</span>
        </div>
      ))}
    </div>
  )
}

/* ---- Sidebar ---- */
function OrderSidebar({ order }: { order: OrderDetail }) {
  return (
    <aside className="flex flex-col gap-4">
      {/* Totals */}
      <div className="rounded-[20px] p-[22px]" style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}>
        <h2 className="h3 mb-4">Resumen</h2>
        {[
          { label: 'Subtotal', value: formatPrice(order.subtotalCents) },
          { label: 'Envío', value: order.shippingCents === 0 ? 'Gratis' : formatPrice(order.shippingCents) },
          ...(order.taxCents > 0 ? [{ label: 'Impuestos', value: formatPrice(order.taxCents) }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-[7px] text-[14.5px]">
            <span style={{ color: 'var(--color-ink-soft)' }}>{label}</span>
            <span>{value}</span>
          </div>
        ))}
        <hr className="my-[10px]" style={{ border: 0, borderTop: '1px solid var(--color-line)' }} />
        <div className="flex justify-between font-bold text-[20px]">
          <span>Total</span>
          <span>{formatPrice(order.totalCents)}</span>
        </div>
      </div>

      {/* Shipping address */}
      <div className="rounded-[20px] p-[22px]" style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}>
        <h3 className="font-semibold text-[15px] mb-3">Dirección de envío</h3>
        <p className="text-[13.5px] leading-[1.65]" style={{ color: 'var(--color-ink-2)' }}>
          {order.shippingStreet}<br />
          {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}<br />
          {order.shippingCountry}
        </p>
      </div>

      {/* Support */}
      <div className="rounded-[20px] p-[22px]" style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}>
        <h3 className="font-semibold text-[15px] mb-2">¿Necesitás ayuda?</h3>
        <p className="text-[13px]" style={{ color: 'var(--color-ink-soft)' }}>
          Escribinos a{' '}
          <a href="mailto:hola@casa.com" className="underline" style={{ color: 'var(--color-terra)' }}>
            hola@casa.com
          </a>{' '}
          o chatéanos.
        </p>
      </div>
    </aside>
  )
}

/* ---- Página ---- */
export function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { order, loading, error } = useOrderDetailController(id)

  if (loading) {
    return (
      <div className="wrap-wide flex justify-center py-[80px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="wrap-wide py-[80px]">
        <ErrorMessage message={error || 'Pedido no encontrado.'} />
      </div>
    )
  }

  return (
    <div className="wrap-wide">
      <div className="pt-[22px]">
        <Link
          to="/account"
          className="inline-flex items-center gap-2 font-medium text-[14px] transition-colors hover:text-[var(--color-ink)]"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          ← Volver a mis pedidos
        </Link>
      </div>

      <div className="flex justify-between items-end flex-wrap gap-4 mt-[10px] mb-6">
        <div>
          <span className="eyebrow">Pedido</span>
          <h1 className="h1 mt-2">{id}</h1>
          <div className="flex gap-7 mt-[14px] text-[13.5px]">
            {[
              ['Fecha', formatDate(order.createdAt)],
              ['Total', formatPrice(order.totalCents)],
            ].map(([l, v]) => (
              <div key={l}>
                <span style={{ color: 'var(--color-ink-soft)' }}>{l}</span>
                <strong className="block text-[15px]" style={{ color: 'var(--color-ink)' }}>{v}</strong>
              </div>
            ))}
          </div>
        </div>
        <button
          className="font-semibold text-[13px] px-4 py-2 rounded-full border transition-colors hover:border-[var(--color-ink)]"
          style={{ borderColor: 'var(--color-line-2)' }}
        >
          Descargar factura
        </button>
      </div>

      <div className="grid gap-[40px] items-start pb-[90px] max-md:grid-cols-1" style={{ gridTemplateColumns: '1fr 360px' }}>
        <div>
          <Timeline status={order.status} />
          <ItemsList order={order} />
        </div>
        <OrderSidebar order={order} />
      </div>
    </div>
  )
}

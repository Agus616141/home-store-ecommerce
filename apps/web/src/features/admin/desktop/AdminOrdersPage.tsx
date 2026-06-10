import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi } from '../../../shared/api/endpoints'
import { formatPrice } from '../../../shared/lib/format-price'
import { Spinner } from '../../../shared/ui/Spinner'
import type { OrderSummary, OrderStatus, PaymentStatus } from '../../../shared/api/dto.types'

const PAGE_SIZE = 15

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:    'Pendiente',
  CONFIRMED:  'Confirmado',
  PROCESSING: 'Procesando',
  SHIPPED:    'Enviado',
  DELIVERED:  'Entregado',
  CANCELLED:  'Cancelado',
  REFUNDED:   'Reembolsado',
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PENDING:  'Pendiente',
  PAID:     'Pagado',
  FAILED:   'Fallido',
  REFUNDED: 'Reembolsado',
}

function statusStyle(status: OrderStatus): React.CSSProperties {
  switch (status) {
    case 'DELIVERED':  return { background: 'color-mix(in srgb, var(--color-ok) 15%, white)', color: 'var(--color-ok)' }
    case 'SHIPPED':    return { background: 'color-mix(in srgb, #5e7a9e 15%, white)', color: '#3a5c80' }
    case 'PROCESSING': return { background: 'color-mix(in srgb, var(--color-warn) 18%, white)', color: 'var(--color-warn)' }
    case 'CANCELLED':  return { background: 'color-mix(in srgb, var(--color-terra) 14%, white)', color: 'var(--color-terra)' }
    default:           return { background: 'var(--color-cream-2)', color: 'var(--color-ink-soft)' }
  }
}

function paymentStyle(status: PaymentStatus): React.CSSProperties {
  switch (status) {
    case 'PAID':      return { color: 'var(--color-ok)' }
    case 'FAILED':    return { color: 'var(--color-terra)' }
    case 'REFUNDED':  return { color: 'var(--color-warn)' }
    default:          return { color: 'var(--color-ink-soft)' }
  }
}

export function AdminOrdersPage() {
  const [orders, setOrders]   = useState<OrderSummary[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = useCallback(() => {
    setLoading(true)
    ordersApi.list(page, PAGE_SIZE)
      .then(res => { setOrders(res.orders); setTotal(res.total) })
      .catch(e => setError(e.message ?? 'Error al cargar pedidos'))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(Math.max(total, 1) / PAGE_SIZE)

  return (
    <div style={{ padding: '28px 32px 60px' }}>
      <div className="flex justify-between items-start mb-[22px]">
        <div>
          <span className="eyebrow muted">Ventas</span>
          <h1 className="h2 mt-[6px]">Pedidos <span className="text-[18px] font-sans font-normal" style={{ color: 'var(--color-ink-soft)' }}>({total})</span></h1>
        </div>
      </div>

      <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid var(--color-line)' }}>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="p-8 text-center" style={{ color: 'var(--color-terra)' }}>{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--color-ink-soft)' }}>No hay pedidos todavía.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'var(--color-cream-2)' }}>
                    {['Pedido', 'Artículos', 'Total', 'Estado', 'Pago', 'Fecha', ''].map(h => (
                      <th key={h} className="text-left text-[11.5px] tracking-[.06em] uppercase font-bold px-[20px] py-[14px] border-b whitespace-nowrap" style={{ color: 'var(--color-ink-soft)', borderColor: 'var(--color-line)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-[var(--color-cream-2)] transition-colors" style={{ background: 'var(--color-paper)' }}>
                      <td className="px-[20px] py-[13px] border-b mono font-semibold text-[13px]" style={{ borderColor: 'var(--color-line)' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-[20px] py-[13px] border-b text-[14px]" style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-2)' }}>
                        {order.itemCount} artículo{order.itemCount !== 1 ? 's' : ''}
                      </td>
                      <td className="px-[20px] py-[13px] border-b font-bold text-[14px] whitespace-nowrap" style={{ borderColor: 'var(--color-line)' }}>
                        {formatPrice(order.totalCents)}
                      </td>
                      <td className="px-[20px] py-[13px] border-b" style={{ borderColor: 'var(--color-line)' }}>
                        <span
                          className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold px-[9px] py-[3px] rounded-[20px] whitespace-nowrap"
                          style={statusStyle(order.status)}
                        >
                          <span className="w-[5px] h-[5px] rounded-full bg-current" aria-hidden="true" />
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-[20px] py-[13px] border-b text-[13px] font-semibold whitespace-nowrap" style={{ borderColor: 'var(--color-line)', ...paymentStyle(order.paymentStatus) }}>
                        {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
                      </td>
                      <td className="px-[20px] py-[13px] border-b mono text-[12px]" style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-soft)' }}>
                        {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-[20px] py-[13px] border-b" style={{ borderColor: 'var(--color-line)' }}>
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-[12.5px] font-semibold transition-colors hover:opacity-80"
                          style={{ color: 'var(--color-terra)' }}
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="flex justify-between items-center px-[20px] py-4 text-[13px]"
              style={{ borderTop: '1px solid var(--color-line)', color: 'var(--color-ink-soft)' }}
            >
              <span>Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} de {total} pedidos</span>
              <div className="flex gap-[6px]">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="min-w-8 h-8 grid place-items-center rounded-[7px] border font-semibold text-[13px] transition-colors hover:border-[var(--color-ink)] disabled:opacity-30"
                  style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
                >‹</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className="min-w-8 h-8 grid place-items-center rounded-[7px] border font-semibold text-[13px] transition-colors hover:border-[var(--color-ink)]"
                    style={n === page
                      ? { background: 'var(--color-ink)', color: 'var(--color-cream)', borderColor: 'var(--color-ink)' }
                      : { borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }
                    }
                  >{n}</button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="min-w-8 h-8 grid place-items-center rounded-[7px] border font-semibold text-[13px] transition-colors hover:border-[var(--color-ink)] disabled:opacity-30"
                  style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
                >›</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

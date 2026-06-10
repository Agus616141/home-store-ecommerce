import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsApi, ordersApi } from '../../../shared/api/endpoints'
import { formatPrice } from '../../../shared/lib/format-price'
import { Spinner } from '../../../shared/ui/Spinner'
import type { ProductSummary, OrderSummary } from '../../../shared/api/dto.types'

/* ---- KPI card ---- */
function KpiCard({ label, value, sub, up, icon, loading }: {
  label: string
  value: string | number
  sub: string
  up?: boolean
  icon: React.ReactNode
  loading?: boolean
}) {
  return (
    <div className="rounded-[20px] p-5" style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line)' }}>
      <div className="flex justify-between items-center mb-[14px]">
        <span className="w-[38px] h-[38px] rounded-[10px] grid place-items-center" style={{ background: 'var(--color-cream-2)', color: 'var(--color-terra)' }}>
          {icon}
        </span>
        {up !== undefined && (
          <span
            className="text-[12px] font-bold px-2 py-[3px] rounded-[20px]"
            style={up
              ? { background: 'color-mix(in srgb, var(--color-ok) 16%, white)', color: 'var(--color-ok)' }
              : { background: 'color-mix(in srgb, var(--color-terra) 14%, white)', color: 'var(--color-terra)' }
            }
          >
            {up ? '↑' : '↓'}
          </span>
        )}
      </div>
      {loading
        ? <div className="h-[34px] flex items-center"><Spinner size="sm" /></div>
        : <div className="font-serif font-semibold text-[34px] leading-none">{value}</div>
      }
      <div className="text-[12px] mt-1" style={{ color: 'var(--color-ink-soft)' }}>{label}</div>
      <div className="text-[11px] mt-[6px]" style={{ color: 'var(--color-ink-soft)' }}>{sub}</div>
    </div>
  )
}

/* ---- Página ---- */
export function AdminPage() {
  const [products, setProducts]       = useState<ProductSummary[]>([])
  const [orders, setOrders]           = useState<OrderSummary[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalOrders, setTotalOrders]     = useState(0)
  const [loadingP, setLoadingP]       = useState(true)
  const [loadingO, setLoadingO]       = useState(true)

  useEffect(() => {
    productsApi.list({ limit: 20, sort: 'newest' })
      .then(res => { setProducts(res.products); setTotalProducts(res.total) })
      .finally(() => setLoadingP(false))
  }, [])

  useEffect(() => {
    ordersApi.list(1, 5)
      .then(res => { setOrders(res.orders); setTotalOrders(res.total) })
      .finally(() => setLoadingO(false))
  }, [])

  const lowStockCount = products.filter(p => p.stock <= 5).length
  const lowStock      = products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 5)

  return (
    <div style={{ padding: '28px 32px 60px' }}>
      <div className="flex justify-between items-start mb-[22px]">
        <div>
          <span className="eyebrow muted">Resumen</span>
          <h1 className="h2 mt-[6px]">Dashboard</h1>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 text-[14px] font-semibold px-5 py-[11px] rounded-full text-white transition-colors"
          style={{ background: 'var(--color-terra)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-terra-dark)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-terra)')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          Nuevo producto
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-[18px] mb-[26px] max-md:grid-cols-2">
        <KpiCard
          label="Productos totales"
          value={totalProducts}
          sub="En el catálogo"
          loading={loadingP}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>}
        />
        <KpiCard
          label="Pedidos totales"
          value={totalOrders}
          sub="Registrados"
          loading={loadingO}
          up={totalOrders > 0}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 2h9l4 4v16H6z"/><path d="M9 11h7M9 15h7"/></svg>}
        />
        <KpiCard
          label="Stock bajo"
          value={lowStockCount}
          sub="Menos de 5 unidades"
          loading={loadingP}
          up={lowStockCount === 0}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>}
        />
        <KpiCard
          label="Productos activos"
          value={products.filter(p => p.isActive).length}
          sub="Visibles en la tienda"
          loading={loadingP}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>}
        />
      </div>

      {/* Main content */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1.6fr 1fr' }}>

        {/* Recent products */}
        <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid var(--color-line)' }}>
          <div className="flex justify-between items-center px-[22px] py-[18px] border-b" style={{ borderColor: 'var(--color-line)' }}>
            <h3 className="font-serif font-semibold text-[22px]">Productos recientes</h3>
            <Link to="/admin/products" className="text-[13.5px] font-medium transition-colors hover:opacity-80" style={{ color: 'var(--color-terra)' }}>
              Ver todos →
            </Link>
          </div>
          <div style={{ background: 'var(--color-paper)' }}>
            {loadingP ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : products.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-[22px] py-[13px] border-b last:border-b-0 hover:bg-[var(--color-cream-2)] transition-colors" style={{ borderColor: 'var(--color-line)' }}>
                <div className="w-10 h-10 rounded-[9px] shrink-0 overflow-hidden" style={{ background: 'var(--color-cream-2)' }}>
                  {p.images[0] ? (
                    <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full" style={{ background: 'var(--color-line)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] truncate">{p.name}</div>
                  <div className="mono text-[12px]" style={{ color: 'var(--color-ink-soft)' }}>
                    {p.categories[0]?.category.name ?? 'Sin categoría'} · {p.stock} u.
                  </div>
                </div>
                <strong className="text-[14px] shrink-0">{formatPrice(p.priceCents)}</strong>
                <span
                  className="text-[11.5px] font-semibold px-[8px] py-[3px] rounded-[20px] shrink-0"
                  style={p.isActive
                    ? { background: 'color-mix(in srgb, var(--color-ok) 15%, white)', color: 'var(--color-ok)' }
                    : { background: 'var(--color-cream-2)', color: 'var(--color-ink-soft)' }
                  }
                >
                  {p.isActive ? 'Activo' : 'Borrador'}
                </span>
                <Link
                  to={`/admin/products/${p.slug}/edit`}
                  className="w-8 h-8 rounded-[8px] grid place-items-center border transition-colors hover:border-[var(--color-ink)] shrink-0"
                  style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-soft)' }}
                  aria-label="Editar"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: recent orders + low stock */}
        <div className="flex flex-col gap-5">

          {/* Recent orders */}
          <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid var(--color-line)' }}>
            <div className="flex justify-between items-center px-[22px] py-[18px] border-b" style={{ borderColor: 'var(--color-line)' }}>
              <h3 className="font-serif font-semibold text-[20px]">Pedidos recientes</h3>
              <Link to="/admin/orders" className="text-[13px] font-medium" style={{ color: 'var(--color-terra)' }}>Ver todos →</Link>
            </div>
            <div style={{ background: 'var(--color-paper)' }}>
              {loadingO ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : orders.length === 0 ? (
                <div className="px-[22px] py-6 text-[13px]" style={{ color: 'var(--color-ink-soft)' }}>Sin pedidos aún.</div>
              ) : orders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-[22px] py-[12px] border-b last:border-b-0" style={{ borderColor: 'var(--color-line)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px] mono">#{order.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-[11.5px]" style={{ color: 'var(--color-ink-soft)' }}>{order.itemCount} art. · {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</div>
                  </div>
                  <strong className="text-[13px]">{formatPrice(order.totalCents)}</strong>
                  <span
                    className="text-[11px] font-semibold px-[8px] py-[3px] rounded-[20px] shrink-0"
                    style={order.paymentStatus === 'PAID'
                      ? { background: 'color-mix(in srgb, var(--color-ok) 15%, white)', color: 'var(--color-ok)' }
                      : { background: 'color-mix(in srgb, var(--color-warn) 16%, white)', color: 'var(--color-warn)' }
                    }
                  >
                    {order.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock */}
          <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid var(--color-line)' }}>
            <div className="flex justify-between items-center px-[22px] py-[18px] border-b" style={{ borderColor: 'var(--color-line)' }}>
              <h3 className="font-serif font-semibold text-[20px]">Stock bajo</h3>
              <Link to="/admin/inventory" className="text-[13px] font-medium" style={{ color: 'var(--color-terra)' }}>Ver todos →</Link>
            </div>
            <div style={{ background: 'var(--color-paper)' }}>
              {loadingP ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : lowStock.length === 0 ? (
                <div className="px-[22px] py-6 text-[13px]" style={{ color: 'var(--color-ok)' }}>✓ Todo el stock está en orden.</div>
              ) : lowStock.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-[22px] py-[12px] border-b last:border-b-0" style={{ borderColor: 'var(--color-line)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px] truncate">{p.name}</div>
                    <div className="mono text-[11.5px]" style={{ color: 'var(--color-ink-soft)' }}>{p.sku ?? p.slug}</div>
                  </div>
                  <span className="text-[13px] font-bold shrink-0" style={{ color: p.stock === 0 ? 'var(--color-terra)' : 'var(--color-warn)' }}>
                    {p.stock} u.{p.stock === 0 ? ' ✕' : ' ⚠'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

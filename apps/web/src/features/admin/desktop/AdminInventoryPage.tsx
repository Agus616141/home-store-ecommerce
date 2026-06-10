import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productsApi } from '../../../shared/api/endpoints'
import { Spinner } from '../../../shared/ui/Spinner'
import type { ProductSummary } from '../../../shared/api/dto.types'

const LOW_STOCK_THRESHOLD = 10

export function AdminInventoryPage() {
  const navigate = useNavigate()
  const [products, setProducts]   = useState<ProductSummary[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    setLoading(true)
    productsApi.list({ limit: 100, sort: 'newest' })
      .then(res => {
        setProducts(res.products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock))
      })
      .catch(e => setError(e.message ?? 'Error'))
      .finally(() => setLoading(false))
  }, [])

  const critical = products.filter(p => p.stock === 0)
  const low      = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)

  return (
    <div style={{ padding: '28px 32px 60px' }}>
      <div className="mb-[22px]">
        <span className="eyebrow muted">Catálogo</span>
        <h1 className="h2 mt-[6px]">Inventario — Stock bajo</h1>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--color-ink-soft)' }}>
          Productos con {LOW_STOCK_THRESHOLD} unidades o menos.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="text-center py-8" style={{ color: 'var(--color-terra)' }}>{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 rounded-[20px]" style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}>
          <div className="text-[40px] mb-3">✓</div>
          <h3 className="font-semibold text-[18px]">Todo el stock está en orden</h3>
          <p className="mt-2" style={{ color: 'var(--color-ink-soft)' }}>Ningún producto por debajo de {LOW_STOCK_THRESHOLD} unidades.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {critical.length > 0 && (
            <StockGroup
              title={`Sin stock (${critical.length})`}
              color="var(--color-terra)"
              products={critical}
              onEdit={slug => navigate(`/admin/products/${slug}/edit`)}
            />
          )}
          {low.length > 0 && (
            <StockGroup
              title={`Stock bajo (${low.length})`}
              color="var(--color-warn)"
              products={low}
              onEdit={slug => navigate(`/admin/products/${slug}/edit`)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function StockGroup({ title, color, products, onEdit }: {
  title: string
  color: string
  products: ProductSummary[]
  onEdit: (slug: string) => void
}) {
  return (
    <div className="rounded-[20px] overflow-hidden" style={{ border: `1px solid ${color}30` }}>
      <div className="px-[22px] py-[16px] border-b" style={{ borderColor: `${color}30`, background: `color-mix(in srgb, ${color} 8%, white)` }}>
        <h3 className="font-semibold text-[16px]" style={{ color }}>{title}</h3>
      </div>
      <div style={{ background: 'var(--color-paper)' }}>
        {products.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-4 px-[22px] py-[14px]"
            style={{ borderTop: i > 0 ? '1px solid var(--color-line)' : undefined }}
          >
            <div className="w-10 h-10 rounded-[9px] shrink-0 overflow-hidden" style={{ background: 'var(--color-cream-2)' }}>
              {p.images[0] ? (
                <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px] truncate">{p.name}</div>
              <div className="mono text-[12px]" style={{ color: 'var(--color-ink-soft)' }}>{p.sku ?? p.slug}</div>
            </div>
            <span
              className="font-bold text-[18px] shrink-0"
              style={{ color, minWidth: 40, textAlign: 'right' }}
            >
              {p.stock}
            </span>
            <span className="text-[12px] shrink-0" style={{ color: 'var(--color-ink-soft)', minWidth: 24 }}>u.</span>
            <button
              onClick={() => onEdit(p.slug)}
              className="shrink-0 text-[13px] font-semibold px-3 py-2 rounded-[8px] border transition-colors hover:border-[var(--color-ink)]"
              style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
            >
              Editar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

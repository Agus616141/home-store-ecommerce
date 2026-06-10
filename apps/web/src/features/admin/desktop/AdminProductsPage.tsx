import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productsApi } from '../../../shared/api/endpoints'
import { formatPrice } from '../../../shared/lib/format-price'
import { Spinner } from '../../../shared/ui/Spinner'
import type { ProductSummary } from '../../../shared/api/dto.types'

const PAGE_SIZE = 12

export function AdminProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts]   = useState<ProductSummary[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [searchInput, setSearchInput] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    productsApi.list({ page, limit: PAGE_SIZE, q: search || undefined })
      .then(res => { setProducts(res.products); setTotal(res.total) })
      .catch(e => setError(e.message ?? 'Error al cargar productos'))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  async function handleDelete(product: ProductSummary) {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(product.id)
    try {
      await productsApi.remove(product.id)
      load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al eliminar el producto')
    } finally {
      setDeletingId(null)
    }
  }

  const totalPages = Math.ceil(Math.max(total, 1) / PAGE_SIZE)

  return (
    <div style={{ padding: '28px 32px 60px' }}>
      <div className="flex justify-between items-start mb-[22px]">
        <div>
          <span className="eyebrow muted">Catálogo</span>
          <h1 className="h2 mt-[6px]">Productos <span className="text-[18px] font-sans font-normal" style={{ color: 'var(--color-ink-soft)' }}>({total})</span></h1>
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

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-5 max-w-[420px]">
        <div className="relative flex-1">
          <svg className="absolute left-[12px] top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--color-ink-soft)' }} aria-hidden="true">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full rounded-full text-[14px] font-sans outline-none pl-[36px] pr-3 py-[9px]"
            style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line-2)' }}
          />
        </div>
        <button
          type="submit"
          className="px-5 py-[9px] rounded-full text-[14px] font-semibold transition-colors"
          style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
        >
          Buscar
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
            className="px-4 py-[9px] rounded-full text-[14px] font-medium border transition-colors"
            style={{ borderColor: 'var(--color-line-2)' }}
          >
            ✕ Limpiar
          </button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid var(--color-line)' }}>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="p-8 text-center" style={{ color: 'var(--color-terra)' }}>{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: 'var(--color-cream-2)' }}>
                    {['Producto', 'SKU', 'Categorías', 'Color / Mat.', 'Precio', 'Stock', 'Estado', ''].map(h => (
                      <th key={h} className="text-left text-[11.5px] tracking-[.06em] uppercase font-bold px-[20px] py-[14px] border-b whitespace-nowrap" style={{ color: 'var(--color-ink-soft)', borderColor: 'var(--color-line)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr
                      key={p.id}
                      className="hover:bg-[var(--color-cream-2)] transition-colors"
                      style={{ background: 'var(--color-paper)' }}
                    >
                      {/* Producto */}
                      <td className="px-[20px] py-[13px] border-b" style={{ borderColor: 'var(--color-line)', minWidth: 220 }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-[9px] shrink-0 overflow-hidden"
                            style={{ background: 'var(--color-cream-2)' }}
                          >
                            {p.images[0] ? (
                              <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full" style={{ background: 'var(--color-line)' }} />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[14px] leading-tight max-w-[200px] truncate">{p.name}</div>
                            <div className="text-[11.5px] mt-[2px] mono" style={{ color: 'var(--color-ink-soft)' }}>{p.slug}</div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-[20px] py-[13px] border-b mono text-[13px] whitespace-nowrap" style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-soft)' }}>
                        {p.sku ?? '—'}
                      </td>

                      {/* Categorías */}
                      <td className="px-[20px] py-[13px] border-b" style={{ borderColor: 'var(--color-line)', maxWidth: 180 }}>
                        <div className="flex flex-wrap gap-1">
                          {p.categories.slice(0, 3).map(c => (
                            <span
                              key={c.category.slug}
                              className="text-[11px] font-medium px-[8px] py-[3px] rounded-full"
                              style={{ background: 'var(--color-cream-2)', color: 'var(--color-ink-2)' }}
                            >
                              {c.category.name}
                            </span>
                          ))}
                          {p.categories.length > 3 && (
                            <span className="text-[11px]" style={{ color: 'var(--color-ink-soft)' }}>+{p.categories.length - 3}</span>
                          )}
                        </div>
                      </td>

                      {/* Color / Material */}
                      <td className="px-[20px] py-[13px] border-b text-[13px]" style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-2)' }}>
                        <div>{p.color ?? '—'}</div>
                        <div style={{ color: 'var(--color-ink-soft)' }}>{p.material ?? ''}</div>
                      </td>

                      {/* Precio */}
                      <td className="px-[20px] py-[13px] border-b font-bold text-[14px] whitespace-nowrap" style={{ borderColor: 'var(--color-line)' }}>
                        {formatPrice(p.priceCents)}
                      </td>

                      {/* Stock */}
                      <td className="px-[20px] py-[13px] border-b text-[13px] font-semibold whitespace-nowrap" style={{
                        borderColor: 'var(--color-line)',
                        color: p.stock <= 5 ? 'var(--color-terra)' : undefined,
                      }}>
                        {p.stock} u.{p.stock <= 5 ? ' ⚠' : ''}
                      </td>

                      {/* Estado */}
                      <td className="px-[20px] py-[13px] border-b whitespace-nowrap" style={{ borderColor: 'var(--color-line)' }}>
                        <div className="flex flex-col gap-1">
                          <span
                            className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold px-[9px] py-[3px] rounded-[20px] w-fit"
                            style={p.isActive
                              ? { background: 'color-mix(in srgb, var(--color-ok) 15%, white)', color: 'var(--color-ok)' }
                              : { background: 'var(--color-cream-2)', color: 'var(--color-ink-soft)' }
                            }
                          >
                            <span className="w-[5px] h-[5px] rounded-full bg-current" aria-hidden="true" />
                            {p.isActive ? 'Activo' : 'Borrador'}
                          </span>
                          {p.isFeatured && (
                            <span className="text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px] w-fit" style={{ background: 'color-mix(in srgb, var(--color-gold) 20%, white)', color: '#8B6914' }}>
                              ★ Destacado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-[20px] py-[13px] border-b" style={{ borderColor: 'var(--color-line)' }}>
                        <div className="flex gap-[6px]">
                          <button
                            onClick={() => navigate(`/admin/products/${p.slug}/edit`)}
                            className="w-8 h-8 rounded-[8px] grid place-items-center border transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                            style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-soft)', background: 'var(--color-paper)' }}
                            aria-label="Editar"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                              <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={deletingId === p.id}
                            className="w-8 h-8 rounded-[8px] grid place-items-center border transition-colors hover:border-[var(--color-terra)] hover:text-[var(--color-terra)] disabled:opacity-40"
                            style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-soft)', background: 'var(--color-paper)' }}
                            aria-label="Eliminar"
                          >
                            {deletingId === p.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div
              className="flex justify-between items-center px-[20px] py-4 text-[13px]"
              style={{ borderTop: '1px solid var(--color-line)', color: 'var(--color-ink-soft)' }}
            >
              <span>Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} de {total} productos</span>
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

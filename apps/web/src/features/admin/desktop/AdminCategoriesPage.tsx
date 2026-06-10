import { useState, useEffect, useRef } from 'react'
import { categoriesApi } from '../../../shared/api/endpoints'
import { Spinner } from '../../../shared/ui/Spinner'
import { Input } from '../../../shared/ui/Input'
import type { CategorySummary } from '../../../shared/api/dto.types'
import {
  useCatalogsStore,
  CATALOG_KEYS,
  CATALOG_META,
  type CatalogKey,
} from '../../../shared/stores/catalogs.store'

/* ── Slugify ─────────────────────────────────────────────────────────────── */
function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/* ── Catalog Tab ─────────────────────────────────────────────────────────── */
function CatalogTab({
  label,
  active,
  onClick,
  count,
}: {
  label: string
  active: boolean
  onClick: () => void
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-[11px] text-[14.5px] font-semibold rounded-t-[12px] transition-colors border-b-2"
      style={
        active
          ? { color: 'var(--color-ink)', borderBottomColor: 'var(--color-terra)', background: 'var(--color-paper)' }
          : { color: 'var(--color-ink-soft)', borderBottomColor: 'transparent', background: 'var(--color-cream-2)' }
      }
    >
      {label}
      <span
        className="text-[11px] font-bold px-[7px] py-[2px] rounded-full"
        style={
          active
            ? { background: 'var(--color-terra)', color: 'white' }
            : { background: 'var(--color-line-2)', color: 'var(--color-ink-soft)' }
        }
      >
        {count}
      </span>
    </button>
  )
}

/* ── Category chip in the catalog panel ─────────────────────────────────── */
function CatalogChip({
  category,
  onRemoveFromCatalog,
  onDelete,
  deleting,
}: {
  category: CategorySummary
  onRemoveFromCatalog: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (confirmDelete) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-[7px] rounded-[10px] text-[13px]"
        style={{ background: 'color-mix(in srgb, var(--color-terra) 12%, white)', border: '1px solid var(--color-terra)' }}
      >
        <span style={{ color: 'var(--color-terra)' }}>¿Eliminar <strong>{category.name}</strong>?</span>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="font-bold text-[12px] px-2 py-1 rounded-[6px] transition-colors"
          style={{ background: 'var(--color-terra)', color: 'white' }}
        >
          {deleting ? '…' : 'Sí, eliminar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(false)}
          className="font-medium text-[12px] px-2 py-1 rounded-[6px] border transition-colors"
          style={{ borderColor: 'var(--color-terra)', color: 'var(--color-terra)' }}
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div
      className="group flex items-center gap-1 pl-[12px] pr-[6px] py-[7px] rounded-[10px] text-[13.5px] font-medium"
      style={{ background: 'var(--color-cream-2)', border: '1px solid var(--color-line)' }}
    >
      <span style={{ color: 'var(--color-ink)' }}>{category.name}</span>
      <span className="mono text-[11px] ml-1" style={{ color: 'var(--color-ink-soft)' }}>/{category.slug}</span>

      {/* Remove from catalog (keeps in DB) */}
      <button
        type="button"
        onClick={onRemoveFromCatalog}
        title="Quitar de este catálogo (no elimina la categoría)"
        className="ml-1 w-[22px] h-[22px] rounded-full grid place-items-center transition-colors hover:bg-[var(--color-line-2)]"
        style={{ color: 'var(--color-ink-soft)' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M1 1l8 8M9 1L1 9" />
        </svg>
      </button>

      {/* Delete from DB */}
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        title="Eliminar categoría de la base de datos"
        className="w-[22px] h-[22px] rounded-full grid place-items-center transition-colors hover:bg-red-100"
        style={{ color: 'var(--color-terra)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  )
}

/* ── Add-to-catalog dropdown ─────────────────────────────────────────────── */
function AddToCatalogDropdown({
  available,
  onAdd,
}: {
  available: CategorySummary[]
  onAdd: (cat: CategorySummary) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const filtered = available.filter(
    c => c.name.toLowerCase().includes(q.toLowerCase()) || c.slug.includes(q.toLowerCase()),
  )

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-[9px] rounded-[10px] text-[13.5px] font-semibold border-dashed border transition-colors hover:border-[var(--color-ink)]"
        style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-soft)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Agregar al catálogo
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-[280px] z-20 rounded-[12px] overflow-hidden shadow-lg"
          style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line)' }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
            <input
              autoFocus
              placeholder="Buscar categoría…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-[8px] outline-none font-sans"
              style={{ background: 'var(--color-cream-2)', border: '1px solid var(--color-line-2)' }}
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center py-4 text-[13px]" style={{ color: 'var(--color-ink-soft)' }}>
                Sin coincidencias
              </p>
            ) : (
              filtered.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { onAdd(cat); setOpen(false); setQ('') }}
                  className="w-full text-left px-4 py-[10px] text-[13.5px] hover:bg-[var(--color-cream-2)] transition-colors"
                  style={{ color: 'var(--color-ink)' }}
                >
                  <span className="font-medium">{cat.name}</span>
                  <span className="mono text-[11px] ml-2" style={{ color: 'var(--color-ink-soft)' }}>/{cat.slug}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── New Category Form ───────────────────────────────────────────────────── */
function NewCategoryForm({
  defaultCatalog,
  onCreated,
}: {
  defaultCatalog: CatalogKey
  onCreated: (cat: CategorySummary, catalog: CatalogKey) => void
}) {
  const [name, setName]       = useState('')
  const [slug, setSlug]       = useState('')
  const [catalog, setCatalog] = useState<CatalogKey>(defaultCatalog)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  function handleNameChange(v: string) {
    setName(v)
    if (!slug || slug === slugify(name)) setSlug(slugify(v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const created = await categoriesApi.create({ name: name.trim(), slug: slug.trim() || undefined })
      onCreated(created, catalog)
      setName('')
      setSlug('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la categoría.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[16px] p-5 flex flex-col gap-4"
      style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}
    >
      <h3 className="font-bold text-[16px]">Nueva categoría</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre"
          placeholder="Ej: Mesas de Centro"
          value={name}
          onChange={e => handleNameChange(e.target.value)}
          required
        />
        <Input
          label="Slug (auto)"
          placeholder="mesas-de-centro"
          value={slug}
          onChange={e => setSlug(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] font-medium" style={{ color: 'var(--color-ink-soft)' }}>
          Agregar a catálogo
        </label>
        <div className="flex gap-2 flex-wrap">
          {CATALOG_KEYS.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setCatalog(k)}
              className="px-4 py-[7px] rounded-full text-[13px] font-semibold transition-colors border"
              style={
                catalog === k
                  ? { background: 'var(--color-ink)', color: 'var(--color-cream)', borderColor: 'var(--color-ink)' }
                  : { background: 'var(--color-paper)', borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }
              }
            >
              {CATALOG_META[k].label}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-[13.5px] px-3 py-2 rounded-[8px]" style={{ background: 'color-mix(in srgb, var(--color-terra) 12%, white)', color: 'var(--color-terra)' }}>
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="font-semibold text-[14px] px-6 py-[11px] rounded-full transition-colors disabled:opacity-50"
          style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
        >
          {saving ? 'Creando…' : 'Crear categoría'}
        </button>
      </div>
    </form>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [loading, setLoading]       = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [activeTab, setActiveTab]   = useState<CatalogKey>('living')
  const [showNew, setShowNew]       = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const { map: catalogMap, addCategory, removeCategory } = useCatalogsStore()

  useEffect(() => {
    categoriesApi.list()
      .then(res => setCategories(res.categories))
      .catch(e => setFetchError(e.message ?? 'Error al cargar categorías'))
      .finally(() => setLoading(false))
  }, [])

  /* ── Helper: find category obj by slug ── */
  function bySlug(slug: string) {
    return categories.find(c => c.slug === slug)
  }

  /* ── Categories in active catalog ── */
  const catalogSlugs = catalogMap[activeTab]
  const catalogCats  = catalogSlugs.map(s => bySlug(s)).filter(Boolean) as CategorySummary[]

  /* ── Categories not in active catalog (for dropdown) ── */
  const notInCatalog = categories.filter(c => !catalogSlugs.includes(c.slug))

  /* ── All assigned slugs (across all catalogs) ── */
  const allAssigned = new Set(Object.values(catalogMap).flat())
  const unassigned  = categories.filter(c => !allAssigned.has(c.slug))

  /* ── Handlers ── */
  function handleRemoveFromCatalog(slug: string) {
    removeCategory(activeTab, slug)
  }

  async function handleDeleteCategory(cat: CategorySummary) {
    setDeleting(cat.id)
    setDeleteError('')
    try {
      await categoriesApi.delete(cat.id)
      setCategories(prev => prev.filter(c => c.id !== cat.id))
      // Remove from all catalogs
      CATALOG_KEYS.forEach(k => removeCategory(k, cat.slug))
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar la categoría.')
    } finally {
      setDeleting(null)
    }
  }

  function handleAddToCatalog(cat: CategorySummary) {
    addCategory(activeTab, cat.slug)
  }

  function handleCategoryCreated(cat: CategorySummary, catalog: CatalogKey) {
    setCategories(prev => [...prev, cat])
    addCategory(catalog, cat.slug)
    setShowNew(false)
    setActiveTab(catalog)
  }

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      {/* Header */}
      <div className="flex justify-between items-end mb-[28px]">
        <div>
          <span className="eyebrow muted">Admin</span>
          <h1 className="h2 mt-[6px]">Catálogos y Categorías</h1>
          <p className="mt-[6px] text-[14px]" style={{ color: 'var(--color-ink-soft)' }}>
            Organizá las categorías dentro de cada catálogo. Los cambios se reflejan al instante en la tienda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(s => !s)}
          className="flex items-center gap-2 font-semibold text-[14px] px-5 py-[11px] rounded-full transition-colors"
          style={
            showNew
              ? { background: 'var(--color-ink)', color: 'var(--color-cream)' }
              : { background: 'var(--color-cream-2)', border: '1px solid var(--color-line-2)', color: 'var(--color-ink)' }
          }
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva categoría
        </button>
      </div>

      {/* New category form */}
      {showNew && (
        <div className="mb-[24px]">
          <NewCategoryForm
            defaultCatalog={activeTab}
            onCreated={handleCategoryCreated}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : fetchError ? (
        <div className="text-center py-8 text-[14px]" style={{ color: 'var(--color-terra)' }}>{fetchError}</div>
      ) : (
        <>
          {/* 4 Catalog tabs */}
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}
          >
            {/* Tab bar */}
            <div
              className="flex gap-[2px] px-4 pt-3 border-b"
              style={{ borderColor: 'var(--color-line)', background: 'var(--color-cream-2)' }}
            >
              {CATALOG_KEYS.map(k => (
                <CatalogTab
                  key={k}
                  label={CATALOG_META[k].label}
                  active={activeTab === k}
                  onClick={() => setActiveTab(k)}
                  count={catalogMap[k].length}
                />
              ))}
            </div>

            {/* Active catalog panel */}
            <div className="p-6">
              <p className="text-[13.5px] mb-4" style={{ color: 'var(--color-ink-soft)' }}>
                {CATALOG_META[activeTab].description}
              </p>

              {catalogCats.length === 0 ? (
                <p className="text-[14px] py-4" style={{ color: 'var(--color-ink-soft)' }}>
                  Sin categorías en este catálogo.
                </p>
              ) : (
                <div className="flex flex-wrap gap-[10px] mb-5">
                  {catalogCats.map(cat => (
                    <CatalogChip
                      key={cat.id}
                      category={cat}
                      onRemoveFromCatalog={() => handleRemoveFromCatalog(cat.slug)}
                      onDelete={() => handleDeleteCategory(cat)}
                      deleting={deleting === cat.id}
                    />
                  ))}
                </div>
              )}

              <AddToCatalogDropdown
                available={notInCatalog}
                onAdd={handleAddToCatalog}
              />

              {deleteError && (
                <p className="mt-3 text-[13.5px]" style={{ color: 'var(--color-terra)' }}>{deleteError}</p>
              )}
            </div>
          </div>

          {/* All categories table */}
          <div className="mt-[32px]">
            <h2 className="h3 mb-4">
              Todas las categorías
              <span className="text-[15px] font-sans font-normal ml-2" style={{ color: 'var(--color-ink-soft)' }}>
                ({categories.length})
              </span>
            </h2>

            <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid var(--color-line)' }}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--color-cream-2)' }}>
                      {['Nombre', 'Slug', 'Catálogo', 'Acciones'].map(h => (
                        <th
                          key={h}
                          className="text-left text-[11.5px] tracking-[.06em] uppercase font-bold px-5 py-[12px] border-b"
                          style={{ color: 'var(--color-ink-soft)', borderColor: 'var(--color-line)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => {
                      const assignedTo = CATALOG_KEYS.find(k => catalogMap[k].includes(cat.slug))
                      return (
                        <tr
                          key={cat.id}
                          className="hover:bg-[var(--color-cream-2)] transition-colors"
                          style={{ background: 'var(--color-paper)' }}
                        >
                          <td className="px-5 py-[11px] border-b font-semibold text-[14px]" style={{ borderColor: 'var(--color-line)' }}>
                            {cat.name}
                          </td>
                          <td className="px-5 py-[11px] border-b mono text-[12.5px]" style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink-soft)' }}>
                            {cat.slug}
                          </td>
                          <td className="px-5 py-[11px] border-b text-[13px]" style={{ borderColor: 'var(--color-line)' }}>
                            {assignedTo ? (
                              <span
                                className="font-semibold text-[12px] px-[10px] py-[4px] rounded-full"
                                style={{ background: 'var(--color-terra-soft)', color: 'var(--color-terra)' }}
                              >
                                {CATALOG_META[assignedTo].label}
                              </span>
                            ) : (
                              <span className="text-[12px]" style={{ color: 'var(--color-ink-soft)' }}>Sin asignar</span>
                            )}
                          </td>
                          <td className="px-5 py-[11px] border-b" style={{ borderColor: 'var(--color-line)' }}>
                            <div className="flex gap-2 items-center">
                              {!assignedTo && (
                                <div className="relative group/assign">
                                  <div className="flex gap-1">
                                    {CATALOG_KEYS.map(k => (
                                      <button
                                        key={k}
                                        type="button"
                                        onClick={() => addCategory(k, cat.slug)}
                                        className="text-[11px] font-semibold px-2 py-1 rounded-[6px] border transition-colors hover:border-[var(--color-ink)]"
                                        style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
                                      >
                                        +{CATALOG_META[k].label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                                disabled={deleting === cat.id}
                                className="text-[12px] font-semibold px-3 py-[5px] rounded-[8px] transition-colors disabled:opacity-50 hover:opacity-80"
                                style={{ background: 'color-mix(in srgb, var(--color-terra) 12%, white)', color: 'var(--color-terra)' }}
                              >
                                {deleting === cat.id ? '…' : 'Eliminar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {unassigned.length > 0 && (
              <p className="mt-3 text-[13px]" style={{ color: 'var(--color-ink-soft)' }}>
                {unassigned.length} categoría{unassigned.length !== 1 ? 's' : ''} sin asignar a ningún catálogo.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

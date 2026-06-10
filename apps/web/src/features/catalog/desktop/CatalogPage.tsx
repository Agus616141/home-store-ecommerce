import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { ProductCard } from '../../products/components/ProductCard'
import { ErrorMessage } from '../../../shared/ui/ErrorMessage'
import { useCatalogController } from '../controllers/useCatalogController'
import { ALL_CATEGORIES } from '../lib/ambients'
import type { ProductListParams } from '../../../shared/api/dto.types'

const SORT_OPTIONS: { value: ProductListParams['sort'] | ''; label: string }[] = [
  { value: '',           label: 'Relevancia' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'newest',     label: 'Más nuevos' },
]

const COLOR_OPTIONS = [
  'Blanco', 'Negro', 'Gris', 'Beige', 'Marrón', 'Verde', 'Azul', 'Rojo', 'Natural',
]

const MATERIAL_OPTIONS = [
  'Madera', 'Metal', 'Tela', 'Cuero', 'Mármol', 'Plástico', 'Ratán', 'Vidrio',
]

const COLOR_HEX: Record<string, string> = {
  Blanco: '#f5f5f5', Negro: '#1a1a1a', Gris: '#9e9e9e', Beige: '#e8d5b7',
  Marrón: '#8b5e3c', Verde: '#6b8f71', Azul: '#5e7a9e', Rojo: '#c0392b', Natural: '#d4b896',
}

/* ---- Filter group collapsible ---- */
function FilterGroup({ title, defaultOpen = true, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b py-[18px]" style={{ borderColor: 'var(--color-line)' }}>
      <button
        className="w-full flex justify-between items-center font-semibold text-[15px] cursor-pointer"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {title}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="transition-transform duration-200"
          style={{ color: 'var(--color-ink-soft)', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="mt-[14px] flex flex-col gap-[11px]">{children}</div>}
    </div>
  )
}

/* ---- Sidebar de filtros ---- */
function FilterSidebar({
  selectedCategories,
  onToggleCategory,
  selectedColors,
  onToggleColor,
  selectedMaterials,
  onToggleMaterial,
  onClear,
  categories = ALL_CATEGORIES,
}: {
  selectedCategories: string[]
  onToggleCategory: (slug: string) => void
  selectedColors: string[]
  onToggleColor: (val: string) => void
  selectedMaterials: string[]
  onToggleMaterial: (val: string) => void
  onClear: () => void
  categories?: typeof ALL_CATEGORIES
}) {
  const hasAny = selectedCategories.length > 0 || selectedColors.length > 0 || selectedMaterials.length > 0

  return (
    <aside className="sticky top-[96px]">
      <div className="flex justify-between items-center mb-[6px]">
        <strong className="text-[16px]">Filtros</strong>
        {hasAny && (
          <button
            onClick={onClear}
            className="text-[13.5px] font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--color-terra)' }}
          >
            Limpiar todo
          </button>
        )}
      </div>

      <FilterGroup title="Categoría">
        {categories.map(({ slug, label }) => {
          const checked = selectedCategories.includes(slug)
          return (
            <label
              key={slug}
              className="flex items-center gap-[10px] text-[14px] cursor-pointer select-none"
              style={{ color: checked ? 'var(--color-ink)' : 'var(--color-ink-2)' }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleCategory(slug)}
                className="w-4 h-4 rounded-none"
                style={{ accentColor: 'var(--color-terra)' }}
              />
              <span className={checked ? 'font-semibold' : ''}>{label}</span>
            </label>
          )
        })}
      </FilterGroup>

      <FilterGroup title="Precio" defaultOpen={false}>
        <div className="flex gap-[10px] items-center w-full">
          <input
            placeholder="$ mín"
            className="min-w-0 flex-1 rounded-[6px] px-3 py-2 text-[14px] font-sans outline-none"
            style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line-2)' }}
          />
          <span className="shrink-0" style={{ color: 'var(--color-ink-soft)' }}>—</span>
          <input
            placeholder="$ máx"
            className="min-w-0 flex-1 rounded-[6px] px-3 py-2 text-[14px] font-sans outline-none"
            style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line-2)' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['< $300', '$300–700', '$700+'].map(r => (
            <button
              key={r}
              className="text-[13px] font-medium px-[14px] py-[7px] rounded-full border transition-colors"
              style={{ background: 'var(--color-paper)', borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
            >
              {r}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Color" defaultOpen={false}>
        <div className="flex flex-wrap gap-[10px]">
          {COLOR_OPTIONS.map(col => {
            const active = selectedColors.includes(col)
            return (
              <button
                key={col}
                onClick={() => onToggleColor(col)}
                aria-label={col}
                aria-pressed={active}
                title={col}
                className="w-[28px] h-[28px] rounded-full transition-all"
                style={{
                  background: COLOR_HEX[col] ?? col,
                  border: active ? '2px solid var(--color-ink)' : '2px solid var(--color-line-2)',
                  boxShadow: active ? '0 0 0 2px var(--color-cream), 0 0 0 4px var(--color-ink)' : undefined,
                  transform: active ? 'scale(1.12)' : undefined,
                }}
              />
            )
          })}
        </div>
        {selectedColors.length > 0 && (
          <span className="text-[13px] mt-1" style={{ color: 'var(--color-ink-soft)' }}>
            {selectedColors.join(', ')}
          </span>
        )}
      </FilterGroup>

      <FilterGroup title="Material" defaultOpen={false}>
        {MATERIAL_OPTIONS.map(mat => {
          const checked = selectedMaterials.includes(mat)
          return (
            <label
              key={mat}
              className="flex items-center gap-[10px] text-[14px] cursor-pointer select-none"
              style={{ color: checked ? 'var(--color-ink)' : 'var(--color-ink-2)' }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleMaterial(mat)}
                className="w-4 h-4 rounded-none"
                style={{ accentColor: 'var(--color-terra)' }}
              />
              <span className={checked ? 'font-semibold' : ''}>{mat}</span>
            </label>
          )
        })}
      </FilterGroup>
    </aside>
  )
}

/* ---- Sort toolbar (compartido) ---- */
function SortToolbar({
  total,
  contextLabel,
  loading,
  sort,
  onSortChange,
}: {
  total: number
  contextLabel: string
  loading: boolean
  sort: ProductListParams['sort']
  onSortChange: (s: ProductListParams['sort']) => void
}) {
  return (
    <div className="flex justify-between items-center mb-2">
      <span className="text-[14px]" style={{ color: 'var(--color-ink-soft)' }}>
        {loading
          ? 'Cargando…'
          : <><strong style={{ color: 'var(--color-ink)' }}>{total}</strong> productos en {contextLabel}</>
        }
      </span>
      <div className="relative">
        <select
          value={sort ?? ''}
          onChange={e => {
            const v = e.target.value
            onSortChange(v === '' ? undefined : v as ProductListParams['sort'])
          }}
          className="appearance-none font-sans text-[14px] font-medium rounded-full cursor-pointer outline-none pr-[36px] pl-[16px] py-[9px]"
          style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line-2)', color: 'var(--color-ink)' }}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value ?? 'rel'} value={o.value}>{o.label}</option>
          ))}
        </select>
        <svg
          className="absolute right-[14px] top-1/2 -translate-y-1/2 pointer-events-none"
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--color-ink-soft)' }} aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  )
}

/* ---- Active filter chips ---- */
function ActiveChips({ vm }: { vm: ReturnType<typeof useCatalogController> }) {
  if (!vm.hasActiveFilters) return null
  return (
    <div className="flex gap-[10px] items-center flex-wrap mb-[22px]">
      <span className="text-[13.5px]" style={{ color: 'var(--color-ink-soft)' }}>Filtros:</span>
      {vm.categories.map(slug => (
        <Chip
          key={slug}
          label={ALL_CATEGORIES.find(c => c.slug === slug)?.label ?? slug}
          onRemove={() => vm.toggleCategory(slug)}
        />
      ))}
      {vm.colors.map(col => (
        <Chip key={col} label={`Color: ${col}`} onRemove={() => vm.toggleColor(col)} />
      ))}
      {vm.materials.map(mat => (
        <Chip key={mat} label={`Material: ${mat}`} onRemove={() => vm.toggleMaterial(mat)} />
      ))}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-[7px] text-[13px] font-medium px-[14px] py-[7px] rounded-full transition-colors"
      style={{ background: 'var(--color-ink)', color: 'var(--color-cream)', border: '1px solid var(--color-ink)' }}
    >
      {label}
      <span aria-hidden="true" className="opacity-60">✕</span>
    </button>
  )
}

function ProductGridSkeleton() {
  return (
    <>
      <div className="grid grid-cols-3 gap-x-[24px] gap-y-[28px] max-md:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="animate-pulse flex flex-col gap-[14px]">
            <div
              className="aspect-[3/4] w-full rounded-[12px]"
              style={{ background: 'color-mix(in srgb, var(--color-cream) 60%, white)' }}
            />
            <div className="flex flex-col gap-[10px]">
              <div
                className="h-[18px] rounded-full w-[72%]"
                style={{ background: 'color-mix(in srgb, var(--color-cream) 45%, white)' }}
              />
              <div
                className="h-[16px] rounded-full w-[36%]"
                style={{ background: 'color-mix(in srgb, var(--color-cream) 38%, white)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---- Grid de productos ---- */
function ProductGrid({ vm }: { vm: ReturnType<typeof useCatalogController> }) {
  if (vm.showSkeletons) {
    return <ProductGridSkeleton />
  }
  if (vm.error) {
    return <ErrorMessage message={vm.error} />
  }
  if (vm.isEmpty) {
    return (
      <div className="text-center py-[50px] max-w-[440px] mx-auto">
        <div
          className="w-[84px] h-[84px] rounded-full grid place-items-center mx-auto mb-5"
          style={{ background: 'var(--color-cream-2)' }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--color-terra)" strokeWidth="1.4" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h3 className="h3">Sin productos en esta sección</h3>
        <p className="mt-[10px] mb-[22px]" style={{ color: 'var(--color-ink-soft)' }}>
          Todavía no hay productos en esta categoría.
        </p>
        <Link to="/catalog" className="text-[14px] font-semibold underline" style={{ color: 'var(--color-terra)' }}>
          Ver toda la tienda
        </Link>
      </div>
    )
  }
  return (
    <>
      <div className="grid grid-cols-3 gap-x-[24px] gap-y-[28px] max-md:grid-cols-2">
        {vm.cardData.map((p, i) => (
          <ProductCard key={p.id} product={p} onAddToCart={vm.addToCart} slotNumber={25 + i} />
        ))}
      </div>
      <Pagination current={vm.page} total={vm.totalPages} onPageChange={vm.setPage} />
    </>
  )
}

/* ---- Pagination ---- */
function Pagination({ current, total, onPageChange }: {
  current: number; total: number; onPageChange: (p: number) => void
}) {
  const pages: (number | '…')[] = total <= 5
    ? Array.from({ length: total }, (_, i) => i + 1)
    : [1, 2, 3, '…', total]

  return (
    <nav className="flex justify-center gap-[6px] mt-[50px]" aria-label="Páginas">
      {[null, ...pages, null].map((p, i) => {
        if (p === null) {
          const isPrev = i === 0
          const target = isPrev ? current - 1 : current + 1
          const disabled = isPrev ? current <= 1 : current >= total
          return (
            <button
              key={isPrev ? 'prev' : 'next'}
              onClick={() => !disabled && onPageChange(target)}
              disabled={disabled}
              className="min-w-[42px] h-[42px] grid place-items-center rounded-[10px] border text-[14px] font-semibold transition-colors hover:border-[var(--color-ink)] disabled:opacity-30"
              style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
              aria-label={isPrev ? 'Página anterior' : 'Página siguiente'}
            >
              {isPrev ? '‹' : '›'}
            </button>
          )
        }
        if (p === '…') {
          return (
            <span key="ellipsis" className="min-w-[42px] h-[42px] grid place-items-center text-[14px]" style={{ color: 'var(--color-ink-soft)' }}>…</span>
          )
        }
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="min-w-[42px] h-[42px] grid place-items-center rounded-[10px] border text-[14px] font-semibold transition-colors hover:border-[var(--color-ink)]"
            style={
              p === current
                ? { background: 'var(--color-ink)', color: 'var(--color-cream)', borderColor: 'var(--color-ink)' }
                : { borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }
            }
            aria-current={p === current ? 'page' : undefined}
          >
            {p}
          </button>
        )
      })}
    </nav>
  )
}

/* ════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ════════════════════════════════════════════ */
export function CatalogPage() {
  const { ambient } = useParams<{ ambient?: string }>()
  const vm = useCatalogController(ambient)

  const isAmbient = Boolean(ambient && vm.ambientConfig)

  // ── Modo ambiente: /catalog/living, /catalog/dormitorio, etc. ──────────────
  if (isAmbient) {
    const cfg = vm.ambientConfig!
    const ambientCategories = ALL_CATEGORIES.filter(c => cfg.categories.includes(c.slug))

    return (
      <div className="wrap-wide">
        <nav className="text-[13px] pt-[22px]" style={{ color: 'var(--color-ink-soft)' }} aria-label="Ruta de navegación">
          <Link to="/" className="hover:text-[var(--color-ink)] transition-colors">Home</Link>
          {' / '}
          <Link to="/catalog" className="hover:text-[var(--color-ink)] transition-colors">Tienda</Link>
          {' / '}
          <span style={{ color: 'var(--color-ink)' }}>{cfg.label}</span>
        </nav>

        <div className="mt-[14px] mb-[30px]">
          <span className="eyebrow">Colección</span>
          <h1 className="h1 mt-[10px]">{cfg.label}</h1>
          <p className="lead mt-[10px] max-w-[520px]">{cfg.description}</p>
        </div>

        <div className="grid gap-[40px] items-start pb-[90px]" style={{ gridTemplateColumns: '268px 1fr' }}>
          <FilterSidebar
            selectedCategories={vm.categories}
            onToggleCategory={vm.toggleCategory}
            selectedColors={vm.colors}
            onToggleColor={vm.toggleColor}
            selectedMaterials={vm.materials}
            onToggleMaterial={vm.toggleMaterial}
            onClear={vm.clearFilters}
            categories={ambientCategories}
          />
          <div>
            <SortToolbar
              total={vm.total}
              contextLabel={cfg.label}
              loading={vm.loading}
              sort={vm.sort}
              onSortChange={(s) => { vm.setSort(s); vm.setPage(1) }}
            />
            <ActiveChips vm={vm} />
            <ProductGrid vm={vm} />
          </div>
        </div>
      </div>
    )
  }

  // ── Modo tienda: /catalog ──────────────────────────────────────────────────
  const title = vm.searchQuery
    ? `"${vm.searchQuery}"`
    : vm.categories.length === 1
      ? (ALL_CATEGORIES.find(c => c.slug === vm.categories[0])?.label ?? vm.categories[0] ?? 'Todos los productos')
      : vm.categories.length > 1
        ? `${vm.categories.length} categorías`
        : 'Todos los productos'

  return (
    <div className="wrap-wide">
      <nav className="text-[13px] pt-[22px]" style={{ color: 'var(--color-ink-soft)' }} aria-label="Ruta de navegación">
        <Link to="/" className="hover:text-[var(--color-ink)] transition-colors">Home</Link>
        {' / '}
        <span style={{ color: 'var(--color-ink)' }}>Tienda</span>
      </nav>

      <div
        className="grid items-end gap-6 mt-[14px] mb-[30px]"
        style={{ gridTemplateColumns: '1.3fr 1fr' }}
      >
        <div>
          <span className="eyebrow">Colección</span>
          <h1 className="h1 mt-[10px]">{title}</h1>
          <p className="lead mt-[10px] max-w-[460px]">
            {vm.searchQuery
              ? `${vm.total} resultado${vm.total !== 1 ? 's' : ''} para tu búsqueda.`
              : 'Toda la colección en un solo lugar. Descubrí piezas para cada ambiente de tu casa.'
            }
          </p>
        </div>
        <div
          className="h-[150px] rounded-[12px] max-md:hidden"
          style={{ background: 'linear-gradient(135deg, var(--color-terra-soft), #d8a98c)' }}
          aria-hidden="true"
        />
      </div>

      <div
        className="grid gap-[40px] items-start pb-[90px]"
        style={{ gridTemplateColumns: '268px 1fr' }}
      >
        <FilterSidebar
          selectedCategories={vm.categories}
          onToggleCategory={vm.toggleCategory}
          selectedColors={vm.colors}
          onToggleColor={vm.toggleColor}
          selectedMaterials={vm.materials}
          onToggleMaterial={vm.toggleMaterial}
          onClear={vm.clearFilters}
        />

        <div>
          <SortToolbar
            total={vm.total}
            contextLabel={title}
            loading={vm.loading}
            sort={vm.sort}
            onSortChange={(s) => { vm.setSort(s); vm.setPage(1) }}
          />
          <ActiveChips vm={vm} />
          <ProductGrid vm={vm} />
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { productsApi } from '../../../shared/api/endpoints'
import { Spinner } from '../../../shared/ui/Spinner'
import { ALL_CATEGORIES } from '../../catalog/lib/ambients'
import type { ProductSummary, ProductImage } from '../../../shared/api/dto.types'

// color y material se agregan cuando el backend añada los campos al schema de Prisma

interface FormState {
  name: string
  slug: string
  description: string
  price: string
  stock: string
  sku: string
  color: string
  material: string
  isActive: boolean
  isFeatured: boolean
  categories: string[]
  images: { url: string; altText: string; isPrimary: boolean }[]
}

function initForm(): FormState {
  return {
    name: '', slug: '', description: '', price: '', stock: '', sku: '', color: '', material: '',
    isActive: true, isFeatured: false,
    categories: [], images: [],
  }
}

function productToForm(p: ProductSummary): FormState {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: (p.priceCents / 100).toFixed(2),
    stock: String(p.stock),
    sku: p.sku ?? '',
    color: p.color ?? '',
    material: p.material ?? '',
    isActive: p.isActive,
    isFeatured: p.isFeatured ?? false,
    categories: p.categories.map(c => c.category.slug),
    images: p.images.map(img => ({
      url: img.url,
      altText: img.altText ?? '',
      isPrimary: img.isPrimary ?? false,
    })),
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/* ---- Fila de imagen ---- */
function ImageRow({
  img, index, onUpdate, onRemove, onSetPrimary,
}: {
  img: FormState['images'][0]
  index: number
  onUpdate: (f: 'url' | 'altText', v: string) => void
  onRemove: () => void
  onSetPrimary: () => void
}) {
  return (
    <div className="flex gap-3 items-start p-3 rounded-[10px]" style={{ background: 'var(--color-cream-2)', border: '1px solid var(--color-line)' }}>
      <div className="w-14 h-14 rounded-[8px] shrink-0 overflow-hidden" style={{ background: 'var(--color-line)' }}>
        {img.url && (
          <img
            src={img.url}
            alt={img.altText || `imagen ${index + 1}`}
            className="w-full h-full object-cover"
            onError={e => (e.currentTarget.style.opacity = '0')}
          />
        )}
      </div>
      <div className="flex-1 grid gap-2">
        <input
          value={img.url}
          onChange={e => onUpdate('url', e.target.value)}
          placeholder="URL de la imagen"
          className="w-full rounded-[8px] px-3 py-2 text-[13px] font-sans outline-none"
          style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line-2)' }}
        />
        <input
          value={img.altText}
          onChange={e => onUpdate('altText', e.target.value)}
          placeholder="Descripción breve de la imagen"
          className="w-full rounded-[8px] px-3 py-2 text-[13px] font-sans outline-none"
          style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line-2)' }}
        />
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <button
          type="button"
          onClick={onSetPrimary}
          className="text-[11px] font-semibold px-2 py-1 rounded-[6px] transition-colors"
          style={img.isPrimary
            ? { background: 'var(--color-gold)', color: '#fff' }
            : { background: 'var(--color-cream)', border: '1px solid var(--color-line-2)', color: 'var(--color-ink-soft)' }
          }
        >
          {img.isPrimary ? '★ Principal' : 'Principal'}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] font-semibold px-2 py-1 rounded-[6px] transition-colors"
          style={{ background: 'var(--color-cream)', border: '1px solid var(--color-line-2)', color: 'var(--color-terra)' }}
        >
          Quitar
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   PÁGINA
   ════════════════════════════════════════════ */
export function AdminProductFormPage() {
  const { slug } = useParams<{ slug?: string }>()
  const isEdit = Boolean(slug)
  const navigate = useNavigate()

  const [form, setForm]               = useState<FormState>(initForm())
  const [productId, setProductId]     = useState<string | null>(null)
  const [loadingProduct, setLoading]  = useState(isEdit)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    productsApi.getBySlug(slug)
      .then(p => { setProductId(p.id); setForm(productToForm(p)) })
      .catch(e => setError(e.message ?? 'Error al cargar el producto'))
      .finally(() => setLoading(false))
  }, [slug])

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleNameChange(name: string) {
    setForm(f => ({
      ...f,
      name,
      // En modo creación, el slug se genera automático del nombre.
      // En edición se conserva el slug original.
      slug: isEdit ? f.slug : slugify(name),
    }))
  }

  async function handleIsFeaturedToggle(newValue: boolean) {
    if (!newValue) {
      field('isFeatured', false)
      return
    }
    // Verificar si ya hay un producto destacado
    try {
      const current = await productsApi.getFeatured()
      if (current && current.id !== productId) {
        const ok = window.confirm(
          `"${current.name}" ya está destacado en el inicio.\n\n¿Querés reemplazarlo con este producto?`
        )
        if (!ok) return
      }
    } catch {
      // No hay ningún destacado todavía — continuar
    }
    field('isFeatured', true)
  }

  function toggleCategory(catSlug: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(catSlug)
        ? f.categories.filter(c => c !== catSlug)
        : [...f.categories, catSlug],
    }))
  }

  function addImage() {
    setForm(f => ({
      ...f,
      images: [...f.images, { url: '', altText: '', isPrimary: f.images.length === 0 }],
    }))
  }

  function updateImage(i: number, imgField: 'url' | 'altText', val: string) {
    setForm(f => ({
      ...f,
      images: f.images.map((img, idx) => idx === i ? { ...img, [imgField]: val } : img),
    }))
  }

  function removeImage(i: number) {
    setForm(f => {
      const next = f.images.filter((_, idx) => idx !== i)
      if (next.length > 0 && !next.some(img => img.isPrimary)) next[0]!.isPrimary = true
      return { ...f, images: next }
    })
  }

  function setPrimaryImage(i: number) {
    setForm(f => ({
      ...f,
      images: f.images.map((img, idx) => ({ ...img, isPrimary: idx === i })),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const priceCents = Math.round(parseFloat(form.price) * 100)
    if (isNaN(priceCents) || priceCents <= 0) {
      setError('El precio debe ser un número mayor a 0.')
      return
    }

    const stockVal = parseInt(form.stock, 10)
    if (isNaN(stockVal) || stockVal < 0) {
      setError('El stock debe ser un número mayor o igual a 0.')
      return
    }

    const images: Pick<ProductImage, 'url' | 'altText' | 'isPrimary' | 'sortOrder'>[] =
      form.images
        .filter(img => img.url.trim())
        .map((img, idx) => ({
          url: img.url.trim(),
          altText: img.altText.trim() || undefined,
          isPrimary: img.isPrimary,
          sortOrder: idx,
        }))

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      priceCents,
      stock: stockVal,
      sku: form.sku.trim() || null,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      color: form.color.trim() || null,
      material: form.material.trim() || null,
      categories: form.categories,
      images,
    }

    setSaving(true)
    try {
      if (isEdit && productId) {
        await productsApi.update(productId, payload)
        setSuccess('¡Producto actualizado correctamente!')
      } else {
        const created = await productsApi.create(payload)
        setSuccess('¡Producto creado correctamente!')
        navigate(`/admin/products/${created.slug}/edit`, { replace: true })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar el producto'
      setError(msg)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  if (loadingProduct) {
    return <div className="flex justify-center items-center h-[40vh]"><Spinner size="lg" /></div>
  }

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-[22px]">
        <Link
          to="/admin/products"
          className="w-8 h-8 rounded-[9px] border grid place-items-center transition-colors hover:border-[var(--color-ink)]"
          style={{ borderColor: 'var(--color-line-2)' }}
          aria-label="Volver a productos"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div>
          <span className="eyebrow muted">{isEdit ? 'Editar producto' : 'Nuevo producto'}</span>
          <h1 className="h2 mt-[4px]">{isEdit ? (form.name || 'Cargando…') : 'Crear producto'}</h1>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div
          className="mb-5 px-4 py-3 rounded-[10px] text-[14px] flex items-start gap-3"
          style={{ background: 'color-mix(in srgb, var(--color-terra) 10%, white)', border: '1px solid color-mix(in srgb, var(--color-terra) 35%, white)', color: 'var(--color-terra)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 mt-[1px]" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div
          className="mb-5 px-4 py-3 rounded-[10px] text-[14px] flex items-center gap-3"
          style={{ background: 'color-mix(in srgb, var(--color-ok) 10%, white)', border: '1px solid color-mix(in srgb, var(--color-ok) 35%, white)', color: 'var(--color-ok)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
          </svg>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6" style={{ gridTemplateColumns: '1fr 360px' }}>

        {/* ═══ Columna principal ═══ */}
        <div className="flex flex-col gap-5">

          {/* Info básica */}
          <Section title="Información básica">
            <FormField label="Nombre *">
              <input
                required
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ej: Sillón Curvo Moderno"
                className={inputCls}
                style={inputStyle}
              />
            </FormField>
            <FormField label="Descripción *">
              <textarea
                required
                rows={5}
                value={form.description}
                onChange={e => field('description', e.target.value)}
                placeholder="Describí el producto con sus características principales…"
                className="w-full rounded-[10px] px-3 py-3 text-[14px] font-sans outline-none resize-y"
                style={inputStyle}
              />
            </FormField>
          </Section>

          {/* Imágenes */}
          <Section title="Imágenes">
            {form.images.length === 0 && (
              <p className="text-[13px]" style={{ color: 'var(--color-ink-soft)' }}>
                Agregá al menos una imagen. La marcada como "Principal" aparece en los listados.
              </p>
            )}
            <div className="flex flex-col gap-3">
              {form.images.map((img, i) => (
                <ImageRow
                  key={i}
                  img={img}
                  index={i}
                  onUpdate={(f, v) => updateImage(i, f, v)}
                  onRemove={() => removeImage(i)}
                  onSetPrimary={() => setPrimaryImage(i)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addImage}
              className="mt-2 flex items-center gap-2 text-[14px] font-semibold px-4 py-[10px] rounded-[9px] border transition-colors hover:border-[var(--color-ink)]"
              style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Agregar imagen
            </button>
          </Section>

          {/* Categorías */}
          <Section title="Categorías">
            <p className="text-[12.5px] -mt-1 mb-1" style={{ color: 'var(--color-ink-soft)' }}>
              Seleccioná todas las categorías donde debe aparecer este producto.
            </p>
            <div className="grid grid-cols-2 gap-[10px]">
              {ALL_CATEGORIES.map(cat => (
                <label
                  key={cat.slug}
                  className="flex items-center gap-[10px] text-[14px] cursor-pointer"
                  style={{ color: 'var(--color-ink-2)' }}
                >
                  <input
                    type="checkbox"
                    checked={form.categories.includes(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                    className="w-4 h-4 rounded-none"
                    style={{ accentColor: 'var(--color-terra)' }}
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          </Section>
        </div>

        {/* ═══ Columna lateral ═══ */}
        <div className="flex flex-col gap-5">

          {/* Publicación */}
          <Section title="Publicación">
            <Toggle
              label="Activo"
              hint="Visible en la tienda"
              checked={form.isActive}
              onChange={v => field('isActive', v)}
            />
            <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: 14 }}>
              <Toggle
                label="Destacado en el inicio"
                hint="Este producto aparece en el héroe de la página principal. Solo puede haber uno."
                checked={form.isFeatured}
                onChange={handleIsFeaturedToggle}
              />
            </div>
          </Section>

          {/* Precio y stock */}
          <Section title="Precio y stock">
            <FormField label="Precio *">
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[15px]"
                  style={{ color: 'var(--color-ink-soft)' }}
                >$</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={e => field('price', e.target.value)}
                  placeholder="0.00"
                  className={`${inputCls} pl-7`}
                  style={inputStyle}
                />
              </div>
            </FormField>
            <FormField label="Stock disponible *">
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={e => field('stock', e.target.value)}
                placeholder="0"
                className={inputCls}
                style={inputStyle}
              />
            </FormField>
            <FormField label="SKU" hint="Código interno de referencia (opcional).">
              <input
                value={form.sku}
                onChange={e => field('sku', e.target.value)}
                placeholder="Ej: SKU-1001"
                className={inputCls}
                style={inputStyle}
              />
            </FormField>
            <FormField label="Color" hint="Usado por filtros y tarjetas del catalogo.">
              <input
                value={form.color}
                onChange={e => field('color', e.target.value)}
                placeholder="Ej: Crema"
                className={inputCls}
                style={inputStyle}
              />
            </FormField>
            <FormField label="Material" hint="Usado por filtros y descripcion del producto.">
              <input
                value={form.material}
                onChange={e => field('material', e.target.value)}
                placeholder="Ej: Roble"
                className={inputCls}
                style={inputStyle}
              />
            </FormField>
          </Section>

          {/* Botones */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-[14px] rounded-full font-semibold text-[15px] text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'var(--color-terra)' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-terra-dark)' }}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-terra)')}
          >
            {saving
              ? <><Spinner size="sm" />&nbsp;Guardando…</>
              : isEdit ? 'Guardar cambios' : 'Crear producto'
            }
          </button>

          {isEdit && (
            <Link
              to={`/product/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-[13px] rounded-full font-semibold text-[14px] border text-center transition-colors block hover:border-[var(--color-ink)]"
              style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink-2)' }}
            >
              Ver en tienda ↗
            </Link>
          )}
        </div>
      </form>
    </div>
  )
}

/* ── Helpers de UI ── */

const inputCls = 'w-full rounded-[10px] px-3 py-[10px] text-[14px] font-sans outline-none'
const inputStyle = { background: 'var(--color-paper)', border: '1px solid var(--color-line-2)' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] p-5" style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line)' }}>
      <h3 className="font-semibold text-[16px] mb-4">{title}</h3>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-[13px] font-semibold" style={{ color: 'var(--color-ink-2)' }}>{label}</label>
      {children}
      {hint && <span className="text-[12px]" style={{ color: 'var(--color-ink-soft)' }}>{hint}</span>}
    </div>
  )
}

function Toggle({
  label, hint, checked, onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void | Promise<void>
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <div className="text-[14px] font-semibold">{label}</div>
        {hint && <div className="text-[12px] mt-[3px] leading-snug" style={{ color: 'var(--color-ink-soft)' }}>{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => void onChange(!checked)}
        className="relative shrink-0 w-[44px] h-[26px] rounded-full transition-colors mt-[2px]"
        style={{ background: checked ? 'var(--color-terra)' : 'var(--color-line-2)' }}
      >
        <span
          className="absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow transition-transform duration-200"
          style={{ left: 3, transform: checked ? 'translateX(18px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  )
}

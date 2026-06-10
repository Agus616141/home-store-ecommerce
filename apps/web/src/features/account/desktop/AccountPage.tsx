import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '../../../shared/ui/Input'
import { ProductCard, type ProductCardData } from '../../products/components/ProductCard'
import { formatPrice } from '../../../shared/lib/format-price'
import { formatDate } from '../../../shared/lib/format-date'
import { Spinner } from '../../../shared/ui/Spinner'
import { ErrorMessage } from '../../../shared/ui/ErrorMessage'
import { useOrdersController } from '../../orders/controllers/useOrdersController'
import type { OrderStatus, AddressSummary, OrderItem } from '../../../shared/api/dto.types'
import { useAuthStore, selectUser } from '../../../shared/stores/auth.store'
import type { AuthUser } from '../../../shared/api/dto.types'
import { api } from '../../../shared/api/client'
import { addressesApi } from '../../../shared/api/endpoints'
import { useWishlistStore } from '../../../shared/stores/wishlist.store'

type Tab = 'overview' | 'orders' | 'profile' | 'address' | 'payment' | 'favs'

const VALID_TABS: Tab[] = ['overview', 'orders', 'profile', 'address', 'payment', 'favs']

const PH_BG: Record<string, string> = {
  terra: 'linear-gradient(135deg, var(--color-terra-soft), #d8a98c)',
  sage:  'linear-gradient(135deg, #b9bba0, var(--color-sage))',
  base:  'linear-gradient(135deg, var(--color-cream-2), var(--color-line))',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:    'Pendiente',
  CONFIRMED:  'Confirmado',
  PROCESSING: 'En preparación',
  SHIPPED:    'En camino',
  DELIVERED:  'Entregado',
  CANCELLED:  'Cancelado',
  REFUNDED:   'Reembolsado',
}

const STATUS_STEP: Record<OrderStatus, number> = {
  PENDING: 0, CONFIRMED: 1, PROCESSING: 2, SHIPPED: 3, DELIVERED: 4,
  CANCELLED: -1, REFUNDED: -1,
}

function statusColor(s: OrderStatus): 'ok' | 'warn' | 'soft' | 'err' {
  if (s === 'DELIVERED') return 'ok'
  if (s === 'CANCELLED' || s === 'REFUNDED') return 'err'
  if (s === 'PENDING') return 'soft'
  return 'warn'
}


const NAV_ITEMS: { tab: Tab; label: string; icon: React.ReactNode }[] = [
  {
    tab: 'orders', label: 'Pedidos',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 2h9l4 4v16H6z"/><path d="M9 7h5M9 11h7M9 15h7"/></svg>,
  },
  {
    tab: 'profile', label: 'Perfil',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
  },
  {
    tab: 'address', label: 'Direcciones',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>,
  },
  {
    tab: 'payment', label: 'Métodos de pago',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  },
  {
    tab: 'favs', label: 'Favoritos',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
]

/* ---- Order tracking dots ---- */
function TrackBar({ step }: { step: number }) {
  const labels = ['Confirmado', 'Empacado', 'En tránsito', 'Entregado']
  return (
    <div>
      <div className="flex items-center gap-0 mt-[6px]">
        {labels.map((_, i) => (
          <div key={i} className="flex items-center">
            <span
              className="w-[11px] h-[11px] rounded-full"
              style={{
                background: i <= step ? 'var(--color-terra)' : 'var(--color-line-2)',
                boxShadow: i === step ? '0 0 0 4px var(--color-terra-soft)' : undefined,
              }}
            />
            {i < labels.length - 1 && (
              <span
                className="w-8 h-[2px]"
                style={{ background: i < step ? 'var(--color-terra)' : 'var(--color-line-2)' }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mono mt-[6px]" style={{ color: 'var(--color-ink-soft)', fontSize: 11 }}>
        {labels.join(' · ')}
      </div>
    </div>
  )
}

function OrderThumbs({ items, count }: { items?: OrderItem[]; count: number }) {
  const visibleItems = items?.slice(0, 3)
  const placeholderCount = Math.min(count, 3)

  return (
    <div className="flex gap-[10px]">
      {visibleItems && visibleItems.length > 0
        ? visibleItems.map((item) => (
            item.imageUrl ? (
              <img
                key={item.productId}
                src={item.imageUrl}
                alt={item.productName}
                className="w-16 h-16 rounded-[10px] object-cover"
              />
            ) : (
              <div
                key={item.productId}
                className="w-16 h-16 rounded-[10px]"
                style={{ background: 'linear-gradient(135deg, var(--color-cream-2), var(--color-line))' }}
                aria-hidden="true"
              />
            )
          ))
        : Array.from({ length: placeholderCount }).map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-[10px]"
              style={{ background: 'linear-gradient(135deg, var(--color-cream-2), var(--color-line))' }}
              aria-hidden="true"
            />
          ))}
    </div>
  )
}

/* ---- Panels ---- */
function OrdersPanel() {
  const { orders, total, loading, error, isEmpty } = useOrdersController()

  const colorStyle = (s: OrderStatus) => {
    const c = statusColor(s)
    if (c === 'ok')   return { background: 'color-mix(in srgb, var(--color-ok) 16%, white)',   color: 'var(--color-ok)' }
    if (c === 'err')  return { background: 'color-mix(in srgb, var(--color-terra) 16%, white)', color: 'var(--color-terra)' }
    if (c === 'soft') return { background: 'var(--color-cream-2)', color: 'var(--color-ink-soft)' }
    return { background: 'color-mix(in srgb, var(--color-warn) 16%, white)', color: 'var(--color-warn)' }
  }

  return (
    <>
      <div className="mb-6">
        <span className="eyebrow">Historial</span>
        <h2 className="h2 mt-2">Tus pedidos</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { n: String(total), l: 'Pedidos en total' },
          { n: '340', l: 'Puntos de crédito Casa' },
        ].map(({ n, l }) => (
          <div key={l} className="p-5 rounded-[20px]" style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}>
            <div className="font-serif font-semibold text-[34px] leading-none">{n}</div>
            <div className="text-[13px] mt-[6px]" style={{ color: 'var(--color-ink-soft)' }}>{l}</div>
          </div>
        ))}
      </div>

      {loading && <div className="flex justify-center py-10"><Spinner size="lg" /></div>}
      {error && <ErrorMessage message={error} />}
      {isEmpty && (
        <div className="text-center py-[50px]" style={{ color: 'var(--color-ink-soft)' }}>
          Todavía no hiciste ningún pedido.{' '}
          <Link to="/catalog" className="underline" style={{ color: 'var(--color-terra)' }}>Explorar tienda</Link>
        </div>
      )}

      {/* Order cards */}
      {orders.map(order => (
        <div key={order.id} className="rounded-[20px] overflow-hidden mb-4" style={{ border: '1px solid var(--color-line)' }}>
          <div
            className="flex justify-between items-center px-5 py-4 border-b flex-wrap gap-[10px]"
            style={{ background: 'var(--color-cream-2)', borderColor: 'var(--color-line)' }}
          >
            <div className="flex gap-[26px] text-[13px]">
              {[
                ['Pedido', order.id.slice(0, 12)],
                ['Fecha', formatDate(order.createdAt)],
                ['Total', formatPrice(order.totalCents)],
              ].map(([l, v]) => (
                <div key={l}>
                  <span style={{ color: 'var(--color-ink-soft)' }}>{l}</span>
                  <strong className="block text-[14px]" style={{ color: 'var(--color-ink)' }}>{v}</strong>
                </div>
              ))}
            </div>
            <span
              className="text-[11.5px] font-bold tracking-[.04em] uppercase px-[10px] py-[5px] rounded-[6px]"
              style={colorStyle(order.status)}
            >
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <div className="flex gap-4 items-center px-5 py-[18px] flex-wrap" style={{ background: 'var(--color-paper)' }}>
            <OrderThumbs items={order.items} count={order.itemCount} />
            <div className="flex-1 min-w-[140px]">
              <div className="font-semibold">
                {order.itemCount} artículo{order.itemCount !== 1 ? 's' : ''}
              </div>
              {order.status === 'DELIVERED'
                ? <div className="mono mt-[6px]" style={{ color: 'var(--color-ink-soft)' }}>Entregado</div>
                : <TrackBar step={STATUS_STEP[order.status]} />
              }
            </div>
            <div className="flex gap-[10px]">
              <Link
                to={`/orders/${order.id}`}
                className="font-semibold text-[13px] px-4 py-2 rounded-full border transition-colors hover:border-[var(--color-ink)]"
                style={{ borderColor: 'var(--color-line-2)' }}
              >
                {order.status === 'DELIVERED' ? 'Volver a comprar' : 'Rastrear'}
              </Link>
              <Link
                to={`/orders/${order.id}`}
                className="font-semibold text-[13px] px-4 py-2 rounded-full border transition-colors hover:bg-white"
                style={{ background: 'var(--color-paper)', borderColor: 'var(--color-line)' }}
              >
                Detalle
              </Link>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function ProfilePanel({ user }: { user: AuthUser | null }) {
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName]   = useState(user?.lastName ?? '')
  const [saving, setSaving]       = useState(false)
  const [feedback, setFeedback]   = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      await api.patch('/api/users/me', { firstName, lastName })
      setFeedback({ ok: true, msg: 'Cambios guardados.' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar.'
      setFeedback({ ok: false, msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <span className="eyebrow">Datos personales</span>
        <h2 className="h2 mt-2">Perfil</h2>
      </div>
      <form
        className="max-w-[520px] flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
          />
          <Input
            label="Apellido"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
        </div>
        <Input
          label="Correo electrónico"
          type="email"
          defaultValue={user?.email ?? ''}
          disabled
        />
        <Input label="Teléfono" defaultValue="+52 55 1234 5678" />
        <hr style={{ border: 0, borderTop: '1px solid var(--color-line)' }} />
        <Input label="Contraseña actual" type="password" placeholder="••••••••" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nueva contraseña" type="password" />
          <Input label="Confirmar" type="password" />
        </div>
        {feedback && (
          <div
            className="text-[13.5px] px-4 py-[10px] rounded-[10px]"
            style={{
              background: feedback.ok
                ? 'color-mix(in srgb, var(--color-ok) 14%, white)'
                : 'color-mix(in srgb, var(--color-terra) 14%, white)',
              color: feedback.ok ? 'var(--color-ok)' : 'var(--color-terra)',
            }}
          >
            {feedback.msg}
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="font-semibold text-[14.5px] px-[26px] py-[13px] rounded-full transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button
            type="reset"
            disabled={saving}
            onClick={() => { setFirstName(user?.firstName ?? ''); setLastName(user?.lastName ?? ''); setFeedback(null) }}
            className="font-semibold text-[14.5px] px-[26px] py-[13px] rounded-full border transition-colors hover:border-[var(--color-ink)] disabled:opacity-60"
            style={{ borderColor: 'var(--color-line-2)' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </>
  )
}

const COUNTRY_OPTIONS = [
  { code: 'AR', label: 'Argentina' },
  { code: 'MX', label: 'México' },
  { code: 'ES', label: 'España' },
  { code: 'CL', label: 'Chile' },
  { code: 'CO', label: 'Colombia' },
  { code: 'UY', label: 'Uruguay' },
  { code: 'PE', label: 'Perú' },
]

const COUNTRY_LABEL: Record<string, string> = Object.fromEntries(
  COUNTRY_OPTIONS.map(c => [c.code, c.label])
)

interface AddressCardProps {
  address: AddressSummary
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
  deleting: boolean
}

function AddressCard({ address, onDelete, onSetDefault, deleting }: AddressCardProps) {
  return (
    <div
      className="p-5 rounded-[20px] flex flex-col gap-3"
      style={{
        border: `1px solid ${address.isDefault ? 'var(--color-terra)' : 'var(--color-line)'}`,
        background: 'var(--color-paper)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        {address.label && (
          <span
            className="text-[11.5px] font-bold tracking-[.04em] uppercase px-[10px] py-[5px] rounded-[6px]"
            style={{ background: 'var(--color-cream-2)', color: 'var(--color-ink-2)' }}
          >
            {address.label}
          </span>
        )}
        {address.isDefault && (
          <span
            className="text-[11.5px] font-bold tracking-[.04em] uppercase px-[10px] py-[5px] rounded-[6px]"
            style={{ background: 'color-mix(in srgb, var(--color-terra) 14%, white)', color: 'var(--color-terra)' }}
          >
            Principal
          </span>
        )}
      </div>

      {/* Address text */}
      <p className="text-[14px] leading-[1.65] flex-1" style={{ color: 'var(--color-ink)' }}>
        {address.street}<br />
        {address.city}, {address.state} {address.postalCode}<br />
        {COUNTRY_LABEL[address.country] ?? address.country}
      </p>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'var(--color-line)' }}>
        {!address.isDefault && (
          <button
            onClick={() => onSetDefault(address.id)}
            disabled={deleting}
            className="text-[12.5px] font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            Marcar principal
          </button>
        )}
        <button
          onClick={() => onDelete(address.id)}
          disabled={deleting}
          className="text-[12.5px] font-medium transition-opacity hover:opacity-70 disabled:opacity-40 ml-auto"
          style={{ color: 'var(--color-terra)' }}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

const EMPTY_ADDR = { street: '', city: '', state: '', postalCode: '', country: 'AR', label: '' }

function AddressPanel() {
  const [addresses, setAddresses] = useState<AddressSummary[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_ADDR)
  const [saving, setSaving]       = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError]         = useState('')

  function loadAddresses() {
    return addressesApi.list()
      .then(setAddresses)
      .catch(() => setAddresses([]))
  }

  useEffect(() => {
    loadAddresses().finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.street || !form.city || !form.state || !form.postalCode) {
      setError('Completá los campos obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await addressesApi.create({
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country,
        ...(form.label.trim() ? { label: form.label.trim() } : {}),
      })
      await loadAddresses()
      setShowForm(false)
      setForm(EMPTY_ADDR)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la dirección.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await addressesApi.delete(id)
      await loadAddresses()
    } catch {
      // silent — address stays in list
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSetDefault(id: string) {
    setDeletingId(id)
    try {
      await addressesApi.setDefault(id)
      await loadAddresses()
    } catch {
      // silent
    } finally {
      setDeletingId(null)
    }
  }

  function field(key: keyof typeof EMPTY_ADDR, label: string, placeholder?: string) {
    return (
      <Input
        label={label}
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
      />
    )
  }

  return (
    <>
      <div className="mb-6">
        <span className="eyebrow">Envíos</span>
        <h2 className="h2 mt-2">Direcciones</h2>
      </div>

      {loading && <div className="flex justify-center py-10"><Spinner size="lg" /></div>}

      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        {addresses.map(a => (
          <AddressCard
            key={a.id}
            address={a}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
            deleting={deletingId === a.id}
          />
        ))}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-[20px] grid place-items-center min-h-[150px] border-dashed text-[15px] font-medium transition-colors hover:border-[var(--color-ink)]"
            style={{ border: '1.5px dashed var(--color-line-2)', color: 'var(--color-ink-soft)' }}
          >
            <div className="text-center">
              <div className="text-[28px] mb-1">+</div>
              Agregar dirección
            </div>
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mt-6 max-w-[520px] p-5 rounded-[20px] flex flex-col gap-4"
          style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}
        >
          <h3 className="font-bold text-[17px]">Nueva dirección</h3>

          {field('label', 'Etiqueta (opcional)', 'Casa, Oficina…')}
          {field('street', 'Calle y número *')}

          <div className="grid grid-cols-2 gap-4">
            {field('city', 'Ciudad *')}
            {field('state', 'Provincia *')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('postalCode', 'Código postal *')}
            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--color-ink-2)' }}>
                País *
              </label>
              <select
                value={form.country}
                onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                className="px-[14px] py-[10px] rounded-[10px] text-[14.5px] outline-none"
                style={{ border: '1px solid var(--color-line-2)', background: 'var(--color-cream)', color: 'var(--color-ink)' }}
              >
                {COUNTRY_OPTIONS.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="font-semibold text-[14.5px] px-[26px] py-[13px] rounded-full transition-colors disabled:opacity-60"
              style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
            >
              {saving ? 'Guardando…' : 'Guardar dirección'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_ADDR); setError('') }}
              disabled={saving}
              className="font-semibold text-[14.5px] px-[26px] py-[13px] rounded-full border transition-colors hover:border-[var(--color-ink)] disabled:opacity-60"
              style={{ borderColor: 'var(--color-line-2)' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </>
  )
}

function PaymentPanel() {
  return (
    <>
      <div className="mb-6">
        <span className="eyebrow">Pagos</span>
        <h2 className="h2 mt-2">Métodos de pago</h2>
      </div>
      {[
        { brand: 'VISA', brandBg: 'var(--color-ink)', name: 'Visa terminada en 4242', exp: 'Expira 08/27 · Principal' },
        { brand: 'MC',   brandBg: 'var(--color-terra)', name: 'Mastercard terminada en 8810', exp: 'Expira 02/26' },
      ].map(pm => (
        <div
          key={pm.name}
          className="flex items-center gap-[14px] px-5 py-4 rounded-[12px] mb-3"
          style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}
        >
          <div
            className="w-[52px] h-[34px] rounded-[6px] grid place-items-center text-[10px] font-bold text-white shrink-0"
            style={{ background: pm.brandBg }}
          >
            {pm.brand}
          </div>
          <div className="flex-1">
            <div className="font-semibold">{pm.name}</div>
            <div className="mono" style={{ color: 'var(--color-ink-soft)' }}>{pm.exp}</div>
          </div>
          <button
            className="font-semibold text-[13px] px-4 py-2 rounded-full border transition-colors hover:border-[var(--color-ink)]"
            style={{ borderColor: 'var(--color-line-2)' }}
          >
            Eliminar
          </button>
        </div>
      ))}
      <button
        className="mt-2 font-semibold text-[14px] px-[26px] py-[11px] rounded-full border transition-colors hover:bg-white"
        style={{ background: 'var(--color-paper)', borderColor: 'var(--color-line)' }}
      >
        + Agregar tarjeta (vía Stripe)
      </button>
    </>
  )
}

function FavsPanel() {
  const wishlistItems = useWishlistStore(s => s.items)
  const loading = useWishlistStore(s => s.loading)
  const error = useWishlistStore(s => s.error)
  const fetchWishlist = useWishlistStore(s => s.fetch)
  const items: ProductCardData[] = wishlistItems.map(item => ({
    id: item.productId,
    slug: item.product.slug,
    name: item.product.name,
    priceCents: item.product.priceCents,
    imageUrl: item.product.images[0]?.url,
  }))

  useEffect(() => {
    fetchWishlist().catch(() => {})
  }, [fetchWishlist])

  return (
    <>
      <div className="mb-6">
        <span className="eyebrow">Tu wishlist</span>
        <h2 className="h2 mt-2">Favoritos</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : items.length === 0 ? (
        <div className="py-[50px] text-center max-w-[360px] mx-auto">
          <div
            className="w-[72px] h-[72px] rounded-full grid place-items-center mx-auto mb-5"
            style={{ background: 'var(--color-cream-2)' }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--color-terra)" strokeWidth="1.4" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h3 className="h3">Sin favoritos todavía</h3>
          <p className="mt-2 mb-6" style={{ color: 'var(--color-ink-soft)' }}>
            Guardá los productos que te gusten tocando el corazón en cada tarjeta.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center justify-center font-semibold text-[14.5px] px-[28px] py-[13px] rounded-full transition-colors"
            style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
          >
            Explorar tienda
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-5 text-[13.5px]" style={{ color: 'var(--color-ink-soft)' }}>
            {items.length} producto{items.length !== 1 ? 's' : ''} guardado{items.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-3 gap-6 max-md:grid-cols-2">
            {items.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </>
  )
}

/* ---- Overview (mini-dashboard) ---- */
function OverviewPanel({ user, onNavigate }: { user: AuthUser | null; onNavigate: (t: Tab) => void }) {
  const favCount = useWishlistStore(s => s.items.length)
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '?'

  const stats = [
    { label: 'Pedidos',     value: '—',         tab: 'orders'  as Tab, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 2h9l4 4v16H6z"/><path d="M9 11h7M9 15h7"/></svg> },
    { label: 'Favoritos',   value: favCount,     tab: 'favs'    as Tab, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
    { label: 'Direcciones', value: '—',         tab: 'address' as Tab, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg> },
  ]

  return (
    <>
      <div className="mb-8">
        <span className="eyebrow">Resumen</span>
        <h2 className="h2 mt-2">Hola, {user?.firstName ?? 'Usuario'}</h2>
      </div>

      {/* Profile card */}
      <div
        className="flex items-center gap-5 p-6 rounded-[24px] mb-6"
        style={{ background: 'linear-gradient(135deg, var(--color-cream-2), var(--color-paper))', border: '1px solid var(--color-line)' }}
      >
        <div
          className="w-[72px] h-[72px] rounded-full shrink-0 grid place-items-center text-[24px] font-bold"
          style={{ background: 'linear-gradient(135deg, #b9bba0, var(--color-sage))', color: 'white' }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="flex-1">
          <div className="font-bold text-[20px]" style={{ color: 'var(--color-ink)' }}>
            {user ? `${user.firstName} ${user.lastName}` : ''}
          </div>
          <div className="text-[13.5px] mt-[3px]" style={{ color: 'var(--color-ink-soft)' }}>
            {user?.email ?? ''}
          </div>
        </div>
        <button
          onClick={() => onNavigate('profile')}
          className="font-semibold text-[13px] px-4 py-[9px] rounded-full border transition-colors hover:border-[var(--color-ink)]"
          style={{ borderColor: 'var(--color-line-2)', color: 'var(--color-ink)' }}
        >
          Editar perfil
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <button
            key={s.label}
            onClick={() => onNavigate(s.tab)}
            className="p-5 rounded-[20px] text-left transition-all hover:shadow-md"
            style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}
          >
            <div className="mb-3" style={{ color: 'var(--color-terra)' }}>{s.icon}</div>
            <div className="font-serif font-semibold text-[32px] leading-none">{s.value}</div>
            <div className="text-[13px] mt-[6px]" style={{ color: 'var(--color-ink-soft)' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-[13px] font-semibold mb-3 tracking-[.04em] uppercase" style={{ color: 'var(--color-ink-soft)' }}>
          Accesos rápidos
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Ver mis pedidos',      tab: 'orders'  as Tab },
            { label: 'Mis favoritos',         tab: 'favs'    as Tab },
            { label: 'Mis direcciones',       tab: 'address' as Tab },
            { label: 'Métodos de pago',       tab: 'payment' as Tab },
          ].map(item => (
            <button
              key={item.tab}
              onClick={() => onNavigate(item.tab)}
              className="flex items-center justify-between px-5 py-[13px] rounded-[14px] text-[14px] font-semibold border transition-all hover:border-[var(--color-ink)] hover:bg-white text-left"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink)', background: 'var(--color-paper)' }}
            >
              {item.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

/* ---- Página ---- */
export function AccountPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('orders')
  const user     = useAuthStore(selectUser)
  const clearSession = useAuthStore(s => s.clearSession)
  const navigate = useNavigate()

  useEffect(() => {
    const t = searchParams.get('tab') as Tab | null
    if (t && VALID_TABS.includes(t)) setTab(t)
  }, [searchParams])

  function handleLogout() {
    clearSession()
    navigate('/', { replace: true })
  }

  const PANELS: Record<Tab, React.ReactNode> = {
    overview: <OverviewPanel user={user} onNavigate={setTab} />,
    orders:   <OrdersPanel />,
    profile:  <ProfilePanel user={user} />,
    address:  <AddressPanel />,
    payment:  <PaymentPanel />,
    favs:     <FavsPanel />,
  }

  return (
    <div className="wrap-wide">
      <div className="pt-7">
        <h1 className="h1">Mi cuenta</h1>
      </div>

      <div
        className="grid gap-[40px] items-start py-8 pb-[90px]"
        style={{ gridTemplateColumns: '260px 1fr' }}
      >
        {/* Sidebar */}
        <aside className="sticky top-[96px]">
          {/* Profile card — click opens overview */}
          <button
            onClick={() => setTab('overview')}
            className="w-full flex gap-3 items-center p-4 rounded-[20px] mb-[18px] text-left transition-all hover:shadow-md"
            style={{
              border: `1px solid ${tab === 'overview' ? 'var(--color-ink)' : 'var(--color-line)'}`,
              background: tab === 'overview' ? 'var(--color-ink)' : 'var(--color-paper)',
            }}
            aria-current={tab === 'overview' ? 'page' : undefined}
          >
            <div
              className="w-12 h-12 rounded-full shrink-0 grid place-items-center text-[16px] font-bold"
              style={{
                background: tab === 'overview' ? 'rgba(255,255,255,0.15)' : PH_BG.sage,
                color: tab === 'overview' ? 'white' : 'white',
              }}
              aria-hidden="true"
            >
              {user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '?'}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[15px] truncate" style={{ color: tab === 'overview' ? 'white' : 'var(--color-ink)' }}>
                {user ? `${user.firstName} ${user.lastName}` : ''}
              </div>
              <div className="text-[12.5px] truncate" style={{ color: tab === 'overview' ? 'rgba(255,255,255,0.7)' : 'var(--color-ink-soft)' }}>
                {user?.email ?? ''}
              </div>
            </div>
          </button>

          <nav className="flex flex-col gap-[3px]" aria-label="Secciones de la cuenta">
            {NAV_ITEMS.map(({ tab: t, label, icon }) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex items-center gap-3 px-[14px] py-[11px] rounded-[10px] text-[14.5px] font-medium transition-colors text-left"
                style={
                  tab === t
                    ? { background: 'var(--color-ink)', color: 'var(--color-cream)' }
                    : { color: 'var(--color-ink-2)' }
                }
                aria-current={tab === t ? 'page' : undefined}
              >
                <span style={{ color: tab === t ? 'var(--color-cream)' : 'var(--color-ink-soft)' }}>{icon}</span>
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-[14px] py-[11px] rounded-[10px] text-[14.5px] font-medium mt-2 transition-colors hover:bg-[var(--color-cream-2)] w-full text-left"
              style={{ color: 'var(--color-terra)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              </svg>
              Cerrar sesión
            </button>
          </nav>
        </aside>

        {/* Panel content */}
        <main>{PANELS[tab]}</main>
      </div>
    </div>
  )
}

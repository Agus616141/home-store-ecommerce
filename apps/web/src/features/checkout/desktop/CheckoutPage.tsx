import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../../../shared/ui/Input'
import { ErrorMessage } from '../../../shared/ui/ErrorMessage'
import { formatPrice } from '../../../shared/lib/format-price'
import { useCheckoutController } from '../controllers/useCheckoutController'
import { useAuthStore, selectUser } from '../../../shared/stores/auth.store'
import type { CartItem } from '../../../shared/stores/cart.store'

type PayTab = 'card' | 'apple' | 'gpay' | 'klarna'

/* ---- Stepper ---- */
function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['Carrito', 'Información', 'Pago']
  return (
    <div className="flex items-center gap-[10px] mb-[34px]" role="list" aria-label="Pasos del checkout">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <div key={label} className="flex items-center gap-[10px]" role="listitem">
            <span
              className={`flex items-center gap-[9px] text-[14px] font-semibold`}
              style={{ color: active ? 'var(--color-ink)' : 'var(--color-ink-soft)' }}
            >
              <span
                className="w-[26px] h-[26px] rounded-full grid place-items-center text-[13px] border-[1.5px]"
                style={
                  done ? { background: 'var(--color-terra)', borderColor: 'var(--color-terra)', color: '#fff' }
                  : active ? { background: 'var(--color-ink)', borderColor: 'var(--color-ink)', color: 'var(--color-cream)' }
                  : { borderColor: 'var(--color-line-2)' }
                }
              >
                {done ? '✓' : n}
              </span>
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className="h-[1.5px] max-w-[50px] flex-1" style={{ background: 'var(--color-line-2)' }} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---- Order summary sidebar ---- */
function OrderSummary({ items, total }: { items: CartItem[]; total: number }) {
  const [coupon, setCoupon] = useState('')

  return (
    <aside
      className="border-l"
      style={{ background: 'var(--color-cream-2)', borderColor: 'var(--color-line)', padding: 'clamp(24px,4vw,56px) clamp(24px,4vw,56px) 80px' }}
    >
      <div className="sticky top-[42px] max-w-[380px]">
        <h2 className="h3 mb-4">Tu pedido</h2>

        {items.map(item => (
          <div key={item.productId} className="flex gap-[14px] items-center py-3">
            <div className="relative shrink-0">
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.name} className="w-[60px] h-[60px] rounded-[10px] object-cover" />
                : <div className="w-[60px] h-[60px] rounded-[10px]" style={{ background: 'linear-gradient(135deg, var(--color-cream-2), var(--color-line))' }} aria-hidden="true" />
              }
              <span
                className="absolute -top-2 -right-2 w-[22px] h-[22px] rounded-full grid place-items-center text-[11px] font-bold"
                style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
                aria-label={`cantidad: ${item.qty}`}
              >
                {item.qty}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px] leading-tight">{item.name}</div>
              <div className="text-[12.5px] mt-[3px]" style={{ color: 'var(--color-ink-soft)' }}>Cant. {item.qty}</div>
            </div>
            <span className="font-bold text-[14px] shrink-0 pl-2">{formatPrice(item.priceCents * item.qty)}</span>
          </div>
        ))}

        <hr className="my-[14px]" style={{ border: 0, borderTop: '1px solid var(--color-line)' }} />

        {/* Coupon */}
        <div className="flex gap-2 mb-[14px]">
          <input
            value={coupon} onChange={e => setCoupon(e.target.value)}
            placeholder="Código de descuento"
            className="flex-1 rounded-[6px] px-[14px] py-[10px] text-[14px] font-sans outline-none"
            style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line-2)' }}
          />
          <button
            className="shrink-0 px-4 py-[10px] rounded-full font-semibold text-[13px] border transition-colors hover:border-[var(--color-ink)]"
            style={{ borderColor: 'var(--color-line-2)', background: 'var(--color-paper)' }}
          >
            Aplicar
          </button>
        </div>

        {[
          { label: 'Subtotal', value: formatPrice(total) },
          { label: 'Envío', value: <span style={{ color: 'var(--color-ok)', fontWeight: 600 }}>Gratis</span> },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-[7px] text-[14.5px]">
            <span style={{ color: 'var(--color-ink-soft)' }}>{label}</span>
            <span>{value}</span>
          </div>
        ))}

        <hr className="my-[10px]" style={{ border: 0, borderTop: '1px solid var(--color-line)' }} />

        <div className="flex justify-between py-[14px] font-bold text-[20px]">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>


        <div
          className="flex gap-[10px] text-[12.5px] mt-[18px] pt-4"
          style={{ borderTop: '1px solid var(--color-line)', color: 'var(--color-ink-soft)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 mt-px" aria-hidden="true">
            <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/>
          </svg>
          Pago cifrado de extremo a extremo. Tus datos nunca se almacenan en nuestros servidores.
        </div>
      </div>
    </aside>
  )
}

/* ---- Página ---- */
export function CheckoutPage() {
  const vm = useCheckoutController()
  const user = useAuthStore(selectUser)
  const [payTab, setPayTab] = useState<PayTab>('card')

  async function handlePay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await vm.submitOrder({
      street:     (fd.get('street')     as string ?? '').trim(),
      city:       (fd.get('city')       as string ?? '').trim(),
      state:      (fd.get('state')      as string ?? '').trim(),
      postalCode: (fd.get('postalCode') as string ?? '').trim(),
      country:    (fd.get('country')    as string ?? 'AR').trim(),
      label:      'Principal',
    })
  }

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: '1fr 420px', minHeight: 'calc(100vh - 73px)' }}
    >
      {/* Main form */}
      <div
        className="max-w-[720px] ml-auto w-full"
        style={{ padding: 'clamp(24px,5vw,72px) clamp(24px,5vw,72px) 80px' }}
      >
        <Stepper step={2} />

        {/* Express pay */}
        <div className="grid grid-cols-2 gap-[10px] mb-[18px]">
          <button
            className="flex items-center justify-center gap-2 h-12 rounded-[10px] font-bold text-[14px] text-white border"
            style={{ background: '#000', borderColor: '#000' }}
          >
             Pay
          </button>
          <button
            className="flex items-center justify-center gap-2 h-12 rounded-[10px] font-bold text-[14px] border"
            style={{ background: '#fff', borderColor: 'var(--color-line-2)' }}
          >
            G Pay
          </button>
        </div>

        <div
          className="flex items-center gap-[14px] my-[18px] text-[13px]"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
          o paga con tarjeta
          <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
        </div>

        <form onSubmit={handlePay}>
          {/* Section 1 — Contact */}
          <div className="mb-[30px]">
            <h2 className="font-serif font-semibold text-[23px] mb-4 flex items-center gap-[10px]">
              <span className="font-sans text-[13px] w-6 h-6 rounded-full grid place-items-center font-bold" style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}>1</span>
              Contacto
            </h2>
            <Input name="email" type="email" placeholder="Correo electrónico" autoComplete="email" required defaultValue={user?.email ?? ''} />
            <label className="flex items-center gap-[9px] text-[13.5px] mt-3 cursor-pointer" style={{ color: 'var(--color-ink-2)' }}>
              <input type="checkbox" defaultChecked className="w-4 h-4" style={{ accentColor: 'var(--color-terra)' }} />
              Enviarme novedades y ofertas exclusivas
            </label>
          </div>

          {/* Section 2 — Shipping address */}
          <div className="mb-[30px]">
            <h2 className="font-serif font-semibold text-[23px] mb-4 flex items-center gap-[10px]">
              <span className="font-sans text-[13px] w-6 h-6 rounded-full grid place-items-center font-bold" style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}>2</span>
              Dirección de envío
            </h2>
            <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
              <Input name="firstName" placeholder="Nombre" autoComplete="given-name" required defaultValue={user?.firstName ?? ''} />
              <Input name="lastName" placeholder="Apellido" autoComplete="family-name" required defaultValue={user?.lastName ?? ''} />
            </div>
            <div className="mb-[14px]">
              <Input name="street" placeholder="Dirección" autoComplete="street-address" required />
            </div>
            <div className="mb-[14px]">
              <Input placeholder="Apartamento, suite, etc. (opcional)" />
            </div>
            <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
              <Input name="city" placeholder="Ciudad" autoComplete="address-level2" required />
              <Input name="state" placeholder="Provincia / Estado" autoComplete="address-level1" required />
            </div>
            <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
              <Input name="postalCode" placeholder="Código postal" autoComplete="postal-code" required />
              <div>
                <select
                  name="country"
                  className="w-full rounded-[6px] px-[14px] py-3 text-[15px] font-sans outline-none"
                  style={{ background: 'var(--color-paper)', border: '1px solid var(--color-line-2)', color: 'var(--color-ink)' }}
                >
                  <option value="AR">Argentina</option>
                  <option value="MX">México</option>
                  <option value="CO">Colombia</option>
                  <option value="CL">Chile</option>
                </select>
              </div>
            </div>
            <Input placeholder="Teléfono (para la entrega)" type="tel" autoComplete="tel" />
          </div>

          {/* Section 3 — Shipping method */}
          <div className="mb-[30px]">
            <h2 className="font-serif font-semibold text-[23px] mb-4 flex items-center gap-[10px]">
              <span className="font-sans text-[13px] w-6 h-6 rounded-full grid place-items-center font-bold" style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}>3</span>
              Método de envío
            </h2>
            {([
              { value: 'standard', label: 'Estándar · con armado', desc: '5–8 días hábiles', price: null },
            ] as const).map(opt => (
              <label
                key={opt.value}
                className="flex gap-3 items-center rounded-[12px] px-4 py-[14px] mb-[10px] cursor-pointer border-[1.5px] transition-colors"
                style={{
                  borderColor: 'var(--color-terra)',
                  background: 'color-mix(in srgb, var(--color-terra-soft) 30%, var(--color-paper))',
                }}
              >
                <input
                  type="radio" name="ship" value={opt.value}
                  checked
                  readOnly
                  className="mt-px"
                  style={{ accentColor: 'var(--color-terra)' }}
                />
                <div className="flex-1">
                  <div className="font-semibold text-[14.5px]">{opt.label}</div>
                  <div className="text-[13px]" style={{ color: 'var(--color-ink-soft)' }}>{opt.desc}</div>
                </div>
                {opt.price === null
                  ? <span className="font-bold" style={{ color: 'var(--color-ok)' }}>Gratis</span>
                  : <span className="font-bold">{formatPrice(opt.price)}</span>
                }
              </label>
            ))}
          </div>

          {/* Section 4 — Payment */}
          <div className="mb-[30px]">
            <h2 className="font-serif font-semibold text-[23px] mb-4 flex items-center gap-[10px]">
              <span className="font-sans text-[13px] w-6 h-6 rounded-full grid place-items-center font-bold" style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}>4</span>
              Pago
            </h2>
            <div
              className="rounded-[12px] p-[18px] border-[1.5px]"
              style={{
                borderColor: 'var(--color-terra)',
                background: 'color-mix(in srgb, var(--color-terra-soft) 16%, #fff)',
              }}
            >
              <div className="flex justify-between items-center mb-[14px]">
                <strong className="text-[14px]">Datos de pago</strong>
                <span className="mono" style={{ color: 'var(--color-terra)' }}>▦ Stripe Payment Element</span>
              </div>

              {/* Payment method tabs */}
              <div className="flex gap-2 mb-[14px]">
                {(['card', 'apple', 'gpay', 'klarna'] as PayTab[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPayTab(t)}
                    className="flex-1 border rounded-[8px] p-[10px] text-center text-[12.5px] font-semibold flex flex-col gap-1 items-center transition-all"
                    style={payTab === t
                      ? { borderColor: 'var(--color-ink)', boxShadow: '0 0 0 1px var(--color-ink)', background: '#fff' }
                      : { borderColor: 'var(--color-line-2)', background: '#fff' }
                    }
                  >
                    {t === 'card' ? (
                      <svg width="20" height="14" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                        <rect x="1" y="1" width="22" height="14" rx="2"/><path d="M1 5h22"/>
                      </svg>
                    ) : null}
                    {t === 'card' ? 'Tarjeta' : t === 'apple' ? ' Pay' : t === 'gpay' ? 'G Pay' : 'Klarna'}
                  </button>
                ))}
              </div>

              {/* Mock Stripe fields */}
              <div
                className="flex justify-between items-center rounded-[8px] px-[14px] py-[13px] text-[14px] mb-[10px]"
                style={{ background: '#fff', border: '1px solid var(--color-line-2)', color: 'var(--color-ink-soft)' }}
              >
                <span>Número de tarjeta</span>
                <span className="mono">1234 5678 •••• ••••  💳</span>
              </div>
              <div className="grid grid-cols-2 gap-[10px]">
                {['MM / AA', 'CVC'].map(p => (
                  <div
                    key={p}
                    className="rounded-[8px] px-[14px] py-[13px] text-[14px]"
                    style={{ background: '#fff', border: '1px solid var(--color-line-2)', color: 'var(--color-ink-soft)' }}
                  >
                    {p}
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-[9px] text-[13px] mt-3 cursor-pointer" style={{ color: 'var(--color-ink-2)' }}>
                <input type="checkbox" defaultChecked className="w-4 h-4" style={{ accentColor: 'var(--color-terra)' }} />
                Usar la dirección de envío para facturación
              </label>
            </div>
          </div>

          {vm.hasStockIssues && (
            <div
              role="alert"
              className="flex items-start gap-[10px] p-[14px] rounded-[10px] text-[13.5px] font-semibold mb-1"
              style={{ background: 'color-mix(in srgb, var(--color-terra) 12%, white)', color: 'var(--color-terra)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
              Hay productos sin stock en tu carrito. Volvé al{' '}
              <Link to="/cart" className="underline">carrito</Link>{' '}y eliminálos para continuar.
            </div>
          )}

          {vm.error && <ErrorMessage message={vm.error} />}

          {/* Pay button */}
          <button
            type="submit"
            disabled={vm.loading || vm.isEmpty || vm.hasStockIssues}
            className="w-full flex items-center justify-center gap-3 h-[54px] text-[16px] font-semibold rounded-full transition-colors disabled:opacity-70 mt-2"
            style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
          >
            {vm.loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-cream/40 border-t-cream animate-spin" aria-hidden="true" />
                Procesando…
              </>
            ) : `Pagar ${formatPrice(vm.total)} →`}
          </button>
          <p className="text-center text-[12.5px] mt-[14px]" style={{ color: 'var(--color-ink-soft)' }}>
            Al pagar aceptas los{' '}
            <Link to="/404" className="underline" style={{ color: 'var(--color-ink-2)' }}>Términos</Link>
            {' '}y la{' '}
            <Link to="/404" className="underline" style={{ color: 'var(--color-ink-2)' }}>Política de Privacidad</Link>
            {' '}de Casa.
          </p>
        </form>
      </div>

      <OrderSummary items={vm.items} total={vm.total} />
    </div>
  )
}

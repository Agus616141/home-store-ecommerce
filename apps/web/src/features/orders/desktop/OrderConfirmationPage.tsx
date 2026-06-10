import { Link } from 'react-router-dom'
import { formatPrice } from '../../../shared/lib/format-price'

const ORDER_ITEMS = [
  { name: 'Silla de Acento León', variant: 'Crema Bouclé', price: 699, qty: 1, color: 'terra' },
  { name: 'Mesa de Centro Roble', variant: 'Roble natural', price: 420, qty: 1, color: 'sage' },
  { name: 'Lámpara de Pie Alga', variant: 'Negro mate', price: 680, qty: 2, color: 'base' },
]

const PH_BG: Record<string, string> = {
  terra: 'linear-gradient(135deg, var(--color-terra-soft), #d8a98c)',
  sage:  'linear-gradient(135deg, #b9bba0, var(--color-sage))',
  base:  'linear-gradient(135deg, var(--color-cream-2), var(--color-line))',
}

export function OrderConfirmationPage() {
  const subtotal = ORDER_ITEMS.reduce((s, i) => s + i.price, 0)
  const taxes = Math.round(subtotal * 0.08)
  const total = subtotal + taxes

  return (
    <div className="max-w-[760px] mx-auto" style={{ padding: 'clamp(40px,5vw,56px) clamp(20px,4vw,56px) 90px' }}>

      {/* Header */}
      <div className="text-center">
        <div
          className="w-[84px] h-[84px] rounded-full grid place-items-center mx-auto mb-6"
          style={{
            background: 'color-mix(in srgb, var(--color-ok) 14%, var(--color-paper))',
            animation: 'pop .5s cubic-bezier(.2,.9,.3,1.4)',
          }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--color-ok)" strokeWidth="2.2" aria-hidden="true">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <span className="eyebrow">Pedido confirmado</span>
        <h1 className="h1 mt-2">¡Gracias por tu compra!</h1>
        <p className="lead mt-3 max-w-[480px] mx-auto">
          Tu pedido está en camino de ser preparado. Te enviamos la confirmación a{' '}
          <strong>agustin@correo.com</strong>.
        </p>
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold mt-2"
          style={{ background: 'var(--color-cream-2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 2h9l4 4v16H6z"/><path d="M9 11h7M9 15h7"/>
          </svg>
          Pedido #CASA-1043
        </div>
      </div>

      {/* Delivery estimate */}
      <div
        className="flex gap-4 items-center rounded-[20px] p-[18px_22px] mt-[30px]"
        style={{ border: '1px dashed var(--color-line-2)', background: 'var(--color-cream-2)' }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-terra)" strokeWidth="1.4" className="shrink-0" aria-hidden="true">
          <rect x="1" y="6" width="14" height="11" rx="1"/><path d="M15 9h4l3 3v5h-7z"/>
          <circle cx="6" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>
        </svg>
        <div>
          <div className="text-[13px]" style={{ color: 'var(--color-ink-soft)' }}>Entrega estimada · con armado incluido</div>
          <div className="font-serif font-semibold text-[24px]">22 – 25 de agosto</div>
        </div>
        <Link
          to="/account"
          className="ml-auto font-semibold text-[14px] px-[26px] py-[11px] rounded-full border transition-colors hover:border-[var(--color-ink)]"
          style={{ borderColor: 'var(--color-line-2)' }}
        >
          Rastrear pedido
        </Link>
      </div>

      {/* Order summary card */}
      <div
        className="mt-9 rounded-[20px] overflow-hidden"
        style={{ border: '1px solid var(--color-line)' }}
      >
        <div
          className="flex justify-between items-center px-6 py-[18px] border-b"
          style={{ background: 'var(--color-cream-2)', borderColor: 'var(--color-line)' }}
        >
          <strong>Resumen del pedido</strong>
          <span className="mono" style={{ color: 'var(--color-ink-soft)' }}>{ORDER_ITEMS.length} artículos</span>
        </div>

        {ORDER_ITEMS.map(item => (
          <div key={item.name} className="flex gap-[14px] items-center px-6 py-[14px] border-b" style={{ background: 'var(--color-paper)', borderColor: 'var(--color-line)' }}>
            <div className="relative shrink-0">
              <div className="w-[58px] h-[58px] rounded-[10px]" style={{ background: PH_BG[item.color] }} aria-hidden="true" />
              {item.qty > 1 && (
                <span
                  className="absolute -top-[7px] -right-[7px] w-[21px] h-[21px] rounded-full grid place-items-center text-[11px] font-bold"
                  style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
                >
                  {item.qty}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[14.5px]">{item.name}</div>
              <div className="text-[12.5px] mt-[3px]" style={{ color: 'var(--color-ink-soft)' }}>{item.variant}</div>
            </div>
            <span className="font-bold">{formatPrice(item.price)}</span>
          </div>
        ))}

        <div className="px-6 py-[18px]" style={{ background: 'var(--color-paper)' }}>
          {[
            { label: 'Subtotal', value: formatPrice(subtotal) },
            { label: 'Envío', value: <span style={{ color: 'var(--color-ok)', fontWeight: 600 }}>Gratis</span> },
            { label: 'Impuestos', value: formatPrice(taxes) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-[5px] text-[14.5px]">
              <span style={{ color: 'var(--color-ink-soft)' }}>{label}</span>
              <span>{value}</span>
            </div>
          ))}
          <hr className="my-[10px]" style={{ border: 0, borderTop: '1px solid var(--color-line)' }} />
          <div className="flex justify-between py-3 font-bold text-[19px]">
            <span>Total pagado</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="mono mt-2" style={{ color: 'var(--color-ink-soft)' }}>
            Pagado con Visa •••• 4242 vía Stripe
          </div>
        </div>
      </div>

      {/* What's next steps */}
      <div className="grid grid-cols-3 gap-4 mt-[30px] max-sm:grid-cols-1">
        {[
          {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 8 9 6 9-6"/></svg>,
            title: 'Revisa tu correo',
            desc: 'Enviamos la confirmación y la factura a tu email.',
          },
          {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.2-8.5"/><path d="m9 11 3 3 8-8"/></svg>,
            title: 'Preparamos tu pedido',
            desc: 'Te avisaremos cuando salga del taller.',
          },
          {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
            title: 'Rastrea el envío',
            desc: 'Sigue tu pedido en tiempo real desde tu cuenta.',
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="rounded-[20px] p-5" style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}>
            <div
              className="w-10 h-10 rounded-[10px] grid place-items-center mb-3"
              style={{ background: 'var(--color-cream-2)', color: 'var(--color-terra)' }}
            >
              {icon}
            </div>
            <h3 className="font-semibold text-[15px] mb-[6px]">{title}</h3>
            <p className="text-[13px]" style={{ color: 'var(--color-ink-soft)' }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex gap-3 justify-center mt-[38px] flex-wrap">
        <Link
          to="/account"
          className="inline-flex items-center justify-center font-semibold text-[15.5px] px-[34px] py-[16px] rounded-full transition-colors"
          style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
        >
          Ver mis pedidos
        </Link>
        <Link
          to="/catalog"
          className="inline-flex items-center justify-center font-semibold text-[15.5px] px-[34px] py-[16px] rounded-full border transition-colors hover:border-[var(--color-ink)]"
          style={{ borderColor: 'var(--color-line-2)' }}
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}

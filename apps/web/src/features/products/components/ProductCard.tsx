import { Link } from 'react-router-dom'
import { formatPrice } from '../../../shared/lib/format-price'
import { useAuthStore, selectIsAuthenticated } from '../../../shared/stores/auth.store'
import { useWishlistStore } from '../../../shared/stores/wishlist.store'
import { ImgSlot } from '../../../shared/ui/ImgSlot'
import { useState } from 'react'

export interface ProductCardData {
  id: string
  slug: string
  name: string
  priceCents: number
  imageUrl?: string
  badge?: 'sale' | 'new'
  swatches?: string[]
}

interface ProductCardProps {
  product: ProductCardData
  onAddToCart?: (id: string) => void
  slotNumber?: number
  priority?: boolean
}

// Clean heart path (Feather Icons)
const HEART_PATH =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'

export function ProductCard({ product, onAddToCart, slotNumber, priority = false }: ProductCardProps) {
  const { id, slug, name, priceCents, imageUrl, badge, swatches } = product
  const [imageFailed, setImageFailed] = useState(false)

  const isAuth = useAuthStore(selectIsAuthenticated)
  const wishlistItems = useWishlistStore(s => s.items)
  const addToWishlist = useWishlistStore(s => s.add)
  const removeFromWishlist = useWishlistStore(s => s.remove)
  const faved = wishlistItems.some(i => i.productId === id)

  async function handleFav(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Invitado: no hacer nada. Sin redirect y sin marcar el botón como seleccionado.
    if (!isAuth) return
    if (faved) await removeFromWishlist(id)
    else await addToWishlist(id)
  }

  return (
    <article className="flex flex-col gap-[14px]">
      {/* Media */}
      <div
        className="relative rounded-[12px] overflow-hidden group"
        style={{ background: 'var(--color-cream-2)' }}
      >
        <Link to={`/product/${slug}`} tabIndex={-1} aria-hidden="true">
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={name}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'auto'}
              onError={() => setImageFailed(true)}
              className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <ImgSlot n={slotNumber ?? 25} className="aspect-[3/4] w-full" />
          )}
        </Link>

        {/* Badge */}
        {badge === 'sale' && (
          <span
            className="absolute top-[14px] left-[14px] z-10 text-[11.5px] font-bold tracking-[.04em] uppercase px-[10px] py-[5px] rounded-[6px] text-white"
            style={{ background: 'var(--color-terra)' }}
          >
            Oferta
          </span>
        )}
        {badge === 'new' && (
          <span
            className="absolute top-[14px] left-[14px] z-10 text-[11.5px] font-bold tracking-[.04em] uppercase px-[10px] py-[5px] rounded-[6px]"
            style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
          >
            Nuevo
          </span>
        )}

        {/* Fav button — always visible when faved, otherwise shows on hover */}
        <button
          type="button"
          onClick={handleFav}
          aria-label={faved ? `Quitar ${name} de favoritos` : `Agregar ${name} a favoritos`}
          aria-pressed={faved}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1.5px solid ${faved ? 'var(--color-terra)' : 'var(--color-line)'}`,
            background: 'color-mix(in srgb, var(--color-paper) 85%, transparent)',
            color: faved ? 'var(--color-terra)' : 'var(--color-ink-soft)',
            opacity: faved ? 1 : 0,
            transition: 'opacity 200ms, border-color 200ms, color 200ms',
          }}
          className="group-hover:!opacity-100"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={faved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
            style={{ display: 'block', flexShrink: 0 }}
            aria-hidden="true"
          >
            <path d={HEART_PATH} />
          </svg>
        </button>

        {/* Quick add */}
        {onAddToCart && (
          <div className="absolute left-[14px] right-[14px] bottom-[14px] z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[220ms]">
            <button
              type="button"
              onClick={() => onAddToCart(id)}
              className="w-full py-2 px-4 rounded-full text-[13px] font-semibold border transition-colors hover:bg-white"
              style={{
                background: 'var(--color-paper)',
                borderColor: 'var(--color-line)',
                color: 'var(--color-ink)',
              }}
            >
              Agregar rápido
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-[6px]">
        <Link
          to={`/product/${slug}`}
          className="text-[16px] font-semibold tracking-[-0.01em] hover:text-[var(--color-terra)] transition-colors leading-tight"
          style={{ color: 'var(--color-ink)' }}
        >
          {name}
        </Link>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[16px] font-bold">{formatPrice(priceCents)}</span>
          {swatches && swatches.length > 0 && (
            <div className="flex gap-[6px]" aria-label="Colores disponibles">
              {swatches.map(color => (
                <span
                  key={color}
                  className="w-[15px] h-[15px] rounded-full border-[1.5px] border-white"
                  style={{ background: color, boxShadow: '0 0 0 1px var(--color-line-2)' }}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

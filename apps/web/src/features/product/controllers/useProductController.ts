import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productsApi, cartApi } from '../../../shared/api/endpoints'
import { useCartStore } from '../../../shared/stores/cart.store'
import { useAuthStore, selectIsAuthenticated } from '../../../shared/stores/auth.store'
import { useStockStore } from '../../../shared/stores/stock.store'
import { ApiError } from '../../../shared/api/client'
import type { ProductDetail } from '../../../shared/api/dto.types'

export function useProductController(slug: string) {
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const cartAddItem = useCartStore((s) => s.addItem)
  const syncFromBackend = useCartStore((s) => s.syncFromBackend)
  const isAuth = useAuthStore(selectIsAuthenticated)
  const liveStock = useStockStore((s) => (product ? s.overrides[product.id] : undefined))
  const navigate = useNavigate()

  // Stock efectivo: el override en vivo del stream si llegó, si no el del fetch.
  const effectiveProduct =
    product && liveStock !== undefined ? { ...product, stock: liveStock } : product

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    setError('')
    setProduct(null)
    productsApi
      .getBySlug(slug)
      .then((p) => {
        if (!cancelled) setProduct(p)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'No pudimos cargar el producto.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  function addToCart() {
    if (!product) return
    if (!isAuth) {
      navigate('/auth', { state: { from: { pathname: `/product/${product.slug}` } } })
      return
    }
    // Optimistic update
    const prevItems = useCartStore.getState().items
    for (let i = 0; i < qty; i++) {
      cartAddItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.priceCents,
        imageUrl: product.images[0]?.url ?? '',
      })
    }
    // Backend sync
    cartApi.addItem(product.id, qty)
      .then(cart => syncFromBackend(cart.items))
      .catch(() => useCartStore.setState({ items: prevItems }))
  }

  return {
    product: effectiveProduct,
    loading,
    error,
    qty,
    setQty,
    addToCart,
    canAddToCart: !!effectiveProduct && effectiveProduct.stock > 0,
  }
}

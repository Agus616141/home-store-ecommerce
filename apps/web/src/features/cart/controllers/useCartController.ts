import { useEffect } from 'react'
import {
  useCartStore,
  selectCartItems,
  selectCartCount,
  selectCartTotal,
  type CartItem,
} from '../../../shared/stores/cart.store'
import { useAuthStore, selectIsAuthenticated } from '../../../shared/stores/auth.store'
import { useStockStore } from '../../../shared/stores/stock.store'
import { cartApi } from '../../../shared/api/endpoints'

// Un ítem tiene problema de stock si no hay disponible (0) o si se pidió más de lo que hay.
export function itemStockIssue(item: CartItem): 'none' | 'out' | 'partial' {
  if (item.stock === undefined) return 'none'
  if (item.stock <= 0) return 'out'
  if (item.qty > item.stock) return 'partial'
  return 'none'
}

export function useCartController() {
  const rawItems = useCartStore(selectCartItems)
  const count = useCartStore(selectCartCount)
  const total = useCartStore(selectCartTotal)
  const zustandSetQty = useCartStore((s) => s.setQty)
  const zustandRemoveItem = useCartStore((s) => s.removeItem)
  const syncFromBackend = useCartStore((s) => s.syncFromBackend)
  const isAuth = useAuthStore(selectIsAuthenticated)
  const overrides = useStockStore((s) => s.overrides)

  // Aplicar el stock en vivo del stream SSE sobre los items del carrito.
  const items = rawItems.map((i) =>
    overrides[i.productId] !== undefined ? { ...i, stock: overrides[i.productId] } : i,
  )

  // Sincronizar con el backend al montar para tener stock actualizado.
  useEffect(() => {
    if (!isAuth) return
    cartApi.get()
      .then((cart) => syncFromBackend(cart.items))
      .catch(() => {})
  }, [isAuth, syncFromBackend])

  function setQty(productId: string, qty: number) {
    zustandSetQty(productId, qty)
    const apiCall = qty <= 0
      ? cartApi.removeItem(productId)
      : cartApi.updateItem(productId, qty)
    apiCall
      .then(cart => syncFromBackend(cart.items))
      .catch(() => {})
  }

  function removeItem(productId: string) {
    zustandRemoveItem(productId)
    cartApi.removeItem(productId)
      .then(cart => syncFromBackend(cart.items))
      .catch(() => {})
  }

  // Bloquea el pago: hay al menos un ítem sin stock o con cantidad mayor a la disponible.
  const hasStockIssues = items.some((i) => itemStockIssue(i) !== 'none')

  return {
    items,
    isEmpty: items.length === 0,
    count,
    total,
    hasStockIssues,
    setQty,
    removeItem,
  }
}

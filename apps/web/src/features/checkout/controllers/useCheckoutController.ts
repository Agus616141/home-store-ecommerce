import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addressesApi, cartApi, ordersApi, paymentsApi } from '../../../shared/api/endpoints'
import { useCartStore, selectCartItems, selectCartTotal } from '../../../shared/stores/cart.store'
import { useAuthStore, selectIsAuthenticated } from '../../../shared/stores/auth.store'
import { useStockStore } from '../../../shared/stores/stock.store'
import { ApiError } from '../../../shared/api/client'
import { itemStockIssue } from '../../cart/controllers/useCartController'
import type { CreateAddressRequest } from '../../../shared/api/dto.types'

export function useCheckoutController() {
  const rawItems = useCartStore(selectCartItems)
  const total = useCartStore(selectCartTotal)
  const clearCart = useCartStore((s) => s.clearCart)
  const syncFromBackend = useCartStore((s) => s.syncFromBackend)
  const isAuth = useAuthStore(selectIsAuthenticated)
  const overrides = useStockStore((s) => s.overrides)
  const navigate = useNavigate()

  // Aplicar el stock en vivo del stream SSE sobre los items.
  const items = rawItems.map((i) =>
    overrides[i.productId] !== undefined ? { ...i, stock: overrides[i.productId] } : i,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sincronizar con el backend al montar para validar stock antes de pagar.
  useEffect(() => {
    if (!isAuth) return
    cartApi.get()
      .then((cart) => syncFromBackend(cart.items))
      .catch(() => {})
  }, [isAuth, syncFromBackend])

  const hasStockIssues = items.some((i) => itemStockIssue(i) !== 'none')

  async function submitOrder(addressData: CreateAddressRequest) {
    if (items.length === 0) return

    // No permitir pagar con productos sin stock.
    if (hasStockIssues) {
      setError('Hay productos sin stock en tu carrito. Eliminálos desde el carrito para continuar.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const { id: shippingAddressId } = await addressesApi.create({
        ...addressData,
        isDefault: true,
      })

      const { orderId } = await ordersApi.create({ shippingAddressId })

      // El pago debe confirmar. Si falla (p. ej. 409 por stock insuficiente u orden
      // ya pagada), el error se propaga al catch y NO navegamos a la página de éxito.
      const { checkoutUrl } = await paymentsApi.checkout(orderId)

      clearCart()
      // Ruta interna → navegación SPA (conserva el access token en memoria).
      // URL externa (Stripe) → redirección completa del navegador.
      if (checkoutUrl.startsWith('/')) {
        navigate(checkoutUrl, { replace: true })
      } else {
        window.location.href = checkoutUrl
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos procesar el pedido. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return {
    items,
    total,
    isEmpty: items.length === 0,
    hasStockIssues,
    loading,
    error,
    submitOrder,
  }
}

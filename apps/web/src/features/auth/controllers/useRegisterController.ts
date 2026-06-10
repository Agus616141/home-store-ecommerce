import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../../shared/api/endpoints'
import { useAuthStore } from '../../../shared/stores/auth.store'
import { useFavsStore } from '../../../shared/stores/favs.store'
import { useWishlistStore } from '../../../shared/stores/wishlist.store'
import { useCartStore } from '../../../shared/stores/cart.store'
import { ApiError } from '../../../shared/api/client'

export function useRegisterController() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  async function submit(firstName: string, lastName: string, email: string, password: string) {
    setError('')
    setLoading(true)
    try {
      const { user, accessToken } = await authApi.register({ firstName, lastName, email, password })
      // Clear local stores so they reflect empty server-side state until user adds items
      useFavsStore.getState().clearFavs()
      useCartStore.getState().clearCart()
      setSession(user, accessToken)
      useWishlistStore.getState().clearLocal()
      navigate('/account')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al crear la cuenta. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, submit }
}

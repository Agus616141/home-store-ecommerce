import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../../../shared/api/endpoints'
import { useAuthStore } from '../../../shared/stores/auth.store'
import { useFavsStore } from '../../../shared/stores/favs.store'
import { useWishlistStore } from '../../../shared/stores/wishlist.store'
import { useCartStore } from '../../../shared/stores/cart.store'
import { ApiError } from '../../../shared/api/client'

export function useLoginController() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  async function submit(email: string, password: string) {
    setError('')
    setLoading(true)
    try {
      const { user, accessToken } = await authApi.login({ email, password })
      // Clear local stores so they reflect empty server-side state until user adds items
      useFavsStore.getState().clearFavs()
      useCartStore.getState().clearCart()
      setSession(user, accessToken)
      useWishlistStore.getState().clearLocal()
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/account'
      navigate(from, { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al iniciar sesión. Revisá tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, submit }
}

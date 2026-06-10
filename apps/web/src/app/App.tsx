import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { tryRefresh } from '../shared/api/client'
import { authApi } from '../shared/api/endpoints'
import { useAuthStore } from '../shared/stores/auth.store'
import { useStockStream } from '../shared/realtime/useStockStream'

export function App() {
  // Stream SSE de stock en vivo — conexión única a nivel app (reemplaza el polling).
  useStockStream()

  useEffect(() => {
    let cancelled = false
    const { setUser, setAuthReady } = useAuthStore.getState()

    // Bootstrap de sesión: el access token vive solo en memoria, así que tras un
    // reload (p. ej. al volver del checkout) intentamos restaurarlo con el refresh
    // token (cookie httpOnly). Sin esto, cualquier ruta protegida rebota a /auth.
    async function bootstrap() {
      try {
        const refreshed = await tryRefresh()
        if (refreshed && !cancelled) {
          const { user } = await authApi.me()
          if (!cancelled) setUser(user)
        }
      } catch {
        // Invitado o cookie inválida — seguimos sin sesión, sin redirigir.
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    }

    void bootstrap()
    return () => { cancelled = true }
  }, [])

  return <RouterProvider router={router} />
}

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, selectIsAuthenticated, selectIsAdmin, selectAuthReady } from '../shared/stores/auth.store'
import { Spinner } from '../shared/ui/Spinner'

export function RequireAdmin() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAdmin = useAuthStore(selectIsAdmin)
  const authReady = useAuthStore(selectAuthReady)
  const location = useLocation()

  // Esperar el bootstrap de sesión para no rebotar durante un reload.
  if (!authReady) {
    return <div className="flex justify-center py-[80px]"><Spinner size="lg" /></div>
  }

  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

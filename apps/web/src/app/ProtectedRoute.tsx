import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, selectIsAuthenticated, selectAuthReady } from '../shared/stores/auth.store'
import { Spinner } from '../shared/ui/Spinner'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const authReady = useAuthStore(selectAuthReady)
  const location = useLocation()

  // Esperar a que el bootstrap de sesión termine antes de decidir, para no rebotar
  // a /auth mientras se restaura el token tras un reload.
  if (!authReady) {
    return <div className="flex justify-center py-[80px]"><Spinner size="lg" /></div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <Outlet />
}

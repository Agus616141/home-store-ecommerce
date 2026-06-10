import { create } from 'zustand'
import type { AuthUser } from '../api/dto.types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  // false hasta que el bootstrap de sesión (refresh silencioso al cargar la app) termina.
  // Los guards deben esperar a que sea true para no rebotar a /auth durante un reload.
  authReady: boolean
  setSession: (user: AuthUser, token: string) => void
  setAccessToken: (token: string) => void
  setUser: (user: AuthUser) => void
  setAuthReady: (ready: boolean) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  authReady: false,

  setSession: (user, token) => set({ user, accessToken: token }),

  setAccessToken: (token) => set({ accessToken: token }),

  setUser: (user) => set({ user }),

  setAuthReady: (ready) => set({ authReady: ready }),

  clearSession: () => set({ user: null, accessToken: null }),
}))

// Selectores derivados — usar con useAuthStore(selectX)
export const selectIsAuthenticated = (s: AuthState) => s.accessToken !== null
export const selectAuthReady = (s: AuthState) => s.authReady
export const selectIsAdmin = (s: AuthState) => s.user?.role === 'ADMIN'
export const selectUser = (s: AuthState) => s.user

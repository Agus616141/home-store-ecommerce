import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WishlistItem } from '../api/dto.types'
import { wishlistApi } from '../api/endpoints'

interface WishlistState {
  items: WishlistItem[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  add: (productId: string) => Promise<void>
  remove: (productId: string) => Promise<void>
  clear: () => Promise<void>
  clearLocal: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      loading: false,
      error: null,

      fetch: async () => {
        set({ loading: true, error: null })
        try {
          const res = await wishlistApi.get()
          set({ items: res.items, loading: false })
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Error al cargar la lista de deseos'
          set({ error: msg, loading: false })
        }
      },

      add: async (productId: string) => {
        set({ loading: true, error: null })
        try {
          const res = await wishlistApi.add(productId)
          set({ items: res.items, loading: false })
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'No se pudo agregar a la lista de deseos'
          set({ error: msg, loading: false })
        }
      },

      remove: async (productId: string) => {
        set({ loading: true, error: null })
        try {
          const res = await wishlistApi.remove(productId)
          set({ items: res.items, loading: false })
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'No se pudo eliminar de la lista de deseos'
          set({ error: msg, loading: false })
        }
      },

      clear: async () => {
        set({ loading: true, error: null })
        try {
          await wishlistApi.clear()
          set({ items: [], loading: false })
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'No se pudo vaciar la lista de deseos'
          set({ error: msg, loading: false })
        }
      },

      clearLocal: () => set({ items: [], loading: false, error: null }),
    }),
    { name: 'homestore-wishlist' }
  )
)

// Selectors
export const selectWishlistItems = (s: WishlistState) => s.items
export const selectWishlistLoading = (s: WishlistState) => s.loading
export const selectWishlistError = (s: WishlistState) => s.error
export const selectWishlistCount = (s: WishlistState) => s.items.length

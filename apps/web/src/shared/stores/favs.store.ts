import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductCardData } from '../../features/products/components/ProductCard'

interface FavsState {
  items: ProductCardData[]
  toggle: (product: ProductCardData) => void
  has: (id: string) => boolean
  clearFavs: () => void
}

export const useFavsStore = create<FavsState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) =>
        set(s => ({
          items: s.items.some(i => i.id === product.id)
            ? s.items.filter(i => i.id !== product.id)
            : [...s.items, product],
        })),
      has: (id) => get().items.some(i => i.id === id),
      clearFavs: () => set({ items: [] }),
    }),
    { name: 'homestore-favs' },
  ),
)

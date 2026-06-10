import { create } from 'zustand'
import type { CartItemInput, BackendCartItem } from '../api/dto.types'

export interface CartItem extends CartItemInput {
  qty: number
  // Stock disponible según el backend. undefined si aún no se sincronizó.
  stock?: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItemInput) => void
  removeItem: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clearCart: () => void
  syncFromBackend: (items: BackendCartItem[]) => void
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],

  addItem: (input) =>
    set((s) => {
      const existing = s.items.find((i) => i.productId === input.productId)
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.productId === input.productId ? { ...i, qty: i.qty + 1 } : i,
          ),
        }
      }
      return { items: [...s.items, { ...input, qty: 1 }] }
    }),

  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

  setQty: (productId, qty) =>
    set((s) => ({
      items:
        qty <= 0
          ? s.items.filter((i) => i.productId !== productId)
          : s.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
    })),

  clearCart: () => set({ items: [] }),

  syncFromBackend: (backendItems) =>
    set({
      items: backendItems.map((i) => ({
        productId: i.productId,
        slug: i.product.slug,
        name: i.product.name,
        priceCents: i.product.priceCents,
        imageUrl: i.product.images[0]?.url ?? '',
        qty: i.quantity,
        stock: i.product.stock,
      })),
    }),
}))

// Selectores derivados
export const selectCartItems = (s: CartState) => s.items
export const selectCartCount = (s: CartState) => s.items.reduce((acc, i) => acc + i.qty, 0)
export const selectCartTotal = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.priceCents * i.qty, 0)

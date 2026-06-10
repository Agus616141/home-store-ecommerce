import { create } from 'zustand'

// Overrides de stock recibidos en vivo por el stream SSE (productId → stock actual).
// La UI resuelve el stock efectivo como: override ?? stock del fetch original.
interface StockState {
  overrides: Record<string, number>
  patch: (productId: string, stock: number) => void
  // Producto eliminado en el backend → lo tratamos como sin stock en cualquier lista
  // donde todavía aparezca, hasta el próximo fetch.
  markDeleted: (productId: string) => void
}

export const useStockStore = create<StockState>()((set) => ({
  overrides: {},

  patch: (productId, stock) =>
    set((s) => ({ overrides: { ...s.overrides, [productId]: stock } })),

  markDeleted: (productId) =>
    set((s) => ({ overrides: { ...s.overrides, [productId]: 0 } })),
}))

// Stock efectivo de un producto: el override en vivo si existe, si no el fallback del fetch.
export function resolveStock(overrides: Record<string, number>, productId: string, fallback: number): number {
  return overrides[productId] ?? fallback
}

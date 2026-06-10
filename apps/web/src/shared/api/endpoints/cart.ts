import { api } from '../client'
import type { BackendCart } from '../dto.types'

export const cartApi = {
  get: () =>
    api.get<{ cart: BackendCart }>('/api/cart').then(r => r.cart),

  addItem: (productId: string, quantity: number) =>
    api.post<{ cart: BackendCart }>('/api/cart/items', { productId, quantity })
      .then(r => r.cart),

  updateItem: (productId: string, quantity: number) =>
    api.patch<{ cart: BackendCart }>(`/api/cart/items/${productId}`, { quantity })
      .then(r => r.cart),

  removeItem: (productId: string) =>
    api.delete<{ cart: BackendCart }>(`/api/cart/items/${productId}`)
      .then(r => r.cart),

  clear: () =>
    api.delete<void>('/api/cart'),
}

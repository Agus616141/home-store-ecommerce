import { api } from '../client'
import type { WishlistResponse } from '../dto.types'

export const wishlistApi = {
  get: () =>
    api.get<{ wishlist: WishlistResponse }>('/api/wishlist')
      .then(r => r.wishlist),

  add: (productId: string) =>
    api.post<{ wishlist: WishlistResponse }>('/api/wishlist/items', { productId })
      .then(r => r.wishlist),

  remove: (productId: string) =>
    api.delete<{ wishlist: WishlistResponse }>(`/api/wishlist/items/${productId}`)
      .then(r => r.wishlist),

  clear: async () => {
    const wishlist = await wishlistApi.get()
    await Promise.all(wishlist.items.map(item => wishlistApi.remove(item.productId)))
    return { ...wishlist, items: [] }
  },
}

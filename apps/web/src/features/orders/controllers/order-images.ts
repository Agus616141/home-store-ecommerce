import { productsApi } from '../../../shared/api/endpoints'
import type { OrderDetail, OrderItem, OrderSummary } from '../../../shared/api/dto.types'

type OrderWithItems = OrderDetail | OrderSummary

async function getProductImageMap(items: OrderItem[]) {
  const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))]
  if (productIds.length === 0) return new Map<string, string>()

  const { products } = await productsApi.listAll({ limit: 100 })
  return new Map(
    products
      .filter((product) => productIds.includes(product.id))
      .map((product) => [product.id, product.images[0]?.url ?? '']),
  )
}

export async function withOrderItemImages<T extends OrderWithItems>(order: T): Promise<T> {
  const imageByProductId = await getProductImageMap(order.items ?? [])
  return {
    ...order,
    items: order.items?.map((item) => ({
      ...item,
      imageUrl: imageByProductId.get(item.productId) ?? item.imageUrl,
    })),
  }
}

export async function withOrdersItemImages<T extends OrderSummary>(orders: T[]): Promise<T[]> {
  const items = orders.flatMap((order) => order.items ?? [])
  const imageByProductId = await getProductImageMap(items)

  return orders.map((order) => ({
    ...order,
    items: order.items?.map((item) => ({
      ...item,
      imageUrl: imageByProductId.get(item.productId) ?? item.imageUrl,
    })),
  }))
}

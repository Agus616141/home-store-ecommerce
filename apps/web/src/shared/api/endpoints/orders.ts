import { api } from '../client'
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderDetail,
  OrderListResponse,
} from '../dto.types'

type CreateOrderApiResponse = CreateOrderResponse | { order: OrderDetail }

export const ordersApi = {
  list: (page = 1, limit = 10) =>
    api.get<OrderListResponse>(`/api/orders?page=${page}&limit=${limit}`),


  getById: (id: string) =>
    api.get<{ order: OrderDetail }>(`/api/orders/${id}`)
      .then(r => r.order),

  create: (body: CreateOrderRequest) =>
    api.post<CreateOrderApiResponse>('/api/orders', body)
      .then(res => ('orderId' in res ? res : { orderId: res.order.id })),
}

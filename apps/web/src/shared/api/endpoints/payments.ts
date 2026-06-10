import { api } from '../client'
import type { PaymentCheckoutResponse } from '../dto.types'

export const paymentsApi = {
  checkout: (orderId: string) =>
    api.post<PaymentCheckoutResponse>('/api/payments/checkout', { orderId }),
}

import { useState, useEffect } from 'react'
import { ordersApi } from '../../../shared/api/endpoints'
import { ApiError } from '../../../shared/api/client'
import type { OrderSummary } from '../../../shared/api/dto.types'
import { withOrdersItemImages } from './order-images'

export function useOrdersController() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    ordersApi
      .list(page)
      .then(async (res) => ({
        ...res,
        orders: await withOrdersItemImages(res.orders).catch(() => res.orders),
      }))
      .then((res) => {
        if (!cancelled) {
          setOrders(res.orders)
          setTotal(res.total)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'No pudimos cargar tus pedidos.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page])

  return { orders, total, page, setPage, loading, error, isEmpty: !loading && !error && orders.length === 0 }
}

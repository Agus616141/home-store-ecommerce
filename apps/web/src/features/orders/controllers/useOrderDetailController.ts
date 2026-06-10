import { useState, useEffect } from 'react'
import { ordersApi } from '../../../shared/api/endpoints'
import { ApiError } from '../../../shared/api/client'
import type { OrderDetail } from '../../../shared/api/dto.types'
import { withOrderItemImages } from './order-images'

export function useOrderDetailController(id: string) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError('')
    ordersApi
      .getById(id)
      .then((order) => withOrderItemImages(order).catch(() => order))
      .then((o) => {
        if (!cancelled) setOrder(o)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'No pudimos cargar el pedido.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return { order, loading, error }
}

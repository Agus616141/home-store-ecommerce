import { useEffect } from 'react'
import { API_BASE_URL } from '../api/client'
import { useStockStore } from '../stores/stock.store'

type DomainEvent =
  | { type: 'stock.changed'; productId: string; stock: number }
  | { type: 'product.created'; productId: string; slug: string; stock: number }
  | { type: 'product.updated'; productId: string; slug: string; stock: number }
  | { type: 'product.deleted'; productId: string }

const STREAM_URL = `${API_BASE_URL}/api/events/stream`

/**
 * Conexión única al stream de eventos del backend (SSE). Reemplaza el polling:
 * los productos se traen una vez y de ahí en más el stock se parchea con lo que
 * llega por el stream. Montar UNA sola vez a nivel app (App.tsx), nunca por componente.
 *
 * El stream es público (sin token) → EventSource sin withCredentials.
 * La reconexión y el heartbeat los maneja el navegador/el backend; no hacemos nada.
 */
export function useStockStream() {
  useEffect(() => {
    const es = new EventSource(STREAM_URL)

    es.onmessage = (e) => {
      let ev: DomainEvent
      try {
        ev = JSON.parse(e.data) as DomainEvent
      } catch {
        return // heartbeat u otro payload no-JSON → ignorar
      }

      const { patch, markDeleted } = useStockStore.getState()
      switch (ev.type) {
        case 'stock.changed':
        case 'product.updated':
        case 'product.created':
          patch(ev.productId, ev.stock)
          break
        case 'product.deleted':
          markDeleted(ev.productId)
          break
      }
    }

    // EventSource reintenta solo (retry: 5000 enviado por el backend) — no actuar.
    es.onerror = () => {}

    return () => es.close()
  }, [])
}

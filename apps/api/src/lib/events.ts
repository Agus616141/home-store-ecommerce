import { EventEmitter } from "node:events";

/**
 * Eventos de dominio que se empujan a los clientes vía SSE.
 * - stock.changed   → el stock de un producto cambió (venta, ajuste admin, etc.)
 * - product.created → se creó un producto nuevo
 * - product.updated → se actualizó un producto (incluye su stock actual)
 * - product.deleted → se dio de baja un producto
 */
export type DomainEvent =
  | { type: "stock.changed"; productId: string; stock: number }
  | { type: "product.created"; productId: string; slug: string; stock: number }
  | { type: "product.updated"; productId: string; slug: string; stock: number }
  | { type: "product.deleted"; productId: string };

const CHANNEL = "domain";

const emitter = new EventEmitter();
// Cada conexión SSE registra un listener. Permitimos muchas conexiones concurrentes
// sin el warning de "possible memory leak".
emitter.setMaxListeners(0);

/** Suscribe un listener al canal de eventos. Devuelve una función para desuscribir. */
export const onDomainEvent = (listener: (event: DomainEvent) => void): (() => void) => {
  emitter.on(CHANNEL, listener);
  return () => {
    emitter.off(CHANNEL, listener);
  };
};

/** Publica un evento de dominio a todos los clientes conectados. */
export const emitDomainEvent = (event: DomainEvent): void => {
  emitter.emit(CHANNEL, event);
};

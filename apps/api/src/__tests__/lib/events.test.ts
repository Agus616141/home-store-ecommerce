import { describe, it, expect, vi } from "vitest";
import { onDomainEvent, emitDomainEvent } from "../../lib/events.js";

describe("event bus", () => {
  it("entrega eventos a los suscriptores y deja de hacerlo al desuscribir", () => {
    const listener = vi.fn();
    const unsubscribe = onDomainEvent(listener);

    emitDomainEvent({ type: "stock.changed", productId: "p1", stock: 3 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ type: "stock.changed", productId: "p1", stock: 3 });

    unsubscribe();
    emitDomainEvent({ type: "stock.changed", productId: "p1", stock: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

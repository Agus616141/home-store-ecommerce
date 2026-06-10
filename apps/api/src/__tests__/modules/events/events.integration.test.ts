import { describe, it, expect } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../../app.js";
import { emitDomainEvent } from "../../../lib/events.js";

describe("GET /api/events/stream (SSE)", () => {
  it("envía cabeceras SSE y entrega los eventos emitidos al cliente", async () => {
    const server = app.listen(0);
    const { port } = server.address() as AddressInfo;

    const received = await new Promise<{ contentType?: string; data: string }>(
      (resolve, reject) => {
        const req = http.get({ host: "127.0.0.1", port, path: "/api/events/stream" }, (res) => {
          const contentType = res.headers["content-type"];
          let buf = "";
          res.on("data", (chunk: Buffer) => {
            buf += chunk.toString();
            if (buf.includes('"type":"stock.changed"')) {
              req.destroy();
              resolve({ contentType, data: buf });
            }
          });
          res.on("error", reject);

          // Con la conexión abierta (y el listener ya suscripto), emitimos un evento
          setTimeout(() => {
            emitDomainEvent({ type: "stock.changed", productId: "p_test_sse", stock: 7 });
          }, 50);
        });
        req.on("error", reject);
      },
    );

    server.close();

    expect(received.contentType).toContain("text/event-stream");
    expect(received.data).toContain('"productId":"p_test_sse"');
    expect(received.data).toContain('"stock":7');
  });
});

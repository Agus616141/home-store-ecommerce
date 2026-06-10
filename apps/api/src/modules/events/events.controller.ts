import type { Request, Response } from "express";
import { onDomainEvent } from "../../lib/events.js";

/**
 * Stream SSE de eventos de dominio (stock/productos en tiempo real).
 * No usa asyncHandler: es una conexión de larga duración que no debe terminar
 * con la respuesta. Público (el stock es información pública).
 */
export const stream = (req: Request, res: Response): void => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Evita el buffering de proxies inversos (nginx) sobre el stream
    "X-Accel-Buffering": "no",
  });

  // Si la conexión se corta, el cliente reintenta a los 5s
  res.write("retry: 5000\n\n");
  // Comentario inicial para abrir el stream de inmediato
  res.write(": connected\n\n");

  const unsubscribe = onDomainEvent((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  // Heartbeat para mantener viva la conexión a través de proxies/balanceadores
  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
};

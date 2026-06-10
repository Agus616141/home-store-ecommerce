import type { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import * as paymentsService from "./payments.service.js";
import type { CreateCheckoutDto } from "./payments.schema.js";
import { logger } from "../../lib/logger.js";

export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentsService.createCheckoutSession(
    req.user!.id,
    req.body as CreateCheckoutDto,
  );
  res.json({ status: "success", data: result });
});

// El webhook no usa asyncHandler — debe responder 2xx rápido y nunca tirar 5xx a Stripe
export const webhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"];

  if (!sig || typeof sig !== "string") {
    res.status(400).json({ status: "fail", message: "Falta stripe-signature header" });
    return;
  }

  try {
    await paymentsService.handleWebhookEvent(req.body as Buffer, sig);
    res.json({ received: true });
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
    const message = (err as Error).message ?? "Error procesando webhook";
    logger.error({ err }, "webhook error");
    // Solo 400 para firma inválida — el resto devuelve 200 para evitar reintentos de Stripe
    if (statusCode === 400) {
      res.status(400).json({ status: "fail", message });
      return;
    }
    res.json({ received: true });
  }
};

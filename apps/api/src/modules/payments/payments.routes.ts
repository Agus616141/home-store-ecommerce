import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { checkoutLimiter } from "../../middlewares/rateLimit.middleware.js";
import { CreateCheckoutSchema } from "./payments.schema.js";
import * as paymentsController from "./payments.controller.js";

export const paymentsRouter = Router();

// Checkout — requiere auth, body JSON normal
paymentsRouter.post(
  "/checkout",
  requireAuth,
  checkoutLimiter,
  validate(CreateCheckoutSchema),
  paymentsController.createCheckout,
);

// Webhook — sin auth, sin validate, body ya es raw Buffer (montado en app.ts antes de express.json)

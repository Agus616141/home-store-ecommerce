import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { eventsRouter } from "./modules/events/events.routes.js";
import * as paymentsController from "./modules/payments/payments.controller.js";

const app = express();

// Detrás del proxy de Railway/hosting: necesario para cookies Secure y para que
// el rate limit identifique la IP real del cliente (X-Forwarded-For).
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Orígenes permitidos por CORS: la URL canónica del front + extras (previews de Vercel)
const allowedOrigins = [
  env.CLIENT_URL,
  ...(env.CORS_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean) ?? []),
];

// Seguridad
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Logging HTTP
app.use(pinoHttp({ logger }));

// SSE: stream de eventos en tiempo real. Va ANTES del rate limit porque es una
// conexión persistente y no debe consumir el cupo de requests.
// También va ANTES de compression: comprimir un stream SSE lo bufferea y rompe
// la entrega en tiempo real.
app.use("/api/events", eventsRouter);

// Compresión gzip de las respuestas JSON (listados de productos, etc.).
// Reduce el payload ~70-85% — clave para la latencia percibida en producción.
app.use(compression());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentsController.webhook,
);

// Rate limit global
// Webhook de Stripe: raw body ANTES de express.json() — la verificación de firma lo requiere
// Parsers generales
app.use(express.json());
app.use(cookieParser());

// Rutas de la API
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { cartRouter } from "./modules/cart/cart.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { paymentsRouter } from "./modules/payments/payments.routes.js";
import { reviewsRouter, reviewActionsRouter } from "./modules/reviews/reviews.routes.js";
import { wishlistRouter } from "./modules/wishlist/wishlist.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/products/:productId/reviews", reviewsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/reviews", reviewActionsRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/analytics", analyticsRouter);

// Manejo de errores (siempre al final)
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;

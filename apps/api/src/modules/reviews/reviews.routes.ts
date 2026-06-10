import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { publicReadLimiter, userWriteLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  ListReviewsQuerySchema,
} from "./reviews.schema.js";
import * as reviewsController from "./reviews.controller.js";

export const reviewsRouter = Router({ mergeParams: true });

// Público: listar reseñas de un producto — montado en /api/products/:productId/reviews
reviewsRouter.get(
  "/",
  publicReadLimiter,
  validate(ListReviewsQuerySchema, "query"),
  reviewsController.listProductReviews,
);

// Autenticado: crear reseña
reviewsRouter.post(
  "/",
  requireAuth,
  userWriteLimiter,
  validate(CreateReviewSchema),
  reviewsController.createReview,
);

export const reviewActionsRouter = Router();

// Editar / borrar reseña propia (o admin borra cualquiera) — montado en /api/reviews
reviewActionsRouter.patch(
  "/:id",
  requireAuth,
  userWriteLimiter,
  validate(UpdateReviewSchema),
  reviewsController.updateReview,
);
reviewActionsRouter.delete("/:id", requireAuth, userWriteLimiter, reviewsController.deleteReview);

import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  adminLimiter,
  userReadLimiter,
  userWriteLimiter,
} from "../../middlewares/rateLimit.middleware.js";
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  ListOrdersQuerySchema,
} from "./orders.schema.js";
import * as ordersController from "./orders.controller.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

// Customer
ordersRouter.post("/", userWriteLimiter, validate(CreateOrderSchema), ordersController.createOrder);
ordersRouter.get(
  "/",
  userReadLimiter,
  validate(ListOrdersQuerySchema, "query"),
  ordersController.listOrders,
);
ordersRouter.get(
  "/admin",
  adminLimiter,
  requireRole("ADMIN"),
  validate(ListOrdersQuerySchema, "query"),
  ordersController.listAllOrders,
);
ordersRouter.get("/:id", userReadLimiter, ordersController.getOrder);
ordersRouter.patch("/:id/cancel", userWriteLimiter, ordersController.cancelOrder);

// Admin
ordersRouter.patch(
  "/:id/status",
  adminLimiter,
  requireRole("ADMIN"),
  validate(UpdateOrderStatusSchema),
  ordersController.updateOrderStatus,
);

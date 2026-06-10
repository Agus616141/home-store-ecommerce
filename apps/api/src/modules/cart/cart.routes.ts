import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { userReadLimiter, userWriteLimiter } from "../../middlewares/rateLimit.middleware.js";
import { AddItemSchema, UpdateItemSchema } from "./cart.schema.js";
import * as cartController from "./cart.controller.js";

export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get("/", userReadLimiter, cartController.getCart);
cartRouter.post("/items", userWriteLimiter, validate(AddItemSchema), cartController.addItem);
cartRouter.patch(
  "/items/:productId",
  userWriteLimiter,
  validate(UpdateItemSchema),
  cartController.updateItem,
);
cartRouter.delete("/items/:productId", userWriteLimiter, cartController.removeItem);
cartRouter.delete("/", userWriteLimiter, cartController.clearCart);

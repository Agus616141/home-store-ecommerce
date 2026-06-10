import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { userReadLimiter, userWriteLimiter } from "../../middlewares/rateLimit.middleware.js";
import { AddWishlistItemSchema } from "./wishlist.schema.js";
import * as wishlistController from "./wishlist.controller.js";

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);

wishlistRouter.get("/", userReadLimiter, wishlistController.getWishlist);
wishlistRouter.post(
  "/items",
  userWriteLimiter,
  validate(AddWishlistItemSchema),
  wishlistController.addItem,
);
wishlistRouter.delete("/items/:productId", userWriteLimiter, wishlistController.removeItem);

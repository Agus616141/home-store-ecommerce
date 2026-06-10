import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { adminLimiter, publicReadLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  ListProductsQuerySchema,
  CreateProductSchema,
  UpdateProductSchema,
  SetCategoriesSchema,
  AddImageSchema,
} from "./products.schema.js";
import * as productsController from "./products.controller.js";

export const productsRouter = Router();

const adminOnly = [requireAuth, adminLimiter, requireRole("ADMIN")];

// Públicas
productsRouter.get(
  "/",
  publicReadLimiter,
  validate(ListProductsQuerySchema, "query"),
  productsController.listProducts,
);
productsRouter.get("/featured", publicReadLimiter, productsController.getFeaturedProduct);
productsRouter.get("/:slug", publicReadLimiter, productsController.getProductBySlug);

// Admin — producto
productsRouter.post(
  "/",
  ...adminOnly,
  validate(CreateProductSchema),
  productsController.createProduct,
);
productsRouter.patch(
  "/:id",
  ...adminOnly,
  validate(UpdateProductSchema),
  productsController.updateProduct,
);
productsRouter.delete("/:id", ...adminOnly, productsController.deleteProduct);

// Admin — categorías del producto
productsRouter.put(
  "/:id/categories",
  ...adminOnly,
  validate(SetCategoriesSchema),
  productsController.setProductCategories,
);

// Admin — imágenes del producto
productsRouter.post(
  "/:id/images",
  ...adminOnly,
  validate(AddImageSchema),
  productsController.addProductImage,
);
productsRouter.delete("/:id/images/:imageId", ...adminOnly, productsController.deleteProductImage);

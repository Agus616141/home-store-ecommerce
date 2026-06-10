import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { adminLimiter, publicReadLimiter } from "../../middlewares/rateLimit.middleware.js";
import { CreateCategorySchema, UpdateCategorySchema } from "./categories.schema.js";
import * as categoriesController from "./categories.controller.js";

export const categoriesRouter = Router();

// Públicas
categoriesRouter.get("/", publicReadLimiter, categoriesController.listCategories);
categoriesRouter.get("/tree", publicReadLimiter, categoriesController.getCategoryTree);
categoriesRouter.get("/:slug", publicReadLimiter, categoriesController.getCategoryBySlug);

// Admin
categoriesRouter.post(
  "/",
  requireAuth,
  adminLimiter,
  requireRole("ADMIN"),
  validate(CreateCategorySchema),
  categoriesController.createCategory,
);
categoriesRouter.patch(
  "/:id",
  requireAuth,
  adminLimiter,
  requireRole("ADMIN"),
  validate(UpdateCategorySchema),
  categoriesController.updateCategory,
);
categoriesRouter.delete(
  "/:id",
  requireAuth,
  adminLimiter,
  requireRole("ADMIN"),
  categoriesController.deleteCategory,
);

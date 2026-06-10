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
  UpdateProfileSchema,
  ChangePasswordSchema,
  CreateAddressSchema,
  UpdateAddressSchema,
  AdminListUsersQuerySchema,
  AdminUpdateUserSchema,
} from "./users.schema.js";
import * as usersController from "./users.controller.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// Admin — usuarios
usersRouter.get(
  "/admin",
  adminLimiter,
  requireRole("ADMIN"),
  validate(AdminListUsersQuerySchema, "query"),
  usersController.adminListUsers,
);
usersRouter.get("/admin/:id", adminLimiter, requireRole("ADMIN"), usersController.adminGetUser);
usersRouter.patch(
  "/admin/:id",
  adminLimiter,
  requireRole("ADMIN"),
  validate(AdminUpdateUserSchema),
  usersController.adminUpdateUser,
);

// Perfil
usersRouter.get("/me", userReadLimiter, usersController.getProfile);
usersRouter.patch(
  "/me",
  userWriteLimiter,
  validate(UpdateProfileSchema),
  usersController.updateProfile,
);
usersRouter.patch(
  "/me/password",
  userWriteLimiter,
  validate(ChangePasswordSchema),
  usersController.changePassword,
);

// Direcciones
usersRouter.get("/me/addresses", userReadLimiter, usersController.listAddresses);
usersRouter.post(
  "/me/addresses",
  userWriteLimiter,
  validate(CreateAddressSchema),
  usersController.createAddress,
);
usersRouter.patch(
  "/me/addresses/:id",
  userWriteLimiter,
  validate(UpdateAddressSchema),
  usersController.updateAddress,
);
usersRouter.delete("/me/addresses/:id", userWriteLimiter, usersController.deleteAddress);
usersRouter.patch("/me/addresses/:id/default", userWriteLimiter, usersController.setDefaultAddress);

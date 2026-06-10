import { Router } from "express";

import { validate } from "../../middlewares/validate.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  loginLimiter,
  refreshLimiter,
  registerLimiter,
  userReadLimiter,
} from "../../middlewares/rateLimit.middleware.js";
import { RegisterSchema, LoginSchema } from "./auth.schema.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", registerLimiter, validate(RegisterSchema), authController.register);
authRouter.post("/login", loginLimiter, validate(LoginSchema), authController.login);
authRouter.post("/refresh", refreshLimiter, authController.refresh);
authRouter.post("/logout", requireAuth, userReadLimiter, authController.logout);
authRouter.get("/me", requireAuth, userReadLimiter, authController.me);

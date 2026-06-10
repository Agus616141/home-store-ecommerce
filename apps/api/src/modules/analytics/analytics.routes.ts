import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimit.middleware.js";
import * as analyticsController from "./analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth, adminLimiter, requireRole("ADMIN"));

analyticsRouter.get("/overview", analyticsController.getOverview);
analyticsRouter.get("/orders", analyticsController.getOrdersByStatus);
analyticsRouter.get("/products/top", analyticsController.getTopProducts);

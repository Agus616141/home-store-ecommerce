import type { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import * as analyticsService from "./analytics.service.js";

export const getOverview = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getOverview();
  res.json({ status: "success", data });
});

export const getOrdersByStatus = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getOrdersByStatus();
  res.json({ status: "success", data: { ordersByStatus: data } });
});

export const getTopProducts = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getTopProducts();
  res.json({ status: "success", data: { topProducts: data } });
});

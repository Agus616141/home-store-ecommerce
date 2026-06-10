import type { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { normalizeAssetUrls } from "../../lib/assets.js";
import * as cartService from "./cart.service.js";
import type { AddItemDto, UpdateItemDto } from "./cart.schema.js";

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.id);
  res.json({ status: "success", data: { cart: normalizeAssetUrls(cart, req) } });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.addItem(req.user!.id, req.body as AddItemDto);
  res.status(201).json({ status: "success", data: { cart: normalizeAssetUrls(cart, req) } });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateItem(
    req.user!.id,
    req.params["productId"] as string,
    req.body as UpdateItemDto,
  );
  res.json({ status: "success", data: { cart: normalizeAssetUrls(cart, req) } });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeItem(req.user!.id, req.params["productId"] as string);
  res.json({ status: "success", data: { cart: normalizeAssetUrls(cart, req) } });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  await cartService.clearCart(req.user!.id);
  res.status(204).send();
});

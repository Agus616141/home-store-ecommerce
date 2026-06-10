import type { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import * as wishlistService from "./wishlist.service.js";
import type { AddWishlistItemDto } from "./wishlist.schema.js";

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await wishlistService.getWishlist(req.user!.id);
  res.json({ status: "success", data: { wishlist } });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await wishlistService.addItem(req.user!.id, req.body as AddWishlistItemDto);
  res.status(201).json({ status: "success", data: { wishlist } });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await wishlistService.removeItem(
    req.user!.id,
    req.params["productId"] as string,
  );
  res.json({ status: "success", data: { wishlist } });
});

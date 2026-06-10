import type { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import * as reviewsService from "./reviews.service.js";
import type { CreateReviewDto, UpdateReviewDto, ListReviewsQueryDto } from "./reviews.schema.js";

export const listProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const result = await reviewsService.listProductReviews(
    req.params["productId"] as string,
    req.query as unknown as ListReviewsQueryDto,
  );
  res.json({ status: "success", data: result });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewsService.createReview(
    req.user!.id,
    req.params["productId"] as string,
    req.body as CreateReviewDto,
  );
  res.status(201).json({ status: "success", data: { review } });
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewsService.updateReview(
    req.user!.id,
    req.params["id"] as string,
    req.body as UpdateReviewDto,
  );
  res.json({ status: "success", data: { review } });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user?.role === "ADMIN";
  await reviewsService.deleteReview(req.user!.id, req.params["id"] as string, isAdmin);
  res.status(204).send();
});

import type { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { setCategoriesListCache } from "../../lib/cache.js";
import * as categoriesService from "./categories.service.js";
import type { CreateCategoryDto, UpdateCategoryDto } from "./categories.schema.js";

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoriesService.listCategories();
  setCategoriesListCache(res);
  res.json({ status: "success", data: { categories } });
});

export const getCategoryTree = asyncHandler(async (req: Request, res: Response) => {
  const tree = await categoriesService.getCategoryTree();
  res.json({ status: "success", data: { tree } });
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.getCategoryBySlug(req.params["slug"] as string);
  res.json({ status: "success", data: { category } });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.createCategory(req.body as CreateCategoryDto);
  res.status(201).json({ status: "success", data: { category } });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.updateCategory(
    req.params["id"] as string,
    req.body as UpdateCategoryDto,
  );
  res.json({ status: "success", data: { category } });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoriesService.deleteCategory(req.params["id"] as string);
  res.status(204).send();
});

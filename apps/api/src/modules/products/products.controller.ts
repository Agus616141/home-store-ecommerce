import type { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { setProductsListCache } from "../../lib/cache.js";
import * as productsService from "./products.service.js";
import type {
  ListProductsQueryDto,
  CreateProductDto,
  UpdateProductDto,
  SetCategoriesDto,
  AddImageDto,
} from "./products.schema.js";

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await productsService.listProducts(req.query as unknown as ListProductsQueryDto);
  setProductsListCache(res);
  res.json({ status: "success", data: result });
});

export const getFeaturedProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.getFeaturedProduct();
  res.json({ status: "success", data: { product: product ?? null } });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.getProductBySlug(req.params["slug"] as string);
  res.json({ status: "success", data: { product } });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.createProduct(req.body as CreateProductDto);
  res.status(201).json({ status: "success", data: { product } });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.updateProduct(
    req.params["id"] as string,
    req.body as UpdateProductDto,
  );
  res.json({ status: "success", data: { product } });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productsService.deleteProduct(req.params["id"] as string);
  res.status(204).send();
});

export const setProductCategories = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.setProductCategories(
    req.params["id"] as string,
    req.body as SetCategoriesDto,
  );
  res.json({ status: "success", data: { product } });
});

export const addProductImage = asyncHandler(async (req: Request, res: Response) => {
  const image = await productsService.addProductImage(
    req.params["id"] as string,
    req.body as AddImageDto,
  );
  res.status(201).json({ status: "success", data: { image } });
});

export const deleteProductImage = asyncHandler(async (req: Request, res: Response) => {
  await productsService.deleteProductImage(
    req.params["id"] as string,
    req.params["imageId"] as string,
  );
  res.status(204).send();
});

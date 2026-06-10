import { z } from "zod";

const slug = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug solo puede contener minúsculas, números y guiones");

const stringOrArray = z.preprocess(
  (v) => (Array.isArray(v) ? v : v !== undefined ? [v] : undefined),
  z.array(z.string()).optional(),
);

export const ListProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(128).optional(),
  categorySlug: z.string().optional(),
  categorySlugs: stringOrArray,
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  color: stringOrArray,
  material: stringOrArray,
});

const ImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(256).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(256),
  slug,
  description: z.string().max(4096).optional(),
  priceCents: z.number().int().min(0),
  stock: z.number().int().min(0).default(0),
  sku: z.string().max(128).optional(),
  isActive: z.boolean().default(true),
  color: z.string().max(64).optional(),
  material: z.string().max(64).optional(),
  isFeatured: z.boolean().default(false),
  images: z.array(ImageSchema).max(10).default([]),
  categoryIds: z.array(z.string()).default([]),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  slug: slug.optional(),
  description: z.string().max(4096).nullable().optional(),
  priceCents: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().max(128).nullable().optional(),
  isActive: z.boolean().optional(),
  color: z.string().max(64).nullable().optional(),
  material: z.string().max(64).nullable().optional(),
  isFeatured: z.boolean().optional(),
});

export const SetCategoriesSchema = z.object({
  categoryIds: z.array(z.string()),
});

export const AddImageSchema = ImageSchema;

export type ListProductsQueryDto = z.infer<typeof ListProductsQuerySchema>;
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type SetCategoriesDto = z.infer<typeof SetCategoriesSchema>;
export type AddImageDto = z.infer<typeof AddImageSchema>;

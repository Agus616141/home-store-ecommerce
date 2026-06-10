import { z } from "zod";

const slug = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug solo puede contener minúsculas, números y guiones");

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(128),
  slug,
  description: z.string().max(512).optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(128).optional(),
  slug: slug.optional(),
  description: z.string().max(512).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;

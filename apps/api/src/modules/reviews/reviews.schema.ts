import { z } from "zod";

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(128).optional(),
  body: z.string().max(2048).optional(),
});

export const UpdateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(128).nullable().optional(),
  body: z.string().max(2048).nullable().optional(),
});

export const ListReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewDto = z.infer<typeof UpdateReviewSchema>;
export type ListReviewsQueryDto = z.infer<typeof ListReviewsQuerySchema>;

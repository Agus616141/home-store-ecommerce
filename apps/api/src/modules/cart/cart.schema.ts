import { z } from "zod";

export const AddItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const UpdateItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

export type AddItemDto = z.infer<typeof AddItemSchema>;
export type UpdateItemDto = z.infer<typeof UpdateItemSchema>;

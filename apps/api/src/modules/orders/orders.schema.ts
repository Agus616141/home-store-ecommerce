import { z } from "zod";

export const CreateOrderSchema = z.object({
  shippingAddressId: z.string().optional(),
  notes: z.string().max(512).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

export const ListOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"])
    .optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;
export type ListOrdersQueryDto = z.infer<typeof ListOrdersQuerySchema>;

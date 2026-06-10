import { z } from "zod";

export const CreateCheckoutSchema = z.object({
  orderId: z.string().min(1),
});

export type CreateCheckoutDto = z.infer<typeof CreateCheckoutSchema>;

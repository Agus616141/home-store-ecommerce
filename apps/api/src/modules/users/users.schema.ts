import { z } from "zod";

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(64).optional(),
  lastName: z.string().min(1).max(64).optional(),
  phone: z.string().max(32).nullable().optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const CreateAddressSchema = z.object({
  label: z.string().max(64).optional(),
  street: z.string().min(1).max(256),
  city: z.string().min(1).max(128),
  state: z.string().min(1).max(128),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).default("AR"),
  isDefault: z.boolean().default(false),
});

export const UpdateAddressSchema = z.object({
  label: z.string().max(64).optional(),
  street: z.string().min(1).max(256).optional(),
  city: z.string().min(1).max(128).optional(),
  state: z.string().min(1).max(128).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  country: z.string().length(2).optional(),
  isDefault: z.boolean().optional(),
});

export const AdminListUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(128).optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
});

export const AdminUpdateUserSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
export type CreateAddressDto = z.infer<typeof CreateAddressSchema>;
export type UpdateAddressDto = z.infer<typeof UpdateAddressSchema>;
export type AdminListUsersQueryDto = z.infer<typeof AdminListUsersQuerySchema>;
export type AdminUpdateUserDto = z.infer<typeof AdminUpdateUserSchema>;

// Enums compartidos — alineados con schema.prisma
// Si cambia un valor acá, debe cambiar también en prisma/schema.prisma (mismo commit)

export const Role = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ShippingMethod = {
  STANDARD: "STANDARD",
  EXPRESS: "EXPRESS",
} as const;

export type ShippingMethod = (typeof ShippingMethod)[keyof typeof ShippingMethod];

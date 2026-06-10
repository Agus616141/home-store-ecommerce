import { prisma } from "../../lib/prisma.js";
import { appError } from "../../lib/errors.js";
import type { AddItemDto, UpdateItemDto } from "./cart.schema.js";

const cartInclude = {
  items: {
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

const getOrCreateCart = async (userId: string) => {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
};

const emptyCart = (userId: string) => ({ id: null, userId, items: [] });

export const getCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  if (!cart) return emptyCart(userId);
  return cart;
};

export const addItem = async (userId: string, data: AddItemDto) => {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, isActive: true, deletedAt: null },
  });
  if (!product) throw appError(404, "Producto no encontrado");
  if (product.stock < data.quantity) throw appError(409, "Stock insuficiente");

  const cart = await getOrCreateCart(userId);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: data.productId } },
  });

  if (existing) {
    const newQty = existing.quantity + data.quantity;
    if (product.stock < newQty) throw appError(409, "Stock insuficiente");
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId: data.productId, quantity: data.quantity },
    });
  }

  return prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
};

export const updateItem = async (userId: string, productId: string, data: UpdateItemDto) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw appError(404, "Carrito no encontrado");

  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (!item) throw appError(404, "Item no encontrado en el carrito");

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, deletedAt: null },
    select: { stock: true },
  });
  if (!product || product.stock < data.quantity) throw appError(409, "Stock insuficiente");

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: data.quantity } });

  return prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
};

export const removeItem = async (userId: string, productId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw appError(404, "Carrito no encontrado");

  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (!item) throw appError(404, "Item no encontrado en el carrito");

  return prisma.$transaction(async (tx) => {
    await tx.cartItem.delete({ where: { id: item.id } });

    const remainingItems = await tx.cartItem.count({ where: { cartId: cart.id } });
    if (remainingItems === 0) {
      await tx.cart.delete({ where: { id: cart.id } });
      return emptyCart(userId);
    }

    return tx.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
  });
};

export const clearCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return;
  await prisma.cart.delete({ where: { id: cart.id } });
};

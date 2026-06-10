import { prisma } from "../../lib/prisma.js";
import { appError } from "../../lib/errors.js";
import type { AddWishlistItemDto } from "./wishlist.schema.js";

const wishlistInclude = {
  items: {
    include: {
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

const getOrCreateWishlist = async (userId: string) => {
  const existing = await prisma.wishlist.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wishlist.create({ data: { userId } });
};

const emptyWishlist = (userId: string) => ({ id: null, userId, items: [] });

export const getWishlist = async (userId: string) => {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: wishlistInclude,
  });
  if (!wishlist) return emptyWishlist(userId);
  return wishlist;
};

export const addItem = async (userId: string, data: AddWishlistItemDto) => {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, isActive: true, deletedAt: null },
  });
  if (!product) throw appError(404, "Producto no encontrado");

  const wishlist = await getOrCreateWishlist(userId);

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId: data.productId } },
  });
  if (existing) throw appError(409, "El producto ya está en tu lista de deseos");

  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId: data.productId },
  });

  return prisma.wishlist.findUniqueOrThrow({
    where: { id: wishlist.id },
    include: wishlistInclude,
  });
};

export const removeItem = async (userId: string, productId: string) => {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) throw appError(404, "Lista de deseos no encontrada");

  const item = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });
  if (!item) throw appError(404, "Producto no encontrado en la lista de deseos");

  return prisma.$transaction(async (tx) => {
    await tx.wishlistItem.delete({ where: { id: item.id } });

    const remainingItems = await tx.wishlistItem.count({ where: { wishlistId: wishlist.id } });
    if (remainingItems === 0) {
      await tx.wishlist.delete({ where: { id: wishlist.id } });
      return emptyWishlist(userId);
    }

    return tx.wishlist.findUniqueOrThrow({ where: { id: wishlist.id }, include: wishlistInclude });
  });
};

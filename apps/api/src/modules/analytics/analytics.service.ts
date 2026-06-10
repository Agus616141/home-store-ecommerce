import { prisma } from "../../lib/prisma.js";

export const getOverview = async () => {
  const [totalOrders, totalUsers, totalProducts, revenueResult] = await prisma.$transaction([
    prisma.order.count({ where: { paymentStatus: "PAID" } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalCents: true },
    }),
  ]);

  return {
    totalOrders,
    totalUsers,
    totalProducts,
    totalRevenueCents: revenueResult._sum.totalCents ?? 0,
  };
};

export const getOrdersByStatus = async () => {
  const groups = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return groups.map((g) => ({ status: g.status, count: g._count._all }));
};

export const getTopProducts = async (limit = 10) => {
  const items = await prisma.orderItem.groupBy({
    by: ["productId", "productName"],
    _sum: { quantity: true, subtotalCents: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  return items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    totalQuantity: item._sum.quantity ?? 0,
    totalRevenueCents: item._sum.subtotalCents ?? 0,
  }));
};

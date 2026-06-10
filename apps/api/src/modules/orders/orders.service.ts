import { prisma } from "../../lib/prisma.js";
import { appError } from "../../lib/errors.js";
import { emitDomainEvent } from "../../lib/events.js";
import type { CreateOrderDto, UpdateOrderStatusDto, ListOrdersQueryDto } from "./orders.schema.js";

const orderInclude = {
  items: true,
} as const;

export const createOrder = async (userId: string, data: CreateOrderDto) => {
  const pendingOrder = await prisma.order.findFirst({
    where: { userId, status: "PENDING", paymentStatus: "PENDING" },
    select: { id: true },
  });
  if (pendingOrder) {
    throw appError(409, "Ya existe una orden pendiente de pago");
  }

  // 1. Cargar carrito con items y productos
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              priceCents: true,
              stock: true,
              isActive: true,
              deletedAt: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) throw appError(400, "El carrito está vacío");

  // 2. Validar stock y productos activos
  for (const item of cart.items) {
    if (!item.product || item.product.deletedAt || !item.product.isActive) {
      throw appError(409, `Producto no disponible: ${item.product?.name ?? item.productId}`);
    }
    if (item.product.stock < item.quantity) {
      throw appError(409, `Stock insuficiente para: ${item.product.name}`);
    }
  }

  // 3. Resolver snapshot de dirección (si se provee shippingAddressId)
  let shippingSnapshot: {
    shippingStreet?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPostalCode?: string;
    shippingCountry?: string;
  } = {};

  if (data.shippingAddressId) {
    const address = await prisma.address.findFirst({
      where: { id: data.shippingAddressId, userId },
    });
    if (!address) throw appError(404, "Dirección de envío no encontrada");
    shippingSnapshot = {
      shippingStreet: address.street,
      shippingCity: address.city,
      shippingState: address.state,
      shippingPostalCode: address.postalCode,
      shippingCountry: address.country,
    };
  }

  // 4. Calcular totales
  const subtotalCents = cart.items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );
  const totalCents = subtotalCents; // shippingCents y taxCents en 0 hasta que payments los calcule

  // 5. Crear orden pendiente. Stock y carrito se mutan solo cuando Stripe confirma el pago.
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        subtotalCents,
        totalCents,
        notes: data.notes,
        ...shippingSnapshot,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            unitPriceCents: item.product.priceCents,
            quantity: item.quantity,
            subtotalCents: item.product.priceCents * item.quantity,
          })),
        },
      },
      include: orderInclude,
    });

    return order;
  });
};

export const listOrders = async (userId: string, query: ListOrdersQueryDto) => {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;
  const where = { userId, ...(status && { status }) };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getOrder = async (userId: string, orderId: string, isAdmin = false) => {
  const where = isAdmin ? { id: orderId } : { id: orderId, userId };
  const order = await prisma.order.findFirst({ where, include: orderInclude });
  if (!order) throw appError(404, "Orden no encontrada");
  return order;
};

export const cancelOrder = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw appError(404, "Orden no encontrada");
  if (order.status !== "PENDING")
    throw appError(409, "Solo se pueden cancelar órdenes en estado PENDING");

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
    include: orderInclude,
  });
};

export const updateOrderStatus = async (orderId: string, data: UpdateOrderStatusDto) => {
  const order = await prisma.order.findFirst({ where: { id: orderId } });
  if (!order) throw appError(404, "Orden no encontrada");
  return prisma.order.update({
    where: { id: orderId },
    data: { status: data.status },
    include: orderInclude,
  });
};

// Usado internamente por el módulo payments tras confirmar pago en webhook
export const markOrderPaid = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  orderId: string,
  stripeSessionId: string,
  stripePaymentIntentId: string,
) => {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw appError(404, "Orden no encontrada");
  if (order.paymentStatus === "PAID") return order;
  if (order.status === "CANCELLED") throw appError(409, "No se puede pagar una orden cancelada");

  for (const item of order.items) {
    if (!item.productId) throw appError(409, `Producto no disponible: ${item.productName}`);

    const updated = await tx.product.updateMany({
      where: {
        id: item.productId,
        isActive: true,
        deletedAt: null,
        stock: { gte: item.quantity },
      },
      data: { stock: { decrement: item.quantity } },
    });

    if (updated.count !== 1) {
      throw appError(409, `Stock insuficiente para: ${item.productName}`);
    }
  }

  await tx.cart.deleteMany({ where: { userId: order.userId } });

  return tx.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED",
      stripeSessionId,
      stripePaymentIntentId,
    },
  });
};

/**
 * Emite stock.changed por cada producto de la orden con su stock actual.
 * Se llama DESPUÉS de confirmar el pago (fuera de la transacción) para no
 * notificar cambios que podrían revertirse en un rollback.
 */
export const emitOrderStockChanges = async (orderId: string) => {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { productId: true },
  });
  const productIds = [
    ...new Set(items.map((i) => i.productId).filter((id): id is string => id !== null)),
  ];
  if (productIds.length === 0) return;

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, stock: true },
  });
  for (const p of products) {
    emitDomainEvent({ type: "stock.changed", productId: p.id, stock: p.stock });
  }
};

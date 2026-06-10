import type { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import * as ordersService from "./orders.service.js";
import type { CreateOrderDto, UpdateOrderStatusDto, ListOrdersQueryDto } from "./orders.schema.js";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.createOrder(req.user!.id, req.body as CreateOrderDto);
  res.status(201).json({ status: "success", data: { order, orderId: order.id } });
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await ordersService.listOrders(
    req.user!.id,
    req.query as unknown as ListOrdersQueryDto,
  );
  res.json({ status: "success", data: result });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.getOrder(req.user!.id, req.params["id"] as string);
  res.json({ status: "success", data: { order } });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.cancelOrder(req.user!.id, req.params["id"] as string);
  res.json({ status: "success", data: { order } });
});

// Admin
export const listAllOrders = asyncHandler(async (req: Request, res: Response) => {
  // Admin ve todas las órdenes — pasamos un userId vacío con flag isAdmin
  const { page, limit, status } = req.query as unknown as ListOrdersQueryDto;
  const where = { ...(status && { status }) };
  const skip = ((page ?? 1) - 1) * (limit ?? 10);

  const { prisma } = await import("../../lib/prisma.js");
  const orderInclude = { items: true } as const;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit ?? 10,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    status: "success",
    data: {
      orders,
      total,
      page: page ?? 1,
      limit: limit ?? 10,
      pages: Math.ceil(total / (limit ?? 10)),
    },
  });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.updateOrderStatus(
    req.params["id"] as string,
    req.body as UpdateOrderStatusDto,
  );
  res.json({ status: "success", data: { order } });
});

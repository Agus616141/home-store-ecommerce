import { prisma } from "../../lib/prisma.js";
import { appError } from "../../lib/errors.js";
import type { CreateReviewDto, UpdateReviewDto, ListReviewsQueryDto } from "./reviews.schema.js";

const reviewSelect = {
  id: true,
  productId: true,
  userId: true,
  rating: true,
  title: true,
  body: true,
  isVerifiedPurchase: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { firstName: true, lastName: true } },
} as const;

export const listProductReviews = async (productId: string, query: ListReviewsQueryDto) => {
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = { productId, deletedAt: null };

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      select: reviewSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  const avg = await prisma.review.aggregate({ where, _avg: { rating: true } });

  return {
    reviews,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    averageRating: avg._avg.rating,
  };
};

export const createReview = async (userId: string, productId: string, data: CreateReviewDto) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, deletedAt: null },
  });
  if (!product) throw appError(404, "Producto no encontrado");

  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) throw appError(409, "Ya dejaste una reseña para este producto");

  // Verificar compra — isVerifiedPurchase si tiene al menos una orden PAID con este producto
  const hasPurchase = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId, paymentStatus: "PAID" },
    },
  });

  return prisma.review.create({
    data: { ...data, userId, productId, isVerifiedPurchase: !!hasPurchase },
    select: reviewSelect,
  });
};

export const updateReview = async (userId: string, reviewId: string, data: UpdateReviewDto) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId, deletedAt: null },
  });
  if (!review) throw appError(404, "Reseña no encontrada");

  return prisma.review.update({ where: { id: reviewId }, data, select: reviewSelect });
};

export const deleteReview = async (userId: string, reviewId: string, isAdmin = false) => {
  const where = isAdmin ? { id: reviewId } : { id: reviewId, userId };
  const review = await prisma.review.findFirst({ where: { ...where, deletedAt: null } });
  if (!review) throw appError(404, "Reseña no encontrada");

  await prisma.review.update({ where: { id: reviewId }, data: { deletedAt: new Date() } });
};

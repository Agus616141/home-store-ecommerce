import { prisma } from "../../lib/prisma.js";
import { appError } from "../../lib/errors.js";
import { emitDomainEvent } from "../../lib/events.js";
import type {
  ListProductsQueryDto,
  CreateProductDto,
  UpdateProductDto,
  SetCategoriesDto,
  AddImageDto,
} from "./products.schema.js";

const productInclude = {
  images: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }] },
  categories: { include: { category: true } },
};

export const listProducts = async (query: ListProductsQueryDto) => {
  const { page, limit, q, categorySlug, categorySlugs, minPrice, maxPrice, sort, color, material } =
    query;
  const skip = (page - 1) * limit;

  // Unifica el filtro de categoría: acepta `categorySlug` (único, legado) y/o
  // `categorySlugs` (múltiple). Un producto matchea si pertenece a CUALQUIERA.
  const slugs = [...new Set([...(categorySlug ? [categorySlug] : []), ...(categorySlugs ?? [])])];

  const orderBy =
    sort === "price_asc"
      ? { priceCents: "asc" as const }
      : sort === "price_desc"
        ? { priceCents: "desc" as const }
        : { createdAt: "desc" as const };

  const where = {
    isActive: true,
    deletedAt: null,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(minPrice !== undefined && { priceCents: { gte: minPrice } }),
    ...(maxPrice !== undefined && { priceCents: { lte: maxPrice } }),
    ...(slugs.length && {
      categories: { some: { category: { slug: { in: slugs }, deletedAt: null } } },
    }),
    ...(color?.length && { color: { in: color } }),
    ...(material?.length && { material: { in: material } }),
  };

  // Lectura: Promise.all en vez de $transaction. Para un listado + count no
  // necesitamos snapshot transaccional, y evitamos el overhead de BEGIN/COMMIT
  // y la serialización en una sola conexión (relevante con la latencia de red en prod).
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        categories: { include: { category: { select: { slug: true, name: true } } } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getFeaturedProduct = async () => {
  return prisma.product.findFirst({
    where: { isFeatured: true, isActive: true, deletedAt: null },
    include: {
      images: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }] },
      categories: { include: { category: { select: { slug: true, name: true } } } },
    },
  });
};

export const getProductBySlug = async (slug: string) => {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: productInclude,
  });
  if (!product) throw appError(404, "Producto no encontrado");
  return product;
};

export const createProduct = async (data: CreateProductDto) => {
  const existing = await prisma.product.findFirst({ where: { slug: data.slug } });
  if (existing) throw appError(409, "El slug ya está en uso");

  if (data.sku) {
    const skuExists = await prisma.product.findFirst({ where: { sku: data.sku } });
    if (skuExists) throw appError(409, "El SKU ya está en uso");
  }

  const { images, categoryIds, ...productData } = data;

  const created = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: productData });

    if (images.length > 0) {
      await tx.productImage.createMany({
        data: images.map((img) => ({ ...img, productId: product.id })),
      });
    }

    if (categoryIds.length > 0) {
      await tx.productCategory.createMany({
        data: categoryIds.map((categoryId) => ({ productId: product.id, categoryId })),
      });
    }

    return tx.product.findUniqueOrThrow({ where: { id: product.id }, include: productInclude });
  });

  emitDomainEvent({
    type: "product.created",
    productId: created.id,
    slug: created.slug,
    stock: created.stock,
  });

  return created;
};

export const updateProduct = async (id: string, data: UpdateProductDto) => {
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!product) throw appError(404, "Producto no encontrado");

  if (data.slug && data.slug !== product.slug) {
    const existing = await prisma.product.findFirst({ where: { slug: data.slug } });
    if (existing) throw appError(409, "El slug ya está en uso");
  }

  if (data.sku && data.sku !== product.sku) {
    const existing = await prisma.product.findFirst({ where: { sku: data.sku } });
    if (existing) throw appError(409, "El SKU ya está en uso");
  }

  const updated = await prisma.product.update({ where: { id }, data, include: productInclude });

  emitDomainEvent({
    type: "product.updated",
    productId: updated.id,
    slug: updated.slug,
    stock: updated.stock,
  });

  return updated;
};

export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!product) throw appError(404, "Producto no encontrado");
  await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });

  emitDomainEvent({ type: "product.deleted", productId: id });
};

export const setProductCategories = async (id: string, data: SetCategoriesDto) => {
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!product) throw appError(404, "Producto no encontrado");

  return prisma.$transaction(async (tx) => {
    await tx.productCategory.deleteMany({ where: { productId: id } });
    if (data.categoryIds.length > 0) {
      await tx.productCategory.createMany({
        data: data.categoryIds.map((categoryId) => ({ productId: id, categoryId })),
      });
    }
    return tx.product.findUniqueOrThrow({ where: { id }, include: productInclude });
  });
};

export const addProductImage = async (id: string, data: AddImageDto) => {
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!product) throw appError(404, "Producto no encontrado");

  return prisma.$transaction(async (tx) => {
    if (data.isPrimary) {
      await tx.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
    }
    return tx.productImage.create({ data: { ...data, productId: id } });
  });
};

export const deleteProductImage = async (id: string, imageId: string) => {
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } });
  if (!image) throw appError(404, "Imagen no encontrada");
  await prisma.productImage.delete({ where: { id: imageId } });
};

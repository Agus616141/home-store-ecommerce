import { prisma } from "../../lib/prisma.js";
import { appError } from "../../lib/errors.js";
import type { CreateCategoryDto, UpdateCategoryDto } from "./categories.schema.js";

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: CategoryNode[];
};

function buildTree(categories: CategoryNode[], parentId: string | null = null): CategoryNode[] {
  return categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({ ...c, children: buildTree(categories, c.id) }));
}

export const listCategories = async () => {
  return prisma.category.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
};

export const getCategoryTree = async () => {
  const all = await prisma.category.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return buildTree(all);
};

export const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: {
      children: {
        where: { isActive: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
  if (!category) throw appError(404, "Categoría no encontrada");
  return category;
};

export const createCategory = async (data: CreateCategoryDto) => {
  const existing = await prisma.category.findFirst({ where: { slug: data.slug } });
  if (existing) throw appError(409, "El slug ya está en uso");

  if (data.parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: data.parentId, deletedAt: null },
    });
    if (!parent) throw appError(404, "Categoría padre no encontrada");
  }

  return prisma.category.create({ data });
};

export const updateCategory = async (id: string, data: UpdateCategoryDto) => {
  const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
  if (!category) throw appError(404, "Categoría no encontrada");

  if (data.slug && data.slug !== category.slug) {
    const existing = await prisma.category.findFirst({ where: { slug: data.slug } });
    if (existing) throw appError(409, "El slug ya está en uso");
  }

  if (data.parentId && data.parentId !== category.parentId) {
    if (data.parentId === id) throw appError(400, "Una categoría no puede ser su propio padre");
    const parent = await prisma.category.findFirst({
      where: { id: data.parentId, deletedAt: null },
    });
    if (!parent) throw appError(404, "Categoría padre no encontrada");
  }

  return prisma.category.update({ where: { id }, data });
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
  if (!category) throw appError(404, "Categoría no encontrada");
  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
};

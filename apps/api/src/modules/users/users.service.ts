import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { appError } from "../../lib/errors.js";
import type {
  UpdateProfileDto,
  ChangePasswordDto,
  CreateAddressDto,
  UpdateAddressDto,
  AdminListUsersQueryDto,
  AdminUpdateUserDto,
} from "./users.schema.js";

const SALT_ROUNDS = 12;

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: userSelect,
  });
  if (!user) throw appError(404, "Usuario no encontrado");
  return user;
};

export const updateProfile = async (userId: string, data: UpdateProfileDto) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: userSelect,
  });
  return user;
};

export const changePassword = async (userId: string, data: ChangePasswordDto) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, passwordHash: true },
  });
  if (!user) throw appError(404, "Usuario no encontrado");

  const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!isValid) throw appError(401, "Contraseña actual incorrecta");

  const passwordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
};

// ─── Admin ───────────────────────────────────────────────────────────────────

export const adminListUsers = async (query: AdminListUsersQueryDto) => {
  const { page, limit, q, role } = query;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(role && { role }),
    ...(q && {
      OR: [
        { email: { contains: q, mode: "insensitive" as const } },
        { firstName: { contains: q, mode: "insensitive" as const } },
        { lastName: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { ...userSelect, _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, pages: Math.ceil(total / limit) };
};

export const adminGetUser = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { ...userSelect, _count: { select: { orders: true } } },
  });
  if (!user) throw appError(404, "Usuario no encontrado");
  return user;
};

export const adminUpdateUser = async (id: string, data: AdminUpdateUserDto) => {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw appError(404, "Usuario no encontrado");
  return prisma.user.update({ where: { id }, data, select: userSelect });
};

// ─── Addresses ───────────────────────────────────────────────────────────────

export const listAddresses = async (userId: string) => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
};

export const createAddress = async (userId: string, data: CreateAddressDto) => {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.create({ data: { ...data, userId } });
  });
};

export const updateAddress = async (userId: string, addressId: string, data: UpdateAddressDto) => {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw appError(404, "Dirección no encontrada");

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.update({ where: { id: addressId }, data });
  });
};

export const deleteAddress = async (userId: string, addressId: string) => {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw appError(404, "Dirección no encontrada");
  await prisma.address.delete({ where: { id: addressId } });
};

export const setDefaultAddress = async (userId: string, addressId: string) => {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw appError(404, "Dirección no encontrada");

  return prisma.$transaction(async (tx) => {
    await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.update({ where: { id: addressId }, data: { isDefault: true } });
  });
};

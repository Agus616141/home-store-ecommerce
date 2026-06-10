import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { appError } from "../../lib/errors.js";
import type { UserPayload } from "../../types/express.js";
import type { RegisterDto, LoginDto } from "./auth.schema.js";

const SALT_ROUNDS = 12;

// Campos seguros — nunca se expone passwordHash
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

const generateTokens = (payload: UserPayload) => ({
  accessToken: jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  }),
  refreshToken: jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  }),
});

export const register = async (data: RegisterDto) => {
  const existing = await prisma.user.findFirst({
    where: { email: data.email, deletedAt: null },
  });

  if (existing) throw appError(409, "El email ya está registrado");

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
    select: userSelect,
  });

  return { user, ...generateTokens({ id: user.id, role: user.role }) };
};

export const login = async (data: LoginDto) => {
  const found = await prisma.user.findFirst({
    where: { email: data.email, deletedAt: null },
  });

  // Siempre comparamos para mitigar timing attacks
  const hash = found?.passwordHash ?? "$2b$12$invalidhashusedfortimingprotectiononly";
  const isValid = await bcrypt.compare(data.password, hash);

  if (!found || !isValid) throw appError(401, "Credenciales inválidas");

  const { passwordHash: _ph, deletedAt: _da, ...user } = found;

  return { user, ...generateTokens({ id: found.id, role: found.role }) };
};

export const refreshTokens = (token: string) => {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as UserPayload;
    const { accessToken } = generateTokens({ id: payload.id, role: payload.role });
    return { accessToken };
  } catch {
    throw appError(401, "Refresh token inválido o expirado");
  }
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: userSelect,
  });

  if (!user) throw appError(404, "Usuario no encontrado");

  return user;
};

import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

const IS_RELAXED = process.env["NODE_ENV"] === "test" || process.env["NODE_ENV"] === "development";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const rateLimitResponse = (statusCode: number, message: string) => ({
  status: "fail",
  statusCode,
  message,
});

const userOrIpKey = (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? "");

export const publicReadLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: IS_RELAXED ? 10_000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(429, "Demasiadas solicitudes, intentalo mas tarde"),
});

export const userReadLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: IS_RELAXED ? 10_000 : 600,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(429, "Demasiadas solicitudes de usuario"),
});

export const userWriteLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: IS_RELAXED ? 10_000 : 120,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(429, "Demasiadas operaciones, intentalo mas tarde"),
});

export const adminLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: IS_RELAXED ? 10_000 : 300,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(429, "Demasiadas solicitudes de administracion"),
});

export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: IS_RELAXED ? 10_000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(429, "Demasiados intentos de autenticacion"),
});

export const registerLimiter = rateLimit({
  windowMs: ONE_HOUR,
  max: IS_RELAXED ? 10_000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(429, "Demasiados registros desde este origen"),
});

export const refreshLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: IS_RELAXED ? 10_000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(429, "Demasiadas renovaciones de sesion"),
});

export const checkoutLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: IS_RELAXED ? 10_000 : 30,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(429, "Demasiados intentos de pago"),
});

export const authLimiter = loginLimiter;
export const apiLimiter = publicReadLimiter;

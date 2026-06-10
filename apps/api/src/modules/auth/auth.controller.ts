import type { Request, Response } from "express";

import { asyncHandler } from "../../middlewares/asyncHandler.js";
import * as authService from "./auth.service.js";
import type { RegisterDto, LoginDto } from "./auth.schema.js";
import { env } from "../../config/env.js";

const REFRESH_COOKIE = "refreshToken";

const isProd = env.NODE_ENV === "production";

// En producción el front (Vercel) y la API (Railway) viven en dominios distintos →
// la cookie cross-site requiere SameSite=None + Secure. En dev (mismo host localhost)
// usamos Lax + sin Secure para que funcione sobre http.
const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ("none" as const) : ("lax" as const),
};

const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body as RegisterDto);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  res.status(201).json({ status: "success", data: { user, accessToken } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body as LoginDto);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  res.json({ status: "success", data: { user, accessToken } });
});

export const refresh = asyncHandler((req: Request, res: Response) => {
  const token: unknown = req.cookies[REFRESH_COOKIE];

  if (typeof token !== "string") {
    res
      .status(401)
      .json({ status: "fail", statusCode: 401, message: "Refresh token no encontrado" });
    return;
  }

  const { accessToken } = authService.refreshTokens(token);
  res.json({ status: "success", data: { accessToken } });
});

export const logout = asyncHandler((_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions);
  res.json({ status: "success", data: null });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  res.json({ status: "success", data: { user } });
});

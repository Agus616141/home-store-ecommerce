import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserPayload } from "../types/express.js";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(Object.assign(new Error("No autenticado"), { statusCode: 401 }));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as UserPayload;
    req.user = payload;
    next();
  } catch {
    next(Object.assign(new Error("Token inválido o expirado"), { statusCode: 401 }));
  }
};

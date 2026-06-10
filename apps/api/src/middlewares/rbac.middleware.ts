import type { Request, Response, NextFunction } from "express";
import type { UserPayload } from "../types/express.js";

export const requireRole =
  (...roles: UserPayload["role"][]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(Object.assign(new Error("No autenticado"), { statusCode: 401 }));
    }

    if (!roles.includes(req.user.role)) {
      return next(Object.assign(new Error("Sin permiso para esta acción"), { statusCode: 403 }));
    }

    next();
  };

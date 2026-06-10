import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

interface AppError extends Error {
  statusCode?: number;
  status?: string;
  issues?: Record<string, string[] | undefined>;
}

export const errorMiddleware = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = error.statusCode ?? 500;
  const status = error.status ?? (statusCode >= 500 ? "error" : "fail");
  const message = error.message || "Error interno del servidor";

  if (statusCode >= 500) {
    logger.error({ method: req.method, path: req.originalUrl, err: error }, message);
  }

  res.status(statusCode).json({
    status,
    statusCode,
    message,
    ...(error.issues && { issues: error.issues }),
  });
};

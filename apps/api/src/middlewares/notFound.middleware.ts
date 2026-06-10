import type { Request, Response, NextFunction } from "express";

export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const error = Object.assign(new Error(`Ruta no encontrada: ${req.originalUrl}`), {
    statusCode: 404,
  });
  next(error);
};

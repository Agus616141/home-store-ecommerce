import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

type Target = "body" | "query";

export const validate =
  (schema: ZodType, target: Target = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const error = Object.assign(new Error("Datos de entrada inválidos"), {
        statusCode: 400,
        status: "fail",
        issues: result.error.flatten().fieldErrors,
      });
      return next(error);
    }

    if (target === "body") {
      req.body = result.data as Record<string, unknown>;
    } else {
      // req.query es un getter en Express 5 — se usa defineProperty para reemplazarlo
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    }
    next();
  };

import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const mockRes = {} as Response;

describe("requireRole middleware", () => {
  it("pasa el control cuando el usuario tiene el rol requerido", () => {
    const req = { user: { id: "1", role: "ADMIN" } } as unknown as Request;
    const next = vi.fn() as unknown as NextFunction;

    requireRole("ADMIN")(req, mockRes, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("devuelve 403 cuando el usuario no tiene el rol requerido", () => {
    const req = { user: { id: "1", role: "CUSTOMER" } } as unknown as Request;
    const next = vi.fn() as unknown as NextFunction;

    requireRole("ADMIN")(req, mockRes, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it("devuelve 401 cuando no hay usuario en el request", () => {
    const req = {} as Request;
    const next = vi.fn() as unknown as NextFunction;

    requireRole("ADMIN")(req, mockRes, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

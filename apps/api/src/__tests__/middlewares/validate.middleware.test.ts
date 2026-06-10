import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.middleware.js";

const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

const mockRes = {} as Response;
const next = vi.fn() as unknown as NextFunction;

describe("validate middleware", () => {
  it("pasa el control cuando el body es válido", () => {
    const req = { body: { name: "Pablo", age: 25 } } as Request;

    validate(schema)(req, mockRes, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: "Pablo", age: 25 });
  });

  it("llama next con error 400 cuando el body es inválido", () => {
    const req = { body: { name: "", age: -1 } } as Request;

    validate(schema)(req, mockRes, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: "Datos de entrada inválidos" }),
    );
  });

  it("incluye issues con los campos que fallaron", () => {
    const req = { body: { name: "" } } as Request;
    let capturedError: unknown;
    const captureNext = (err?: unknown) => {
      capturedError = err;
    };

    validate(schema)(req, mockRes, captureNext as NextFunction);

    expect((capturedError as { issues: object }).issues).toBeDefined();
  });
});

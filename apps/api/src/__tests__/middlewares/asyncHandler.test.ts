import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";

const mockReq = {} as Request;
const mockRes = {} as Response;

describe("asyncHandler", () => {
  it("llama next con el error cuando la función async rechaza", async () => {
    const error = new Error("algo falló");
    const fn = vi.fn().mockRejectedValue(error);
    const next = vi.fn() as unknown as NextFunction;

    asyncHandler(fn)(mockReq, mockRes, next);

    await vi.waitFor(() => expect(next).toHaveBeenCalledWith(error));
  });

  it("no llama next cuando la función async resuelve", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const next = vi.fn() as unknown as NextFunction;

    asyncHandler(fn)(mockReq, mockRes, next);

    await vi.waitFor(() => expect(fn).toHaveBeenCalled());
    expect(next).not.toHaveBeenCalled();
  });
});

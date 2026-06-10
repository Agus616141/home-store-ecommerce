import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../app.js";

describe("GET /img/products/:file", () => {
  it("sirve imagen de producto con cache fuerte desde la API", async () => {
    const res = await request(app).get("/img/products/p1.jpg");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^image\/jpeg/);
    expect(res.headers["cache-control"]).toBe("public, max-age=31536000, s-maxage=31536000");
  });
});

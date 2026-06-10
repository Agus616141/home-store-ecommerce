import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { prisma } from "../../../lib/prisma.js";

const USER_EMAIL = "integration_reviews_user@homestore.test";
const OTHER_EMAIL = "integration_reviews_other@homestore.test";
const PASSWORD = "SecurePassword123!";

let userToken = "";
let otherToken = "";
let productId = "";
let reviewId = "";

async function cleanup() {
  await prisma.review.deleteMany({ where: { product: { slug: "test-rev-prod-lampara" } } });
  await prisma.product.deleteMany({ where: { slug: "test-rev-prod-lampara" } });
  await prisma.user.deleteMany({ where: { email: { in: [USER_EMAIL, OTHER_EMAIL] } } });
}

beforeAll(async () => {
  await cleanup();
  const bcrypt = await import("bcrypt");
  const jwt = await import("jsonwebtoken");
  const hash = await bcrypt.default.hash(PASSWORD, 10);

  const user = await prisma.user.create({
    data: { email: USER_EMAIL, passwordHash: hash, firstName: "Rev", lastName: "User" },
  });
  const other = await prisma.user.create({
    data: { email: OTHER_EMAIL, passwordHash: hash, firstName: "Other", lastName: "User" },
  });
  const secret = process.env["JWT_ACCESS_SECRET"]!;
  userToken = jwt.default.sign({ id: user.id, role: user.role }, secret, { expiresIn: "15m" });
  otherToken = jwt.default.sign({ id: other.id, role: other.role }, secret, { expiresIn: "15m" });

  const product = await prisma.product.create({
    data: { name: "Lámpara Test", slug: "test-rev-prod-lampara", priceCents: 500000, stock: 10 },
  });
  productId = product.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const auth = (token = userToken) => ({ Authorization: `Bearer ${token}` });

describe("GET /api/products/:productId/reviews", () => {
  it("lista reseñas (vacío al inicio)", async () => {
    const res = await request(app).get(`/api/products/${productId}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.data.reviews).toHaveLength(0);
    expect(res.body.data.averageRating).toBeNull();
  });
});

describe("POST /api/products/:productId/reviews", () => {
  it("crea una reseña con rating y body", async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/reviews`)
      .set(auth())
      .send({ rating: 4, title: "Muy buena", body: "Excelente calidad" });

    expect(res.status).toBe(201);
    expect(res.body.data.review.rating).toBe(4);
    expect(res.body.data.review.isVerifiedPurchase).toBe(false);
    reviewId = res.body.data.review.id as string;
  });

  it("devuelve 409 si el mismo usuario intenta dejar otra reseña", async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/reviews`)
      .set(auth())
      .send({ rating: 5 });
    expect(res.status).toBe(409);
  });

  it("devuelve 400 con rating fuera de rango", async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/reviews`)
      .set(auth(otherToken))
      .send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  it("devuelve 401 sin token", async () => {
    const res = await request(app).post(`/api/products/${productId}/reviews`).send({ rating: 3 });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/products/:productId/reviews — con datos", () => {
  it("devuelve la reseña creada con promedio", async () => {
    const res = await request(app).get(`/api/products/${productId}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.data.reviews).toHaveLength(1);
    expect(res.body.data.averageRating).toBe(4);
  });
});

describe("PATCH /api/reviews/:id", () => {
  it("actualiza la propia reseña", async () => {
    const res = await request(app)
      .patch(`/api/reviews/${reviewId}`)
      .set(auth())
      .send({ rating: 5, body: "Actualizado" });
    expect(res.status).toBe(200);
    expect(res.body.data.review.rating).toBe(5);
  });

  it("devuelve 404 si otro usuario intenta editar", async () => {
    const res = await request(app)
      .patch(`/api/reviews/${reviewId}`)
      .set(auth(otherToken))
      .send({ rating: 1 });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/reviews/:id", () => {
  it("borra la propia reseña (soft delete)", async () => {
    const res = await request(app).delete(`/api/reviews/${reviewId}`).set(auth());
    expect(res.status).toBe(204);
  });

  it("la reseña ya no aparece en el listado", async () => {
    const res = await request(app).get(`/api/products/${productId}/reviews`);
    expect(res.body.data.reviews).toHaveLength(0);
  });
});

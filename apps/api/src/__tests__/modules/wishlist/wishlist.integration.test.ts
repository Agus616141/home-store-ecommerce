import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { prisma } from "../../../lib/prisma.js";

const USER_EMAIL = "integration_wish_user@homestore.test";
const PASSWORD = "SecurePassword123!";

let userToken = "";
let userId = "";
let productId = "";

async function cleanup() {
  await prisma.product.deleteMany({ where: { slug: "test-wish-prod-cuadro" } });
  await prisma.user.deleteMany({ where: { email: USER_EMAIL } });
}

beforeAll(async () => {
  await cleanup();
  const bcrypt = await import("bcrypt");
  const jwt = await import("jsonwebtoken");
  const hash = await bcrypt.default.hash(PASSWORD, 10);
  const user = await prisma.user.create({
    data: { email: USER_EMAIL, passwordHash: hash, firstName: "Wish", lastName: "User" },
  });
  userId = user.id;
  userToken = jwt.default.sign(
    { id: user.id, role: user.role },
    process.env["JWT_ACCESS_SECRET"]!,
    { expiresIn: "15m" },
  );
  const product = await prisma.product.create({
    data: { name: "Cuadro Test", slug: "test-wish-prod-cuadro", priceCents: 150000, stock: 3 },
  });
  productId = product.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const auth = () => ({ Authorization: `Bearer ${userToken}` });

describe("GET /api/wishlist", () => {
  it("devuelve wishlist vacía para usuario nuevo", async () => {
    const res = await request(app).get("/api/wishlist").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.wishlist.items).toHaveLength(0);
  });
  it("devuelve 401 sin token", async () => {
    expect((await request(app).get("/api/wishlist")).status).toBe(401);
  });
});

describe("POST /api/wishlist/items", () => {
  it("agrega un producto a la wishlist", async () => {
    const res = await request(app).post("/api/wishlist/items").set(auth()).send({ productId });
    expect(res.status).toBe(201);
    expect(res.body.data.wishlist.items).toHaveLength(1);
    expect(res.body.data.wishlist.items[0].product.id).toBe(productId);
  });

  it("devuelve 409 si el producto ya está en la wishlist", async () => {
    const res = await request(app).post("/api/wishlist/items").set(auth()).send({ productId });
    expect(res.status).toBe(409);
  });

  it("devuelve 404 con producto inexistente", async () => {
    const res = await request(app)
      .post("/api/wishlist/items")
      .set(auth())
      .send({ productId: "no-existe" });
    expect(res.status).toBe(404);
  });

  it("devuelve 400 sin productId", async () => {
    const res = await request(app).post("/api/wishlist/items").set(auth()).send({});
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/wishlist/items/:productId", () => {
  it("elimina el producto de la wishlist", async () => {
    const res = await request(app).delete(`/api/wishlist/items/${productId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.wishlist.id).toBeNull();
    expect(res.body.data.wishlist.items).toHaveLength(0);

    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    expect(wishlist).toBeNull();
  });

  it("devuelve 404 al intentar borrar un producto que ya no está", async () => {
    const res = await request(app).delete(`/api/wishlist/items/${productId}`).set(auth());
    expect(res.status).toBe(404);
  });
});

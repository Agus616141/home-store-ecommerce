import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { prisma } from "../../../lib/prisma.js";

const USER_EMAIL = "integration_cart_user@homestore.test";
const PASSWORD = "SecurePassword123!";

let userToken = "";
let userId = "";
let productId = "";

async function cleanup() {
  await prisma.product.deleteMany({ where: { slug: "test-cart-prod-silla" } });
  await prisma.user.deleteMany({ where: { email: USER_EMAIL } });
}

beforeAll(async () => {
  await cleanup();

  const bcrypt = await import("bcrypt");
  const jwt = await import("jsonwebtoken");
  const hash = await bcrypt.default.hash(PASSWORD, 10);
  const user = await prisma.user.create({
    data: { email: USER_EMAIL, passwordHash: hash, firstName: "Cart", lastName: "User" },
  });
  userId = user.id;
  userToken = jwt.default.sign(
    { id: user.id, role: user.role },
    process.env["JWT_ACCESS_SECRET"]!,
    { expiresIn: "15m" },
  );

  const product = await prisma.product.create({
    data: { name: "Silla Test", slug: "test-cart-prod-silla", priceCents: 100000, stock: 5 },
  });
  productId = product.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const auth = () => ({ Authorization: `Bearer ${userToken}` });

// ─── GET /api/cart ────────────────────────────────────────────────────────────

describe("GET /api/cart", () => {
  it("devuelve carrito vacío para usuario nuevo", async () => {
    const res = await request(app).get("/api/cart").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(0);
  });

  it("devuelve 401 sin token", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/cart/items ─────────────────────────────────────────────────────

describe("POST /api/cart/items", () => {
  it("agrega un item al carrito", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set(auth())
      .send({ productId, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.data.cart.items).toHaveLength(1);
    expect(res.body.data.cart.items[0].quantity).toBe(2);
    expect(res.body.data.cart.items[0].product.id).toBe(productId);
  });

  it("acumula cantidad si el producto ya existe en el carrito", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set(auth())
      .send({ productId, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.cart.items[0].quantity).toBe(3);
  });

  it("devuelve 409 si se supera el stock disponible", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set(auth())
      .send({ productId, quantity: 99 });

    expect(res.status).toBe(409);
  });

  it("devuelve 400 con quantity = 0", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set(auth())
      .send({ productId, quantity: 0 });
    expect(res.status).toBe(400);
  });

  it("devuelve 404 con producto inexistente", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set(auth())
      .send({ productId: "nonexistent-id", quantity: 1 });
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/cart/items/:productId ────────────────────────────────────────

describe("PATCH /api/cart/items/:productId", () => {
  it("actualiza la cantidad del item", async () => {
    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set(auth())
      .send({ quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items[0].quantity).toBe(1);
  });

  it("devuelve 409 si la cantidad supera el stock", async () => {
    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set(auth())
      .send({ quantity: 10 }); // stock es 5
    expect(res.status).toBe(409);
  });
});

// ─── DELETE /api/cart/items/:productId ───────────────────────────────────────

describe("DELETE /api/cart/items/:productId", () => {
  it("elimina el item del carrito", async () => {
    const res = await request(app).delete(`/api/cart/items/${productId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.cart.id).toBeNull();
    expect(res.body.data.cart.items).toHaveLength(0);

    const cart = await prisma.cart.findUnique({ where: { userId } });
    expect(cart).toBeNull();
  });

  it("devuelve 404 al borrar un item que ya no está", async () => {
    const res = await request(app).delete(`/api/cart/items/${productId}`).set(auth());
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────

describe("DELETE /api/cart", () => {
  it("vacía el carrito y devuelve 204", async () => {
    await request(app).post("/api/cart/items").set(auth()).send({ productId, quantity: 1 });
    const res = await request(app).delete("/api/cart").set(auth());
    expect(res.status).toBe(204);

    const cartRes = await request(app).get("/api/cart").set(auth());
    expect(cartRes.body.data.cart.id).toBeNull();
    expect(cartRes.body.data.cart.items).toHaveLength(0);

    const cart = await prisma.cart.findUnique({ where: { userId } });
    expect(cart).toBeNull();
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { prisma } from "../../../lib/prisma.js";

const USER_EMAIL = "integration_orders_user@homestore.test";
const ADMIN_EMAIL = "integration_orders_admin@homestore.test";
const PASSWORD = "SecurePassword123!";

let userToken = "";
let adminToken = "";
let productId = "";
let orderId = "";

async function cleanup() {
  await prisma.order.deleteMany({
    where: { user: { email: { in: [USER_EMAIL, ADMIN_EMAIL] } } },
  });
  await prisma.product.deleteMany({ where: { slug: "test-order-prod-mesa" } });
  await prisma.user.deleteMany({ where: { email: { in: [USER_EMAIL, ADMIN_EMAIL] } } });
}

beforeAll(async () => {
  await cleanup();

  const bcrypt = await import("bcrypt");
  const jwt = await import("jsonwebtoken");
  const hash = await bcrypt.default.hash(PASSWORD, 10);

  const user = await prisma.user.create({
    data: { email: USER_EMAIL, passwordHash: hash, firstName: "Orders", lastName: "User" },
  });
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: hash,
      firstName: "Orders",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  userToken = jwt.default.sign(
    { id: user.id, role: user.role },
    process.env["JWT_ACCESS_SECRET"]!,
    { expiresIn: "15m" },
  );
  adminToken = jwt.default.sign(
    { id: admin.id, role: admin.role },
    process.env["JWT_ACCESS_SECRET"]!,
    { expiresIn: "15m" },
  );

  const product = await prisma.product.create({
    data: { name: "Mesa Test", slug: "test-order-prod-mesa", priceCents: 2500000, stock: 10 },
  });
  productId = product.id;

  // Poner 2 items en el carrito del usuario
  await request(app)
    .post("/api/cart/items")
    .set({ Authorization: `Bearer ${userToken}` })
    .send({ productId, quantity: 2 });
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const auth = (token = userToken) => ({ Authorization: `Bearer ${token}` });

// ─── POST /api/orders ─────────────────────────────────────────────────────────

describe("POST /api/orders", () => {
  it("crea la orden desde el carrito en transacción atómica", async () => {
    const res = await request(app).post("/api/orders").set(auth()).send({});

    expect(res.status).toBe(201);
    expect(res.body.data.order.items).toHaveLength(1);
    expect(res.body.data.order.items[0].quantity).toBe(2);
    expect(res.body.data.order.items[0].productName).toBe("Mesa Test");
    expect(res.body.data.order.subtotalCents).toBe(5000000);
    expect(res.body.data.order.totalCents).toBe(5000000);
    expect(res.body.data.order.status).toBe("PENDING");
    expect(res.body.data.order.paymentStatus).toBe("PENDING");
    expect(res.body.data.orderId).toBe(res.body.data.order.id);
    orderId = res.body.data.order.id as string;
  });

  it("el stock fue decrementado después de crear la orden", async () => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(10);
  });

  it("el carrito quedó vacío después de crear la orden", async () => {
    const res = await request(app).get("/api/cart").set(auth());
    expect(res.body.data.cart.items).toHaveLength(1);
  });

  it("devuelve 400 si el carrito está vacío", async () => {
    const res = await request(app).post("/api/orders").set(auth()).send({});
    expect(res.status).toBe(409);
  });

  it("devuelve 401 sin token", async () => {
    const res = await request(app).post("/api/orders").send({});
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/orders ──────────────────────────────────────────────────────────

describe("GET /api/orders", () => {
  it("lista las órdenes del usuario autenticado", async () => {
    const res = await request(app).get("/api/orders").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty("total");
    // Solo órdenes del propio usuario
    const emails = new Set(res.body.data.orders.map((o: { userId: string }) => o.userId));
    expect(emails.size).toBe(1);
  });

  it("filtra por status", async () => {
    const res = await request(app).get("/api/orders?status=PENDING").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.orders.every((o: { status: string }) => o.status === "PENDING")).toBe(
      true,
    );
  });
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────

describe("GET /api/orders/:id", () => {
  it("devuelve el detalle de la orden propia", async () => {
    const res = await request(app).get(`/api/orders/${orderId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.order.id).toBe(orderId);
    expect(res.body.data.order.items).toBeDefined();
  });

  it("devuelve 404 con id inexistente", async () => {
    const res = await request(app).get("/api/orders/nonexistent-id").set(auth());
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/orders/:id/cancel ────────────────────────────────────────────

describe("PATCH /api/orders/:id/cancel", () => {
  it("cancela la orden y devuelve el stock", async () => {
    const res = await request(app).patch(`/api/orders/${orderId}/cancel`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe("CANCELLED");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(10);
  });

  it("devuelve 409 si la orden ya no está en PENDING", async () => {
    const res = await request(app).patch(`/api/orders/${orderId}/cancel`).set(auth());
    expect(res.status).toBe(409);
  });
});

// ─── Admin endpoints ─────────────────────────────────────────────────────────

describe("GET /api/orders/admin", () => {
  it("admin lista todas las órdenes", async () => {
    const res = await request(app).get("/api/orders/admin").set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.orders)).toBe(true);
  });

  it("devuelve 403 para usuario normal", async () => {
    const res = await request(app).get("/api/orders/admin").set(auth());
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/orders/:id/status", () => {
  it("admin actualiza el status de una orden", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set(auth(adminToken))
      .send({ status: "CONFIRMED" });
    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe("CONFIRMED");
  });

  it("devuelve 400 con status inválido", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set(auth(adminToken))
      .send({ status: "INVALID" });
    expect(res.status).toBe(400);
  });

  it("devuelve 403 para usuario normal", async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set(auth())
      .send({ status: "CONFIRMED" });
    expect(res.status).toBe(403);
  });
});

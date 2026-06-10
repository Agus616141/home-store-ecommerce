import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { prisma } from "../../../lib/prisma.js";

const ADMIN_EMAIL = "integration_analytics_admin@homestore.test";
const USER_EMAIL = "integration_analytics_user@homestore.test";
const PASSWORD = "SecurePassword123!";

let adminToken = "";
let userToken = "";

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN_EMAIL, USER_EMAIL] } } });
}

beforeAll(async () => {
  await cleanup();
  const bcrypt = await import("bcrypt");
  const jwt = await import("jsonwebtoken");
  const hash = await bcrypt.default.hash(PASSWORD, 10);
  const secret = process.env["JWT_ACCESS_SECRET"]!;

  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: hash,
      firstName: "Analytics",
      lastName: "Admin",
      role: "ADMIN",
    },
  });
  const user = await prisma.user.create({
    data: { email: USER_EMAIL, passwordHash: hash, firstName: "Analytics", lastName: "User" },
  });
  adminToken = jwt.default.sign({ id: admin.id, role: admin.role }, secret, { expiresIn: "15m" });
  userToken = jwt.default.sign({ id: user.id, role: user.role }, secret, { expiresIn: "15m" });
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const auth = (token = adminToken) => ({ Authorization: `Bearer ${token}` });

describe("GET /api/analytics/overview", () => {
  it("admin obtiene el resumen", async () => {
    const res = await request(app).get("/api/analytics/overview").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("totalOrders");
    expect(res.body.data).toHaveProperty("totalRevenueCents");
    expect(res.body.data).toHaveProperty("totalUsers");
    expect(res.body.data).toHaveProperty("totalProducts");
  });
  it("devuelve 403 para usuario normal", async () => {
    expect((await request(app).get("/api/analytics/overview").set(auth(userToken))).status).toBe(
      403,
    );
  });
  it("devuelve 401 sin token", async () => {
    expect((await request(app).get("/api/analytics/overview")).status).toBe(401);
  });
});

describe("GET /api/analytics/orders", () => {
  it("admin obtiene órdenes por status", async () => {
    const res = await request(app).get("/api/analytics/orders").set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.ordersByStatus)).toBe(true);
  });
  it("devuelve 403 para usuario normal", async () => {
    expect((await request(app).get("/api/analytics/orders").set(auth(userToken))).status).toBe(403);
  });
});

describe("GET /api/analytics/products/top", () => {
  it("admin obtiene los productos más vendidos", async () => {
    const res = await request(app).get("/api/analytics/products/top").set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.topProducts)).toBe(true);
  });
  it("devuelve 403 para usuario normal", async () => {
    expect(
      (await request(app).get("/api/analytics/products/top").set(auth(userToken))).status,
    ).toBe(403);
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { prisma } from "../../../lib/prisma.js";

const ADMIN_EMAIL = "integration_prod_admin@homestore.test";
const PASSWORD = "SecurePassword123!";

let adminToken = "";
let productId = "";
let imageId = "";
let categoryId = "";

async function cleanup() {
  await prisma.product.deleteMany({ where: { slug: { startsWith: "test-prod-" } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: "test-prodcat-" } } });
  await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });
}

beforeAll(async () => {
  await cleanup();

  const bcrypt = await import("bcrypt");
  const jwt = await import("jsonwebtoken");
  const hash = await bcrypt.default.hash(PASSWORD, 10);
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: hash,
      firstName: "Admin",
      lastName: "Prod",
      role: "ADMIN",
    },
  });
  adminToken = jwt.default.sign(
    { id: admin.id, role: admin.role },
    process.env["JWT_ACCESS_SECRET"]!,
    { expiresIn: "15m" },
  );

  const cat = await prisma.category.create({
    data: { name: "TestCat", slug: "test-prodcat-hogar", sortOrder: 0 },
  });
  categoryId = cat.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const auth = () => ({ Authorization: `Bearer ${adminToken}` });

// ─── GET /api/products ────────────────────────────────────────────────────────

describe("GET /api/products", () => {
  it("devuelve lista paginada sin auth", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.products)).toBe(true);
    expect(res.body.data).toHaveProperty("total");
    expect(res.body.data).toHaveProperty("pages");
  });

  it("devuelve 400 con limit inválido", async () => {
    const res = await request(app).get("/api/products?limit=999");
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/products ───────────────────────────────────────────────────────

describe("POST /api/products", () => {
  it("admin crea un producto con imagen y categoría", async () => {
    const res = await request(app)
      .post("/api/products")
      .set(auth())
      .send({
        name: "Silla de Diseño",
        slug: "test-prod-silla-diseno",
        priceCents: 4999900,
        stock: 10,
        images: [{ url: "https://example.com/silla.jpg", isPrimary: true }],
        categoryIds: [categoryId],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.product.slug).toBe("test-prod-silla-diseno");
    expect(res.body.data.product.priceCents).toBe(4999900);
    expect(res.body.data.product.images).toHaveLength(1);
    expect(res.body.data.product.categories).toHaveLength(1);
    productId = res.body.data.product.id as string;
  });

  it("devuelve 409 con slug duplicado", async () => {
    const res = await request(app)
      .post("/api/products")
      .set(auth())
      .send({ name: "X", slug: "test-prod-silla-diseno", priceCents: 100 });
    expect(res.status).toBe(409);
  });

  it("devuelve 400 si falta priceCents", async () => {
    const res = await request(app)
      .post("/api/products")
      .set(auth())
      .send({ name: "X", slug: "test-prod-x" });
    expect(res.status).toBe(400);
  });

  it("devuelve 403 sin rol admin", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ name: "X", slug: "test-prod-y", priceCents: 100 });
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/products/:slug ──────────────────────────────────────────────────

describe("GET /api/products/:slug", () => {
  it("devuelve el producto con imágenes y categorías", async () => {
    const res = await request(app).get("/api/products/test-prod-silla-diseno");
    expect(res.status).toBe(200);
    expect(res.body.data.product.images).toBeDefined();
    expect(res.body.data.product.categories).toBeDefined();
  });

  it("devuelve 404 con slug inexistente", async () => {
    const res = await request(app).get("/api/products/no-existe-producto");
    expect(res.status).toBe(404);
  });
});

// ─── GET /api/products con filtros ───────────────────────────────────────────

describe("GET /api/products — filtros", () => {
  it("filtra por q", async () => {
    const res = await request(app).get("/api/products?q=Silla");
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

  it("filtra por categorySlug", async () => {
    const res = await request(app).get("/api/products?categorySlug=test-prodcat-hogar");
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

  it("filtra por múltiples categorías (categorySlugs)", async () => {
    const res = await request(app).get(
      "/api/products?categorySlugs=test-prodcat-hogar&categorySlugs=inexistente-xyz",
    );
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

  it("filtra por rango de precio", async () => {
    const res = await request(app).get("/api/products?minPrice=1000&maxPrice=9999999");
    expect(res.status).toBe(200);
  });
});

// ─── PATCH /api/products/:id ──────────────────────────────────────────────────

describe("PATCH /api/products/:id", () => {
  it("admin actualiza nombre y precio", async () => {
    const res = await request(app)
      .patch(`/api/products/${productId}`)
      .set(auth())
      .send({ name: "Silla Actualizada", priceCents: 5500000 });
    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe("Silla Actualizada");
    expect(res.body.data.product.priceCents).toBe(5500000);
  });
});

// ─── PUT /api/products/:id/categories ────────────────────────────────────────

describe("PUT /api/products/:id/categories", () => {
  it("reemplaza las categorías del producto", async () => {
    const res = await request(app)
      .put(`/api/products/${productId}/categories`)
      .set(auth())
      .send({ categoryIds: [] });
    expect(res.status).toBe(200);
    expect(res.body.data.product.categories).toHaveLength(0);
  });
});

// ─── POST /api/products/:id/images ───────────────────────────────────────────

describe("POST /api/products/:id/images", () => {
  it("agrega una imagen al producto", async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/images`)
      .set(auth())
      .send({ url: "https://example.com/nueva.jpg", isPrimary: false });
    expect(res.status).toBe(201);
    expect(res.body.data.image.productId).toBe(productId);
    imageId = res.body.data.image.id as string;
  });

  it("devuelve 400 con URL inválida", async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/images`)
      .set(auth())
      .send({ url: "no-es-una-url" });
    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/products/:id/images/:imageId ─────────────────────────────────

describe("DELETE /api/products/:id/images/:imageId", () => {
  it("elimina la imagen", async () => {
    const res = await request(app)
      .delete(`/api/products/${productId}/images/${imageId}`)
      .set(auth());
    expect(res.status).toBe(204);
  });

  it("devuelve 404 con imageId inexistente", async () => {
    const res = await request(app)
      .delete(`/api/products/${productId}/images/non-existent`)
      .set(auth());
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────

describe("DELETE /api/products/:id", () => {
  it("admin elimina el producto (soft delete)", async () => {
    const res = await request(app).delete(`/api/products/${productId}`).set(auth());
    expect(res.status).toBe(204);
  });

  it("devuelve 404 al borrar el mismo producto dos veces", async () => {
    const res = await request(app).delete(`/api/products/${productId}`).set(auth());
    expect(res.status).toBe(404);
  });
});

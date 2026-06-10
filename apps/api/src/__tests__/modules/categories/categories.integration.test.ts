import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { prisma } from "../../../lib/prisma.js";

const ADMIN_EMAIL = "integration_cat_admin@homestore.test";
const USER_EMAIL = "integration_cat_user@homestore.test";
const PASSWORD = "SecurePassword123!";

let adminToken = "";
let userToken = "";
let categoryId = "";
let childCategoryId = "";

async function cleanup() {
  await prisma.category.deleteMany({ where: { slug: { startsWith: "test-cat-" } } });
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN_EMAIL, USER_EMAIL] } } });
}

beforeAll(async () => {
  await cleanup();

  // Crear admin directo en DB
  const bcrypt = await import("bcrypt");
  const hash = await bcrypt.default.hash(PASSWORD, 10);
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: hash,
      firstName: "Admin",
      lastName: "Test",
      role: "ADMIN",
    },
  });
  const user = await prisma.user.create({
    data: { email: USER_EMAIL, passwordHash: hash, firstName: "User", lastName: "Test" },
  });

  const jwt = await import("jsonwebtoken");
  adminToken = jwt.default.sign(
    { id: admin.id, role: admin.role },
    process.env["JWT_ACCESS_SECRET"]!,
    { expiresIn: "15m" },
  );
  userToken = jwt.default.sign(
    { id: user.id, role: user.role },
    process.env["JWT_ACCESS_SECRET"]!,
    { expiresIn: "15m" },
  );
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// ─── GET /api/categories ──────────────────────────────────────────────────────

describe("GET /api/categories", () => {
  it("devuelve lista vacía sin autenticación", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.categories)).toBe(true);
  });
});

describe("GET /api/categories/tree", () => {
  it("devuelve el árbol sin autenticación", async () => {
    const res = await request(app).get("/api/categories/tree");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.tree)).toBe(true);
  });
});

// ─── POST /api/categories ─────────────────────────────────────────────────────

describe("POST /api/categories", () => {
  it("admin crea una categoría raíz", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set(auth(adminToken))
      .send({ name: "Hogar", slug: "test-cat-hogar", sortOrder: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.category.slug).toBe("test-cat-hogar");
    categoryId = res.body.data.category.id as string;
  });

  it("admin crea una categoría hija", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set(auth(adminToken))
      .send({ name: "Cocina", slug: "test-cat-cocina", parentId: categoryId });

    expect(res.status).toBe(201);
    expect(res.body.data.category.parentId).toBe(categoryId);
    childCategoryId = res.body.data.category.id as string;
  });

  it("devuelve 409 si el slug ya existe", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set(auth(adminToken))
      .send({ name: "Duplicado", slug: "test-cat-hogar" });
    expect(res.status).toBe(409);
  });

  it("devuelve 403 si el usuario no es admin", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set(auth(userToken))
      .send({ name: "X", slug: "test-cat-x" });
    expect(res.status).toBe(403);
  });

  it("devuelve 401 sin token", async () => {
    const res = await request(app).post("/api/categories").send({ name: "X", slug: "test-cat-x" });
    expect(res.status).toBe(401);
  });

  it("devuelve 400 con slug inválido", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set(auth(adminToken))
      .send({ name: "X", slug: "Slug Inválido!" });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/categories/:slug ────────────────────────────────────────────────

describe("GET /api/categories/:slug", () => {
  it("devuelve la categoría con sus hijos", async () => {
    const res = await request(app).get("/api/categories/test-cat-hogar");
    expect(res.status).toBe(200);
    expect(res.body.data.category.slug).toBe("test-cat-hogar");
    expect(Array.isArray(res.body.data.category.children)).toBe(true);
    expect(res.body.data.category.children[0].slug).toBe("test-cat-cocina");
  });

  it("devuelve 404 con slug inexistente", async () => {
    const res = await request(app).get("/api/categories/no-existe-slug");
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/categories/:id ────────────────────────────────────────────────

describe("PATCH /api/categories/:id", () => {
  it("admin actualiza nombre y sortOrder", async () => {
    const res = await request(app)
      .patch(`/api/categories/${categoryId}`)
      .set(auth(adminToken))
      .send({ name: "Hogar Actualizado", sortOrder: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.category.name).toBe("Hogar Actualizado");
  });

  it("devuelve 400 si la categoría intenta ser su propio padre", async () => {
    const res = await request(app)
      .patch(`/api/categories/${categoryId}`)
      .set(auth(adminToken))
      .send({ parentId: categoryId });
    expect(res.status).toBe(400);
  });

  it("devuelve 403 para usuario normal", async () => {
    const res = await request(app)
      .patch(`/api/categories/${categoryId}`)
      .set(auth(userToken))
      .send({ name: "Hack" });
    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/categories/:id ───────────────────────────────────────────────

describe("DELETE /api/categories/:id", () => {
  it("admin elimina la categoría hija (soft delete)", async () => {
    const res = await request(app)
      .delete(`/api/categories/${childCategoryId}`)
      .set(auth(adminToken));
    expect(res.status).toBe(204);
  });

  it("admin elimina la categoría raíz", async () => {
    const res = await request(app).delete(`/api/categories/${categoryId}`).set(auth(adminToken));
    expect(res.status).toBe(204);
  });

  it("devuelve 404 al borrar una ya eliminada", async () => {
    const res = await request(app).delete(`/api/categories/${categoryId}`).set(auth(adminToken));
    expect(res.status).toBe(404);
  });
});

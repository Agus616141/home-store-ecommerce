import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { prisma } from "../../../lib/prisma.js";

const TEST_EMAIL = "integration_users_test@homestore.test";
const TEST_PASSWORD = "SecurePassword123!";

let accessToken = "";
let userId = "";
let addressId = "";

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

beforeAll(async () => {
  await cleanup();
  const res = await request(app).post("/api/auth/register").send({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    firstName: "Test",
    lastName: "User",
  });
  accessToken = res.body.data.accessToken as string;
  userId = res.body.data.user.id as string;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const auth = () => ({ Authorization: `Bearer ${accessToken}` });

// ─── GET /api/users/me ────────────────────────────────────────────────────────

describe("GET /api/users/me", () => {
  it("devuelve el perfil del usuario", async () => {
    const res = await request(app).get("/api/users/me").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("devuelve 401 sin token", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────

describe("PATCH /api/users/me", () => {
  it("actualiza firstName y lastName", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set(auth())
      .send({ firstName: "Actualizado", lastName: "Apellido" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.firstName).toBe("Actualizado");
    expect(res.body.data.user.lastName).toBe("Apellido");
  });

  it("devuelve 400 con datos inválidos", async () => {
    const res = await request(app).patch("/api/users/me").set(auth()).send({ firstName: "" });
    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/users/me/password ────────────────────────────────────────────

describe("PATCH /api/users/me/password", () => {
  it("cambia la contraseña con credenciales válidas", async () => {
    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth())
      .send({ currentPassword: TEST_PASSWORD, newPassword: "NuevaPassword456!" });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it("devuelve 401 con contraseña actual incorrecta", async () => {
    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth())
      .send({ currentPassword: "contraseña_incorrecta", newPassword: "NuevaPassword456!" });
    expect(res.status).toBe(401);
  });

  it("devuelve 400 si la nueva contraseña es muy corta", async () => {
    const res = await request(app)
      .patch("/api/users/me/password")
      .set(auth())
      .send({ currentPassword: TEST_PASSWORD, newPassword: "123" });
    expect(res.status).toBe(400);
  });
});

// ─── Direcciones ─────────────────────────────────────────────────────────────

describe("POST /api/users/me/addresses", () => {
  it("crea una dirección y la devuelve", async () => {
    const res = await request(app).post("/api/users/me/addresses").set(auth()).send({
      label: "Casa",
      street: "Av. Corrientes 1234",
      city: "Buenos Aires",
      state: "CABA",
      postalCode: "1043",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.address.street).toBe("Av. Corrientes 1234");
    addressId = res.body.data.address.id as string;

    const address = await prisma.address.findUnique({ where: { id: addressId } });
    expect(address?.userId).toBe(userId);
    expect(address?.street).toBe("Av. Corrientes 1234");
  });

  it("devuelve 400 si falta street", async () => {
    const res = await request(app)
      .post("/api/users/me/addresses")
      .set(auth())
      .send({ city: "Buenos Aires", state: "CABA", postalCode: "1043" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/users/me/addresses", () => {
  it("lista las direcciones del usuario", async () => {
    const res = await request(app).get("/api/users/me/addresses").set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.addresses)).toBe(true);
    expect(res.body.data.addresses.length).toBeGreaterThan(0);
  });
});

describe("PATCH /api/users/me/addresses/:id", () => {
  it("actualiza una dirección propia", async () => {
    const res = await request(app)
      .patch(`/api/users/me/addresses/${addressId}`)
      .set(auth())
      .send({ city: "Rosario" });
    expect(res.status).toBe(200);
    expect(res.body.data.address.city).toBe("Rosario");
  });

  it("devuelve 404 con id inexistente", async () => {
    const res = await request(app)
      .patch("/api/users/me/addresses/nonexistent-id")
      .set(auth())
      .send({ city: "Mendoza" });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/users/me/addresses/:id/default", () => {
  it("marca una dirección como predeterminada", async () => {
    const res = await request(app)
      .patch(`/api/users/me/addresses/${addressId}/default`)
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.address.isDefault).toBe(true);
  });
});

describe("DELETE /api/users/me/addresses/:id", () => {
  it("elimina una dirección propia y devuelve 204", async () => {
    const res = await request(app).delete(`/api/users/me/addresses/${addressId}`).set(auth());
    expect(res.status).toBe(204);
  });

  it("devuelve 404 al intentar borrar una dirección ya eliminada", async () => {
    const res = await request(app).delete(`/api/users/me/addresses/${addressId}`).set(auth());
    expect(res.status).toBe(404);
  });
});

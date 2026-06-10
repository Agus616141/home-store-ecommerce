import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { prisma } from "../../../lib/prisma.js";

const TEST_EMAIL = "integration_auth_test@homestore.test";
const TEST_PASSWORD = "SecurePassword123!";
const TEST_USER = {
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  firstName: "Test",
  lastName: "User",
};

async function cleanup() {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

beforeAll(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("registra un usuario nuevo y devuelve 201 con user + accessToken + cookie", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(res.body.data.accessToken).toBeDefined();
    const setCookieReg = res.headers["set-cookie"] as string[] | undefined;
    expect(setCookieReg).toBeDefined();
    expect(setCookieReg![0]).toContain("refreshToken");
  });

  it("devuelve 409 si el email ya está registrado", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);

    expect(res.status).toBe(409);
    expect(res.body.status).toBe("fail");
  });

  it("devuelve 400 si falta el email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ password: TEST_PASSWORD, firstName: "A", lastName: "B" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("fail");
  });

  it("devuelve 400 si la contraseña es muy corta", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "otro@test.com", password: "123", firstName: "A", lastName: "B" });

    expect(res.status).toBe(400);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("devuelve 200 con accessToken y cookie con credenciales válidas", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect((res.headers["set-cookie"] as unknown as string[])[0]).toContain("refreshToken");
  });

  it("devuelve 401 con contraseña incorrecta", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("fail");
  });

  it("devuelve 401 con email que no existe", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "noexiste@homestore.test", password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });

  it("devuelve 400 si falta la contraseña", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: TEST_EMAIL });

    expect(res.status).toBe(400);
  });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

describe("POST /api/auth/refresh", () => {
  it("devuelve un nuevo accessToken con refreshToken válido en cookie", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const cookies = loginRes.headers["set-cookie"] as unknown as string[];
    expect(cookies).toBeDefined();

    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("devuelve 401 sin cookie de refreshToken", async () => {
    const res = await request(app).post("/api/auth/refresh");

    expect(res.status).toBe(401);
  });

  it("devuelve 401 con refreshToken inválido", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=token.invalido.abc");

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  it("devuelve el perfil del usuario autenticado", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const { accessToken } = loginRes.body.data as { accessToken: string };

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("devuelve 401 sin token de autorización", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("devuelve 401 con token malformado", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer token.invalido");

    expect(res.status).toBe(401);
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("limpia la cookie y devuelve 200", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const { accessToken } = loginRes.body.data as { accessToken: string };

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    const setCookie = res.headers["set-cookie"] as string[] | undefined;
    if (setCookie) {
      expect(setCookie[0]).toContain("refreshToken=;");
    }
  });

  it("devuelve 401 sin token", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(401);
  });
});

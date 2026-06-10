import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks antes de cualquier import del módulo bajo test
vi.mock("../../../lib/prisma.js", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn(),
  },
}));

import bcrypt from "bcrypt";
import { prisma } from "../../../lib/prisma.js";
import * as authService from "../../../modules/auth/auth.service.js";

const mockUser = {
  id: "user-1",
  email: "pablo@test.com",
  passwordHash: "hashed_password",
  firstName: "Pablo",
  lastName: "Garcia",
  phone: null,
  role: "CUSTOMER" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authService.register", () => {
  it("lanza 409 si el email ya existe", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);

    await expect(
      authService.register({
        email: "pablo@test.com",
        password: "password123",
        firstName: "Pablo",
        lastName: "Garcia",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("crea el usuario y devuelve tokens cuando el email es nuevo", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as never);

    const result = await authService.register({
      email: "nuevo@test.com",
      password: "password123",
      firstName: "Nuevo",
      lastName: "Usuario",
    });

    expect(result.user).toBeDefined();
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(prisma.user.create).toHaveBeenCalledOnce();
  });

  it("hashea la contraseña antes de guardar", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as never);

    await authService.register({
      email: "nuevo@test.com",
      password: "password123",
      firstName: "Nuevo",
      lastName: "Usuario",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
  });
});

describe("authService.login", () => {
  it("lanza 401 si el usuario no existe", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      authService.login({ email: "noexiste@test.com", password: "password123" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("lanza 401 si la contraseña es incorrecta", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      authService.login({ email: "pablo@test.com", password: "wrongpass" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("devuelve usuario y tokens con credenciales válidas", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await authService.login({
      email: "pablo@test.com",
      password: "password123",
    });

    expect(result.user.email).toBe("pablo@test.com");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user).not.toHaveProperty("passwordHash");
  });
});

describe("authService.refreshTokens", () => {
  it("lanza 401 con un token inválido", () => {
    expect(() => authService.refreshTokens("token.invalido")).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});

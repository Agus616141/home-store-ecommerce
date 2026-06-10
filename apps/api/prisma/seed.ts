import "dotenv/config";
import { PrismaClient, Role } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding...");

  // ─── CATEGORÍAS ──────────────────────────────────────────────────────────────
  // Estructura plana: 10 categorías distribuidas en los 4 catálogos.

  const categorias = [
    // Living
    { name: "Sofás",       slug: "sofas",       description: "Sofás para sala de estar",          sortOrder: 1  },
    { name: "Sillas",      slug: "sillas",       description: "Sillas para sala y comedor",        sortOrder: 2  },
    { name: "Mesas",       slug: "mesas",        description: "Mesas de centro, comedor y más",    sortOrder: 3  },
    // Dormitorio
    { name: "Camas",       slug: "camas",        description: "Camas y bases",                     sortOrder: 4  },
    { name: "Armarios",    slug: "armarios",     description: "Armarios y placares",               sortOrder: 5  },
    // Decoración
    { name: "Iluminación", slug: "iluminacion",  description: "Lámparas y puntos de luz",          sortOrder: 6  },
    { name: "Cuadros",     slug: "cuadros",      description: "Cuadros y arte decorativo",         sortOrder: 7  },
    { name: "Alfombras",   slug: "alfombras",    description: "Alfombras para todos los ambientes", sortOrder: 8 },
    // Cocina
    { name: "Vajilla",     slug: "vajilla",      description: "Vajilla y cristalería",             sortOrder: 9  },
    { name: "Utensilios",  slug: "utensilios",   description: "Utensilios y accesorios de cocina", sortOrder: 10 },
  ];

  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder, isActive: true },
      create: { name: cat.name, slug: cat.slug, description: cat.description, sortOrder: cat.sortOrder, isActive: true },
    });
  }

  console.log(`✓ ${categorias.length} categorías creadas/actualizadas`);

  // ─── USUARIOS DEMO ────────────────────────────────────────────────────────

  const SALT_ROUNDS = 10;

  const adminHash = await bcrypt.hash("Admin1234!", SALT_ROUNDS);
  const customerHash = await bcrypt.hash("Customer1234!", SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: "admin@homestore.com" },
    update: {},
    create: {
      email: "admin@homestore.com",
      passwordHash: adminHash,
      firstName: "Admin",
      lastName: "HomeStore",
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "demo@homestore.com" },
    update: {},
    create: {
      email: "demo@homestore.com",
      passwordHash: customerHash,
      firstName: "Demo",
      lastName: "Cliente",
      role: Role.CUSTOMER,
    },
  });

  console.log(`✓ Usuarios demo: admin(${admin.email}), customer(${customer.email})`);
  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

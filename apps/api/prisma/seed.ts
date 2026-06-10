import "dotenv/config";
import { PrismaClient, Role } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── DATOS DE SEED ────────────────────────────────────────────────────────────
// Idempotente: se puede correr N veces sin duplicar (upsert por clave natural).

const categorias = [
  { name: "Sofás",       slug: "sofas",       description: "Sofás para sala de estar",            sortOrder: 1  },
  { name: "Sillas",      slug: "sillas",      description: "Sillas para sala y comedor",          sortOrder: 2  },
  { name: "Mesas",       slug: "mesas",       description: "Mesas de centro, comedor y más",      sortOrder: 3  },
  { name: "Camas",       slug: "camas",       description: "Camas y bases",                       sortOrder: 4  },
  { name: "Armarios",    slug: "armarios",    description: "Armarios y placares",                 sortOrder: 5  },
  { name: "Iluminación", slug: "iluminacion", description: "Lámparas y puntos de luz",            sortOrder: 6  },
  { name: "Cuadros",     slug: "cuadros",     description: "Cuadros y arte decorativo",           sortOrder: 7  },
  { name: "Alfombras",   slug: "alfombras",   description: "Alfombras para todos los ambientes",  sortOrder: 8  },
  { name: "Vajilla",     slug: "vajilla",     description: "Vajilla y cristalería",               sortOrder: 9  },
  { name: "Utensilios",  slug: "utensilios",  description: "Utensilios y accesorios de cocina",   sortOrder: 10 },
];

const productos = [
  {
    name: "Sillon de Acento Mostaza",
    slug: "sillon-acento-mostaza",
    description: "Sillon de acento tapizado en tela texturada color mostaza. Estructura con patas de madera pintadas en negro. Diseno retro contemporaneo. Medidas: 75 x 80 x 85 cm.",
    priceCents: 590000, stock: 50, sku: "SKU-001", isFeatured: false, isActive: true,
    categories: ["sillas"],
    images: [
      { url: "/img/products/p10.jpg", altText: "Sillon de Acento Mostaza", sortOrder: 0, isPrimary: true },
      { url: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&q=80&auto=format&fit=crop", altText: "Sillon de Acento Mostaza detalle", sortOrder: 1, isPrimary: false },
    ],
  },
  {
    name: "Sofa Velvet Verde Esmeralda",
    slug: "sofa-velvet-verde-esmeralda",
    description: "Sofa de tres cuerpos tapizado en terciopelo de alta densidad color verde esmeralda. Estructura de madera maciza con patas conicas de roble. Incluye dos cojines cilindricos. Medidas: 220 x 85 x 80 cm.",
    priceCents: 1890000, stock: 18, sku: "SKU-002", isFeatured: true, isActive: true,
    categories: ["sofas"],
    images: [
      { url: "/img/products/p9.jpg", altText: "Sofa Velvet Verde Esmeralda", sortOrder: 0, isPrimary: true },
      { url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80&auto=format&fit=crop", altText: "Sofa Velvet Verde Esmeralda lateral", sortOrder: 1, isPrimary: false },
    ],
  },
  {
    name: "Taburete Alto de Madera Natural",
    slug: "taburete-alto-madera-natural",
    description: "Taburete alto de madera maciza con acabado natural lavado. Asiento cuadrado con asa central integrada. Altura: 75 cm. Ideal para cocinas, barras y ambientes nordicos.",
    priceCents: 129000, stock: 35, sku: "SKU-003", isFeatured: false, isActive: true,
    categories: ["sillas"],
    images: [
      { url: "/img/products/p8.jpg", altText: "Taburete Alto de Madera Natural", sortOrder: 0, isPrimary: true },
    ],
  },
  {
    name: "Lampara de Mesa Madera Nordica",
    slug: "lampara-mesa-madera-nordica",
    description: "Lampara de sobremesa con base de madera natural en estructura de caballete y pantalla cilindrica de lino beige. Casquillo E27. Altura: 45 cm. Cable trenzado de 1,8 m.",
    priceCents: 159000, stock: 25, sku: "SKU-004", isFeatured: false, isActive: true,
    categories: ["iluminacion"],
    images: [
      { url: "/img/products/p7.jpg", altText: "Lampara de Mesa Madera Nordica", sortOrder: 0, isPrimary: true },
    ],
  },
  {
    name: "Silla Escandinava Tulip Negra",
    slug: "silla-escandinava-tulip-negra",
    description: "Silla de diseno escandinavo con cuerpo moldeado en polipropileno negro y cojin de cuero sintetico cosido. Patas de madera de haya natural. Apilable. Carga maxima: 110 kg.",
    priceCents: 195000, stock: 120, sku: "SKU-005", isFeatured: false, isActive: true,
    categories: ["sillas"],
    images: [
      { url: "/img/products/p6.jpg", altText: "Silla Escandinava Tulip Negra", sortOrder: 0, isPrimary: true },
    ],
  },
  {
    name: "Almohada Confort Premium Blanca",
    slug: "almohadon-soft-touch-blanco",
    description: "Almohada de descanso con funda de algodon 100% y relleno de fibra siliconada de alta densidad. Medidas: 50 x 70 cm. Lavable a maquina hasta 40 grados.",
    priceCents: 89000, stock: 80, sku: "SKU-006", isFeatured: false, isActive: true,
    categories: ["camas"],
    images: [
      { url: "/img/products/p5.jpg", altText: "Almohada Confort Premium Blanca", sortOrder: 0, isPrimary: true },
    ],
  },
  {
    name: "Espejo Rattan Redondo Boho",
    slug: "espejo-rattan-redondo-boho",
    description: "Espejo circular con marco tejido de rattan natural. Estilo boho-chic que aporta calidez a cualquier ambiente. Diametro: 70 cm. Incluye soporte de pared.",
    priceCents: 220000, stock: 22, sku: "SKU-007", isFeatured: false, isActive: true,
    categories: ["cuadros"],
    images: [
      { url: "/img/products/p4.jpg", altText: "Espejo Rattan Redondo Boho", sortOrder: 0, isPrimary: true },
    ],
  },
  {
    name: "Escritorio Nordico de Bambu",
    slug: "escritorio-nordico-bambu",
    description: "Escritorio de bambu natural con tres cajones y patas de acero blanco estilo hairpin. Diseno escandinavo minimalista ideal para home office. Medidas: 120 x 50 x 75 cm.",
    priceCents: 450000, stock: 40, sku: "SKU-008", isFeatured: false, isActive: true,
    categories: ["mesas"],
    images: [
      { url: "/img/products/p3.jpg", altText: "Escritorio Nordico de Bambu", sortOrder: 0, isPrimary: true },
    ],
  },
  {
    name: "Alfombra Persa Beige Dorada",
    slug: "alfombra-persa-beige-dorada",
    description: "Alfombra de estilo persa en tonos beige, crema y dorado. Tejido de lana y viscosa con flecos naturales en los extremos. Medidas: 160 x 230 cm. Lavado en seco recomendado.",
    priceCents: 380000, stock: 200, sku: "SKU-009", isFeatured: false, isActive: true,
    categories: ["alfombras"],
    images: [
      { url: "/img/products/p2.jpg", altText: "Alfombra Persa Beige Dorada", sortOrder: 0, isPrimary: true },
    ],
  },
  {
    name: "Taburete de Bar Industrial Negro",
    slug: "taburete-bar-industrial-negro",
    description: "Taburete de barra con asiento giratorio regulable en ecocuero negro y estructura de acero lacado. Compatible con desayunadores y barras de cocina. Altura de asiento regulable: 65-80 cm. Carga maxima: 120 kg.",
    priceCents: 249000, stock: 40, sku: "SKU-010", isFeatured: false, isActive: true,
    categories: ["sillas"],
    images: [
      { url: "/img/products/p1.jpg", altText: "Taburete de Bar Industrial Negro", sortOrder: 0, isPrimary: true },
    ],
  },
];

const usuarios = [
  { email: "admin@homestore.com",  password: "Admin1234!",    firstName: "Admin", lastName: "HomeStore", role: Role.ADMIN },
  { email: "demo@homestore.com",   password: "Customer1234!", firstName: "Demo",  lastName: "Cliente",   role: Role.CUSTOMER },
  { email: "cliente@homestore.com", password: "Customer1234!", firstName: "Sofía", lastName: "García",   role: Role.CUSTOMER },
];

async function main() {
  console.log("Seeding...");

  // ─── CATEGORÍAS ──────────────────────────────────────────────────────────────
  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder, isActive: true },
      create: { name: cat.name, slug: cat.slug, description: cat.description, sortOrder: cat.sortOrder, isActive: true },
    });
  }
  console.log(`✓ ${categorias.length} categorías creadas/actualizadas`);

  // ─── USUARIOS ────────────────────────────────────────────────────────────────
  const SALT_ROUNDS = 10;
  for (const u of usuarios) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { firstName: u.firstName, lastName: u.lastName, role: u.role },
      create: { email: u.email, passwordHash, firstName: u.firstName, lastName: u.lastName, role: u.role },
    });
  }
  console.log(`✓ ${usuarios.length} usuarios (1 admin + 2 clientes de prueba)`);

  // ─── PRODUCTOS ───────────────────────────────────────────────────────────────
  // Upsert por slug; imágenes y categorías se reconcilian (deleteMany + create)
  // para mantener idempotencia sin acumular duplicados.
  for (const p of productos) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name, description: p.description, priceCents: p.priceCents,
        stock: p.stock, sku: p.sku, isFeatured: p.isFeatured, isActive: p.isActive,
      },
      create: {
        name: p.name, slug: p.slug, description: p.description, priceCents: p.priceCents,
        stock: p.stock, sku: p.sku, isFeatured: p.isFeatured, isActive: p.isActive,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: p.images.map((img) => ({ productId: product.id, ...img })),
    });

    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    for (const slug of p.categories) {
      const category = await prisma.category.findUnique({ where: { slug } });
      if (category) {
        await prisma.productCategory.create({
          data: { productId: product.id, categoryId: category.id },
        });
      }
    }
  }
  console.log(`✓ ${productos.length} productos con imágenes y categorías`);

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

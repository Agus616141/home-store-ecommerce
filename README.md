# home.store — E-Commerce de productos para el hogar

Plataforma de e-commerce full-stack para venta de muebles y decoración del hogar.
Monorepo con API REST (Node + Express + Prisma) y cliente web (React + Vite + Tailwind),
pagos con Stripe (o simulador), autenticación JWT y eventos en tiempo real vía SSE.

> Proyecto desarrollado con un sistema multi-agente (Base de Datos, Backend, Frontend).

---

## Tabla de contenidos

- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Puesta en marcha (local)](#puesta-en-marcha-local)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos y seed](#base-de-datos-y-seed)
- [Usuarios de prueba](#usuarios-de-prueba)
- [Scripts útiles](#scripts-útiles)
- [API REST](#api-rest)
- [Testing y CI](#testing-y-ci)
- [Deploy](#deploy)
- [Estructura del repositorio](#estructura-del-repositorio)

---

## Stack

| Capa | Tecnología |
|---|---|
| **Backend** | Node.js, Express 5, TypeScript, Prisma 7 |
| **Base de datos** | PostgreSQL 16 (Docker en local) |
| **Frontend** | React 18, Vite 6, TypeScript, Tailwind CSS v4, React Router 6, Zustand |
| **Pagos** | Stripe (con modo simulador para desarrollo) |
| **Auth** | JWT access (en memoria) + refresh (cookie httpOnly) |
| **Tiempo real** | Server-Sent Events (SSE) |
| **Seguridad** | Helmet, CORS, express-rate-limit, RBAC, validación con Zod |
| **Tooling** | pnpm (workspaces), Husky + lint-staged, ESLint, Prettier, Vitest, GitHub Actions |

---

## Arquitectura

Monorepo gestionado con **pnpm workspaces**:

```
home.store/
├─ apps/
│  ├─ api/        → API REST (Express + Prisma)
│  └─ web/        → SPA cliente (React + Vite)
└─ packages/
   └─ types/      → Enums y tipos compartidos entre api y web (@homestore/types)
```

- **`packages/types`** es la fuente única de enums compartidos (`Role`, `OrderStatus`,
  `PaymentStatus`, `ShippingMethod`). Si cambia un enum, cambia en el schema de Prisma
  y en este paquete en el mismo commit.
- La API expone todo bajo el prefijo `/api/*` y un endpoint de salud en `/health`.
- El frontend organiza el código por **features** (catalog, cart, checkout, orders,
  account, admin, etc.), cada una con sus controladores y vistas.

---

## Requisitos previos

- **Node.js** ≥ 20
- **pnpm** ≥ 11 (`corepack enable` lo provee automáticamente)
- **Docker Desktop** (para PostgreSQL local)

---

## Puesta en marcha (local)

```bash
# 1. Clonar e instalar dependencias (desde la raíz del monorepo)
pnpm install

# 2. Levantar PostgreSQL con Docker
docker compose up -d

# 3. Configurar variables de entorno (API y Web)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# (en local los valores por defecto ya funcionan con el Docker de arriba)

# 4. Aplicar migraciones y cargar datos de prueba
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed

# 5. Arrancar API y Web (en dos terminales)
pnpm dev:api      # http://localhost:8080
pnpm dev:web      # http://localhost:5173
```

Para inspeccionar la base visualmente: `pnpm --filter api studio` → http://localhost:5555

---

## Variables de entorno

### API (`apps/api/.env`)

Copiar desde `apps/api/.env.example`. Claves principales:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL (pooled) |
| `DIRECT_URL` | Conexión directa para migraciones (en local = `DATABASE_URL`) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secretos JWT (mínimo 32 caracteres) |
| `CLIENT_URL` | URL canónica del front (CORS y redirects de pago) |
| `CORS_ORIGINS` | Orígenes CORS adicionales separados por coma (opcional) |
| `PAYMENTS_SIMULATOR` | `true` = pagos simulados sin Stripe real |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Solo si `PAYMENTS_SIMULATOR=false` |

### Web (`apps/web/.env.local`)

Copiar desde `apps/web/.env.example`.

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API, sin `/api` (ej. `http://localhost:8080`) |

> ⚠️ Los archivos `.env` reales están en `.gitignore` y **nunca se versionan**.
> Solo se commitean los `.env.example` (plantillas sin secretos).

---

## Base de datos y seed

El modelo de datos es la única fuente de verdad en `apps/api/prisma/schema.prisma`
(13 modelos + 4 enums). Los precios se almacenan en **centavos enteros** (`Int`, nunca `Float`).

```bash
# Aplicar migraciones (producción/CI)
pnpm --filter api exec prisma migrate deploy

# Crear una nueva migración (desarrollo)
pnpm --filter api exec prisma migrate dev --name <nombre>

# Cargar datos de prueba (idempotente — se puede correr N veces)
pnpm --filter api exec prisma db seed

# Estado de migraciones
pnpm --filter api exec prisma migrate status
```

El **seed es idempotente** (usa `upsert` por clave natural) y carga:
- 10 categorías (sofás, sillas, mesas, camas, armarios, iluminación, cuadros, alfombras, vajilla, utensilios)
- 10 productos con imágenes y categorías
- 3 usuarios de prueba (ver abajo)

---

## Usuarios de prueba

El seed crea estos usuarios para probar la aplicación de inmediato:

| Rol | Email | Contraseña |
|---|---|---|
| 🛡️ **Admin** | `admin@homestore.com` | `Admin1234!` |
| 👤 Cliente | `demo@homestore.com` | `Customer1234!` |
| 👤 Cliente | `cliente@homestore.com` | `Customer1234!` |

- El usuario **admin** tiene acceso al panel de administración (gestión de productos, órdenes, etc.).
- Los clientes permiten probar el flujo completo de compra (carrito, checkout, órdenes, wishlist, reseñas).

> Estas credenciales son **solo para entornos de prueba/desarrollo**. En producción,
> creá usuarios reales y cambiá/eliminá las cuentas demo.

---

## Scripts útiles

Desde la raíz del monorepo:

| Comando | Acción |
|---|---|
| `pnpm dev:api` | Levanta la API en modo watch |
| `pnpm dev:web` | Levanta el frontend (Vite) |
| `pnpm build` | Compila API y Web para producción |
| `pnpm lint` | Lint de todos los paquetes |
| `pnpm typecheck` | Chequeo de tipos de todos los paquetes |
| `pnpm test` | Tests unitarios de la API |

API específicos (`pnpm --filter api <script>`): `test:integration`, `test:coverage`, `studio`, `format`.

---

## API REST

Base: `/api`. Principales grupos de rutas (ver `apps/api/openapi.yaml` para el contrato completo):

| Recurso | Prefijo | Descripción |
|---|---|---|
| Auth | `/api/auth` | Registro, login, refresh, logout |
| Usuarios | `/api/users` | Perfil y direcciones |
| Categorías | `/api/categories` | Árbol de categorías |
| Productos | `/api/products` | Catálogo, búsqueda, detalle |
| Reseñas | `/api/products/:id/reviews`, `/api/reviews` | Reseñas por producto |
| Carrito | `/api/cart` | Carrito del usuario |
| Órdenes | `/api/orders` | Creación y consulta de pedidos |
| Pagos | `/api/payments` | Checkout y webhook de Stripe |
| Wishlist | `/api/wishlist` | Lista de favoritos |
| Analytics | `/api/analytics` | Métricas (admin) |
| Eventos | `/api/events/stream` | Stream SSE en tiempo real |
| Salud | `/health` | Health check |

Características transversales: autenticación JWT, control de acceso por rol (RBAC),
rate limiting, validación de entrada con Zod e idempotencia de webhooks de Stripe.

---

## Testing y CI

```bash
pnpm --filter api test               # unitarios (Vitest)
pnpm --filter api test:integration   # integración contra PostgreSQL real
pnpm --filter api test:coverage      # cobertura
```

- **Husky + lint-staged** corren lint + format en cada commit.
- **GitHub Actions** (`.github/workflows/ci.yml`) ejecuta en cada push/PR a `main`:
  lint, typecheck, tests unitarios y de integración contra una PostgreSQL real, y build.

---

## Deploy

Targets recomendados (ver `apps/api/DEPLOY.md` y `apps/web/DEPLOY.md` para el detalle):

- **API + PostgreSQL** → Railway (el script `start` corre `prisma migrate deploy` antes de arrancar)
- **Web** → Vercel
- **Pagos** → Stripe real (`PAYMENTS_SIMULATOR=false` + claves `sk_live_…` / `whsec_…`)

---

## Estructura del repositorio

```
home.store/
├─ apps/
│  ├─ api/
│  │  ├─ prisma/            # schema, migraciones, seed
│  │  ├─ src/
│  │  │  ├─ modules/        # auth, users, products, cart, orders, payments, …
│  │  │  ├─ middlewares/    # auth, rbac, rate limit, validación, errores
│  │  │  ├─ lib/            # prisma, stripe, logger, eventos, errores
│  │  │  └─ config/         # validación de env
│  │  ├─ openapi.yaml       # contrato de la API
│  │  └─ DEPLOY.md
│  └─ web/
│     ├─ src/
│     │  ├─ features/       # catalog, cart, checkout, orders, account, admin, …
│     │  ├─ layouts/        # estructura de páginas
│     │  ├─ shared/         # componentes y utilidades comunes
│     │  └─ app/            # router, App, guards (ProtectedRoute, RequireAdmin)
│     └─ DEPLOY.md
├─ packages/
│  └─ types/                # enums y tipos compartidos
├─ docker-compose.yml       # PostgreSQL local
└─ pnpm-workspace.yaml
```

---

## Licencia

Proyecto privado. Todos los derechos reservados.

# Backend deploy

Target recomendado:
- API: Railway
- DB: Railway PostgreSQL
- Web: Vercel

## Railway API

Configurar el servicio desde la raiz del monorepo:

```bash
Root directory: apps/api
Build command: pnpm build
Start command: pnpm start
```

El script `start` ejecuta `prisma migrate deploy` antes de iniciar `node dist/server.js`.

Variables requeridas:

```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=<railway-postgres-pooled-url>
DIRECT_URL=<railway-postgres-direct-url>
JWT_ACCESS_SECRET=<minimo-32-caracteres>
JWT_REFRESH_SECRET=<minimo-32-caracteres>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://<dominio-vercel>
CORS_ORIGINS=https://<preview-1>.vercel.app,https://<preview-2>.vercel.app
PAYMENTS_SIMULATOR=true
```

Para Stripe real:

```bash
PAYMENTS_SIMULATOR=false
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Webhook Stripe:

```text
POST https://<railway-api>/api/payments/webhook
```

## Vercel web

Variables requeridas en el frontend:

```bash
VITE_API_URL=https://<railway-api>
```

El cliente debe enviar cookies en requests autenticados (`credentials: "include"`) y conectar SSE a:

```text
GET https://<railway-api>/api/events/stream
```

## Predeploy local

Desde `apps/api`:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm build
```

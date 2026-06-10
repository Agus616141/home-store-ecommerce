# Deploy del Frontend Web (Vercel)

App: `@home-store/web` — React 18 + Vite + Tailwind v4, dentro del monorepo pnpm.

## Configuración en Vercel

El repo ya trae `vercel.json` en la raíz del monorepo. Al importar el proyecto:

| Ajuste | Valor |
|---|---|
| **Root Directory** | la **raíz del repo** (NO `apps/web`) — el build necesita el workspace completo para resolver `@homestore/types` |
| Framework Preset | Vite (autodetectado por `vercel.json`) |
| Install Command | `pnpm install --frozen-lockfile` (de `vercel.json`) |
| Build Command | `pnpm --filter @home-store/web build` (de `vercel.json`) |
| Output Directory | `apps/web/dist` (de `vercel.json`) |

### Variables de entorno (obligatorio)

En **Project Settings → Environment Variables**, scope **Production**:

```
VITE_API_URL = https://<tu-api-en-produccion>     # sin barra final, SIN /api
```

> Sin esta variable, el build cae al fallback `http://localhost:8080` y la app
> en producción no podrá hablar con la API. Ver `.env.production.example`.

## Por qué cada pieza

- **`rewrites` → `/index.html`**: la app usa `createBrowserRouter`. Sin el fallback,
  recargar en rutas profundas (`/product/x`, `/account`, `/admin/...`) daría 404.
  Vercel sirve primero los archivos estáticos de `dist/assets`, así que el rewrite
  solo afecta a las rutas de la SPA.
- **`.npmrc` (`verify-deps-before-run=false`)**: evita el bug de pnpm
  `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` al correr scripts con deps `workspace:*`.
- **Cache de `/assets/*`**: los assets llevan hash en el nombre → cache inmutable de 1 año.

## Checklist pre-deploy

- [ ] `VITE_API_URL` apunta al dominio real de la API (no localhost).
- [ ] La API de producción permite **CORS** desde el dominio del web y acepta
      cookies `credentials: include` (refresh token httpOnly).
- [ ] Las imágenes de producto en la DB NO tienen host `localhost:5173`
      (migrar al dominio/CDN de producción — tarea de Backend/DB).
- [ ] Gates en verde: `pnpm --filter @home-store/web typecheck && lint && build`.

## Build local de verificación

```bash
# desde la raíz del monorepo
pnpm --filter @home-store/web build
pnpm --filter @home-store/web preview   # sirve dist/ en local
```

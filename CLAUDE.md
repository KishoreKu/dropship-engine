# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend
```bash
npm run dev          # Start backend with hot reload (tsx watch)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled backend
npm run lint         # ESLint on src/**/*.ts
npm run typecheck    # Type-check without emit
npm run migrate      # Run Prisma schema push
npm run seed         # Seed the database
```

### Frontend
```bash
cd frontend && npm run dev    # Vite dev server on :5173
cd frontend && npm run build  # Production build
```

### Full stack via Docker
```bash
docker-compose up   # Postgres :5432, backend :3000, frontend :5173
```

> There is no test framework configured yet.

## Architecture

This is a **layered Express + React monorepo** connecting four external platforms for dropshipping automation.

```
Request → Route → Service → Integration (external API)
                          ↘ Prisma (PostgreSQL)
```

### Backend layers (`src/`)

| Layer | Path | Role |
|---|---|---|
| Routes | `src/routes/` | Input validation, HTTP glue |
| Services | `src/services/` | Business logic, orchestration |
| Integrations | `src/integrations/` | One file per external API, axios-based |
| DB | `src/db/schema.prisma` | Prisma schema; client in `src/db/` |
| Config | `src/config/index.ts` | Validates all required env vars at startup — app fails fast if any are missing |

### Key architectural details

**In-memory state**: `fulfillmentService` and `orderService` use `Map<>` as their store today — Prisma models (`FulfillmentOrder`, `ImportedProduct`) exist but are not yet wired. New work should migrate these maps to Prisma queries.

**Fulfillment loop**: `node-cron` fires `fulfillmentService.pollStatuses()` every 5 minutes (wired in `src/index.ts`). It skips orders in terminal states (`shipped`, `delivered`, `cancelled`).

**SKU convention**: Dropshippable line items are identified by SKUs starting with `AE-` (e.g. `AE-<aliExpressProductId>-<variantId>`). The fulfillment service filters on this prefix.

**Webhook body**: `/webhooks` uses a custom `verify` callback to attach `req.rawBody` (needed for Shopify HMAC validation). The `/api` prefix uses standard `express.json()`. Do not swap these.

**Auth**: All `/api/*` routes require a `Bearer <JWT>` header. The JWT payload is `{ sub: string, role: 'admin' | 'user' }` and is attached to `req.user` by `authMiddleware`. `generateToken()` in `src/middleware/auth.ts` creates tokens (24h expiry).

### External integrations (`src/integrations/`)

| File | Service | Auth mechanism |
|---|---|---|
| `shopify.ts` | Shopify Admin API | `X-Shopify-Access-Token` header |
| `aliexpress.ts` | AliExpress via RapidAPI | `X-RapidAPI-Key` header |
| `dsers.ts` | DSers fulfillment | HMAC-SHA256 request signing (`apiKey:timestamp:body`) |
| `junglescout.ts` | JungleScout Amazon research | Basic auth (`email:apiKey`, base64) |

All four are exported as singletons from their respective files.

### Database (`src/db/schema.prisma`)

Four models: `Account`, `ImportedProduct`, `FulfillmentOrder`, `SyncLog`. `shopifyProductId` and `shopifyOrderId` are `BigInt` — use `Number()` or `BigInt()` conversions carefully at service boundaries since JSON does not serialize `BigInt` natively.

### Frontend (`frontend/src/`)

Single-page React app with five pages (`Dashboard`, `ProductsPage`, `ImportPage`, `OrdersPage`, `ResearchPage`). All backend calls go through `frontend/src/services/api.ts`. Routing is client-side via React Router in `App.tsx`.

## Environment

Copy `.env.example` to `.env`. The required vars (app will throw on startup if missing):

- `JWT_SECRET`, `DATABASE_URL`
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_WEBHOOK_SECRET`
- `ALIEXPRESS_RAPIDAPI_KEY`, `ALIEXPRESS_RAPIDAPI_HOST`
- `DSERS_API_KEY`, `DSERS_API_SECRET`
- `JUNGLE_SCOUT_API_KEY`, `JUNGLE_SCOUT_EMAIL`

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Backend (repo root):

```bash
npm run dev          # tsx watch src/index.ts (hot reload)
npm run build        # tsc → dist/
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src --ext .ts
npm run migrate      # tsx src/db/migrate.ts
npm run seed         # tsx src/db/seed.ts
```

Frontend (`frontend/`): `npm run dev` (Vite, :5173), `npm run build`, `npm run preview`.

Full stack locally: `docker-compose up` (Postgres 16 on :5432, backend on :3000, frontend on :5173). Backend needs a populated `.env` (copy `.env.example`) — the config loader (`src/config/index.ts`) throws at startup if any required var is missing, and nearly all integration keys are required, so the server won't boot with a partial `.env`.

There is no test suite and no test runner configured.

Prisma schema lives at the non-default path `src/db/schema.prisma` — pass `--schema src/db/schema.prisma` to any direct `prisma` CLI invocation (e.g. `npx prisma generate --schema src/db/schema.prisma`).

## Architecture

Multi-channel dropshipping engine. The product pipeline runs across four external services, each wrapped by a client in `src/integrations/`:

**JungleScout** (find winning products on Amazon) → **AliExpress** (source the supplier product) → **Shopify** (list it and take customer orders) → **DSers** (place/track the supplier fulfillment order).

Layering is strict three-tier: `src/routes/` (Express routers, thin, try/catch per handler) → `src/services/` (orchestration across integrations + Prisma) → `src/integrations/` (one class per external API, all config via `src/config/index.ts`).

Key structural facts that span multiple files:

- **Shopify is the system of record for orders and products.** There is no local orders table — `order.service.ts` and `product.service.ts` proxy live Shopify API calls. A Prisma schema exists (`ImportedProduct`, `FulfillmentOrder`, `SyncLog`, `Account`) but **nothing instantiates PrismaClient yet** — import/fulfillment state lives in in-memory stores inside the services (see `product.service.ts`), so it is lost on restart and not shared across replicas.
- **Order flow is webhook-driven**: Shopify `orders/create` → `POST /webhooks/shopify/:topic` (`src/routes/webhooks.ts`) → HMAC verification (`shopify.verifyWebhook`) → `fulfillmentService.create()` places the DSers order. `src/index.ts` mounts a special JSON parser on `/webhooks` that captures the raw body onto `req.rawBody` for HMAC verification — Shopify HMACs must be computed over the raw bytes, not a re-`JSON.stringify` of the parsed body.
- **Auth**: all `/api/*` routes sit behind `authMiddleware` (JWT Bearer, `src/middleware/auth.ts`); `/health`, `/auth/*`, and `/webhooks/*` are public. `POST /auth/login` (rate-limited) checks a single admin credential from env — `ADMIN_EMAIL` plus a scrypt `ADMIN_PASSWORD_HASH` (generate with `npm run hash-password -- '<password>'`) — and issues a 24 h JWT. There is no users table; swapping to per-user auth means replacing the credential check in `src/routes/auth.ts`.
- **Background work runs in-process**: a `node-cron` job in `src/index.ts` polls DSers fulfillment statuses every 5 minutes. It runs in every replica, so scaling the backend beyond one replica duplicates polling.
- **Frontend** (`frontend/`) is a Vite + React 19 dashboard that talks to the backend via `frontend/src/services/api.ts`, reading the JWT from `localStorage`. The API base URL is baked in at build time via `VITE_API_URL` (Docker build arg), not runtime config.

## Deployment

Azure Container Apps, two container images (backend from root `Dockerfile`, frontend from `frontend/Dockerfile`), built in ACR.

- One-time bootstrap: `scripts/deploy-infra.sh` (prompts for secrets, deploys `infra/main.bicep`; secrets land in Key Vault and are wired to the apps via managed identity).
- Continuous deploy: `.github/workflows/deploy.yml` on push to `main` — a `check` job (typecheck both packages + frontend build) gates a `deploy` job that builds both images in ACR tagged with the git SHA, then swaps image tags via `az containerapp update`. CI deliberately does **not** redeploy the Bicep template: a full template run requires re-supplying every `@secure()` param. Template changes go out via `scripts/deploy-infra.sh`.
- The workflow reads the backend's FQDN and passes it as `VITE_API_URL` when building the frontend image, so the frontend build depends on the backend Container App already existing.

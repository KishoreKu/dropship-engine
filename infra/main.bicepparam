using './main.bicep'

// ── Non-sensitive parameters ──────────────────────────────────────────────────
param location         = 'eastus'
param projectName      = 'dropship'
param githubRepo       = 'KishoreKu/dropship-engine'
param pgAdminUser      = 'pgadmin'
param shopifyStoreDomain   = 'your-store.myshopify.com'
param shopifyApiVersion    = '2024-10'
param dsersWarehouseId     = 'default'
param adminEmail           = 'kishore@westley-group.com'

// ── Secrets — DO NOT commit real values ──────────────────────────────────────
// Pass these via CLI on first deploy:
//   az deployment group create ... \
//     --parameters infra/main.bicepparam \
//     --parameters pgAdminPassword=$PG_PASS jwtSecret=$JWT ...
//
// On subsequent CI/CD runs (image-only updates), secrets already live in
// Key Vault and are NOT re-supplied — see .github/workflows/deploy.yml.

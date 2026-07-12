#!/usr/bin/env bash
# One-time infra bootstrap. Run locally with az login.
# Usage: bash scripts/deploy-infra.sh
set -euo pipefail

RG="rg-dropship"
LOCATION="eastus"

echo "=== Resource Group ==="
az group create --name "$RG" --location "$LOCATION" -o none

echo "=== Bicep deployment (enter secrets when prompted) ==="
az deployment group create \
  --resource-group "$RG" \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam \
  --parameters \
      pgAdminPassword="$(read -rsp 'pgAdminPassword: ' v && echo "$v")" \
      jwtSecret="$(read -rsp $'\njwtSecret: ' v && echo "$v")" \
      shopifyApiKey="$(read -rsp $'\nshopifyApiKey: ' v && echo "$v")" \
      shopifyApiSecret="$(read -rsp $'\nshopifyApiSecret: ' v && echo "$v")" \
      shopifyAdminAccessToken="$(read -rsp $'\nshopifyAdminAccessToken: ' v && echo "$v")" \
      shopifyWebhookSecret="$(read -rsp $'\nshopifyWebhookSecret: ' v && echo "$v")" \
      aliexpressRapidApiKey="$(read -rsp $'\naliexpressRapidApiKey: ' v && echo "$v")" \
      dsersApiKey="$(read -rsp $'\ndsersApiKey: ' v && echo "$v")" \
      dsersApiSecret="$(read -rsp $'\ndsersApiSecret: ' v && echo "$v")" \
      jungleScoutApiKey="$(read -rsp $'\njungleScoutApiKey: ' v && echo "$v")" \
      adminPasswordHash="$(read -rsp $'\nadminPasswordHash (npm run hash-password): ' v && echo "$v")" \
  --query 'properties.outputs' -o json | tee infra/outputs.json

echo ""
echo "=== Add these 3 secrets to GitHub (Settings → Secrets → Actions) ==="
jq -r '"AZURE_CLIENT_ID:       " + .ghClientId.value,
        "AZURE_TENANT_ID:       " + .ghTenantId.value,
        "AZURE_SUBSCRIPTION_ID: " + .ghSubscriptionId.value' infra/outputs.json

echo ""
echo "=== Seed the database (run migration) ==="
echo "Backend URL: $(jq -r '.backendUrl.value' infra/outputs.json)"
echo "Run: DATABASE_URL=<from Key Vault> npm run migrate"

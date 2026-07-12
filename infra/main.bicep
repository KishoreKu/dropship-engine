targetScope = 'resourceGroup'

// ── Parameters ───────────────────────────────────────────────────────────────

@description('Azure region')
param location string = resourceGroup().location

@description('Short prefix used in all resource names')
param projectName string = 'dropship'

@description('GitHub repo in owner/repo format for OIDC trust')
param githubRepo string

@description('PostgreSQL admin username')
param pgAdminUser string = 'pgadmin'

@secure()
param pgAdminPassword string

@secure()
param jwtSecret string

@secure()
param shopifyApiKey string

@secure()
param shopifyApiSecret string

@secure()
param shopifyAdminAccessToken string

@description('e.g. your-store.myshopify.com')
param shopifyStoreDomain string

@secure()
param shopifyWebhookSecret string

@secure()
param aliexpressRapidApiKey string

@secure()
param dsersApiKey string

@secure()
param dsersApiSecret string

@secure()
param jungleScoutApiKey string

@description('Admin login email for the dashboard')
param adminEmail string

@description('scrypt hash from: npm run hash-password')
@secure()
param adminPasswordHash string

param shopifyApiVersion string = '2024-10'
param dsersWarehouseId string = 'default'

// ── Variables ────────────────────────────────────────────────────────────────

var suffix       = uniqueString(resourceGroup().id)
var acrName      = '${projectName}acr${suffix}'
var kvName       = '${projectName}-kv-${take(suffix, 8)}'
var pgServerName = '${projectName}-pg-${take(suffix, 8)}'
var pgDbName     = projectName
var acaEnvName   = '${projectName}-env'
var backendApp   = '${projectName}-backend'
var frontendApp  = '${projectName}-frontend'
var ghUamiName   = '${projectName}-gh-uami'     // GitHub Actions identity
var appUamiName  = '${projectName}-app-uami'    // Container Apps identity

var kvSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e0'
var acrPullRoleId       = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var acrPushRoleId       = '8311e382-0749-4cb8-b61a-304f252e45ec'
var contributorRoleId   = 'b24988ac-6180-42a0-ab88-20f7382dd24f'

// ── Managed Identities ───────────────────────────────────────────────────────

resource ghUami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: ghUamiName
  location: location
}

resource ghFederatedCred 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: ghUami
  name: 'github-oidc'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubRepo}:ref:refs/heads/main'
    audiences: ['api://AzureADTokenExchange']
  }
}

resource appUami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: appUamiName
  location: location
}

// ── Container Registry ───────────────────────────────────────────────────────

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: false }
}

// GitHub Actions identity can push images
resource ghAcrPush 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, ghUami.id, acrPushRoleId)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPushRoleId)
    principalId: ghUami.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// GitHub Actions needs Contributor on RG to update Container Apps
resource ghContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, ghUami.id, contributorRoleId)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', contributorRoleId)
    principalId: ghUami.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Container Apps identity can pull images
resource appAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, appUami.id, acrPullRoleId)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: appUami.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Key Vault ────────────────────────────────────────────────────────────────

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

// Container Apps identity can read secrets
resource appKvRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(kv.id, appUami.id, kvSecretsUserRoleId)
  scope: kv
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalId: appUami.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Key Vault Secrets ────────────────────────────────────────────────────────

resource kvSecretDbUrl 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'database-url'
  properties: {
    value: 'postgresql://${pgAdminUser}:${pgAdminPassword}@${pgServerName}.postgres.database.azure.com:5432/${pgDbName}?sslmode=require'
  }
}

resource kvSecretJwt 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'jwt-secret'
  properties: { value: jwtSecret }
}

resource kvSecretShopifyKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'shopify-api-key'
  properties: { value: shopifyApiKey }
}

resource kvSecretShopifySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'shopify-api-secret'
  properties: { value: shopifyApiSecret }
}

resource kvSecretShopifyToken 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'shopify-admin-token'
  properties: { value: shopifyAdminAccessToken }
}

resource kvSecretShopifyWebhook 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'shopify-webhook-secret'
  properties: { value: shopifyWebhookSecret }
}

resource kvSecretAliexpress 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'aliexpress-rapidapi-key'
  properties: { value: aliexpressRapidApiKey }
}

resource kvSecretDsersKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'dsers-api-key'
  properties: { value: dsersApiKey }
}

resource kvSecretDsersSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'dsers-api-secret'
  properties: { value: dsersApiSecret }
}

resource kvSecretJungleScout 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'jungle-scout-api-key'
  properties: { value: jungleScoutApiKey }
}

resource kvSecretAdminPwHash 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'admin-password-hash'
  properties: { value: adminPasswordHash }
}

// ── PostgreSQL ───────────────────────────────────────────────────────────────

resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: pgServerName
  location: location
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    administratorLogin: pgAdminUser
    administratorLoginPassword: pgAdminPassword
    storage: { storageSizeGB: 32 }
    version: '16'
    network: { publicNetworkAccess: 'Enabled' }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
  }
}

resource pgDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: pg
  name: pgDbName
}

// Allow Azure services to reach PostgreSQL
resource pgFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: pg
  name: 'AllowAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

// ── Container Apps Environment ────────────────────────────────────────────────

resource acaEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: acaEnvName
  location: location
  properties: {}
}

// ── Backend Container App ─────────────────────────────────────────────────────

param backendImageTag string = 'latest'

resource backend 'Microsoft.App/containerApps@2024-03-01' = {
  name: backendApp
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${appUami.id}': {} }
  }
  properties: {
    managedEnvironmentId: acaEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: appUami.id
        }
      ]
      secrets: [
        { name: 'database-url',           keyVaultUrl: kvSecretDbUrl.properties.secretUri,       identity: appUami.id }
        { name: 'jwt-secret',             keyVaultUrl: kvSecretJwt.properties.secretUri,          identity: appUami.id }
        { name: 'shopify-api-key',        keyVaultUrl: kvSecretShopifyKey.properties.secretUri,   identity: appUami.id }
        { name: 'shopify-api-secret',     keyVaultUrl: kvSecretShopifySecret.properties.secretUri,identity: appUami.id }
        { name: 'shopify-admin-token',    keyVaultUrl: kvSecretShopifyToken.properties.secretUri, identity: appUami.id }
        { name: 'shopify-webhook-secret', keyVaultUrl: kvSecretShopifyWebhook.properties.secretUri,identity: appUami.id }
        { name: 'aliexpress-rapidapi-key',keyVaultUrl: kvSecretAliexpress.properties.secretUri,  identity: appUami.id }
        { name: 'dsers-api-key',          keyVaultUrl: kvSecretDsersKey.properties.secretUri,    identity: appUami.id }
        { name: 'dsers-api-secret',       keyVaultUrl: kvSecretDsersSecret.properties.secretUri, identity: appUami.id }
        { name: 'jungle-scout-api-key',   keyVaultUrl: kvSecretJungleScout.properties.secretUri, identity: appUami.id }
        { name: 'admin-password-hash',    keyVaultUrl: kvSecretAdminPwHash.properties.secretUri, identity: appUami.id }
      ]
    }
    template: {
      scale: { minReplicas: 1, maxReplicas: 3 }
      containers: [
        {
          name: 'backend'
          image: '${acr.properties.loginServer}/backend:${backendImageTag}'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'NODE_ENV',                     value: 'production' }
            { name: 'PORT',                          value: '3000' }
            { name: 'DATABASE_URL',                  secretRef: 'database-url' }
            { name: 'JWT_SECRET',                    secretRef: 'jwt-secret' }
            { name: 'SHOPIFY_API_KEY',               secretRef: 'shopify-api-key' }
            { name: 'SHOPIFY_API_SECRET',            secretRef: 'shopify-api-secret' }
            { name: 'SHOPIFY_ADMIN_ACCESS_TOKEN',    secretRef: 'shopify-admin-token' }
            { name: 'SHOPIFY_STORE_DOMAIN',          value: shopifyStoreDomain }
            { name: 'SHOPIFY_WEBHOOK_SECRET',        secretRef: 'shopify-webhook-secret' }
            { name: 'SHOPIFY_API_VERSION',           value: shopifyApiVersion }
            { name: 'ALIEXPRESS_RAPIDAPI_KEY',       secretRef: 'aliexpress-rapidapi-key' }
            { name: 'ALIEXPRESS_RAPIDAPI_HOST',      value: 'aliexpress-datahub.p.rapidapi.com' }
            { name: 'DSERS_API_KEY',                 secretRef: 'dsers-api-key' }
            { name: 'DSERS_API_SECRET',              secretRef: 'dsers-api-secret' }
            { name: 'DSERS_WAREHOUSE_ID',            value: dsersWarehouseId }
            { name: 'JUNGLE_SCOUT_API_KEY',          secretRef: 'jungle-scout-api-key' }
            { name: 'ADMIN_EMAIL',                   value: adminEmail }
            { name: 'ADMIN_PASSWORD_HASH',           secretRef: 'admin-password-hash' }
          ]
        }
      ]
    }
  }
  dependsOn: [appKvRole, appAcrPull]
}

// ── Frontend Container App ────────────────────────────────────────────────────

param frontendImageTag string = 'latest'

resource frontend 'Microsoft.App/containerApps@2024-03-01' = {
  name: frontendApp
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${appUami.id}': {} }
  }
  properties: {
    managedEnvironmentId: acaEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        transport: 'http'
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: appUami.id
        }
      ]
    }
    template: {
      scale: { minReplicas: 1, maxReplicas: 2 }
      containers: [
        {
          name: 'frontend'
          image: '${acr.properties.loginServer}/frontend:${frontendImageTag}'
          resources: { cpu: json('0.25'), memory: '0.5Gi' }
        }
      ]
    }
  }
  dependsOn: [appAcrPull]
}

// ── Outputs ───────────────────────────────────────────────────────────────────

output acrLoginServer   string = acr.properties.loginServer
output acrName          string = acr.name
output keyVaultName     string = kv.name
output backendUrl       string = 'https://${backend.properties.configuration.ingress.fqdn}'
output frontendUrl      string = 'https://${frontend.properties.configuration.ingress.fqdn}'
output ghClientId       string = ghUami.properties.clientId
output ghTenantId       string = subscription().tenantId
output ghSubscriptionId string = subscription().subscriptionId

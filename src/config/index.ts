import dotenv from 'dotenv';
dotenv.config();

function req(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: req('JWT_SECRET'),
  database: { url: req('DATABASE_URL') },

  auth: {
    adminEmail: req('ADMIN_EMAIL'),
    adminPasswordHash: req('ADMIN_PASSWORD_HASH'),
  },

  shopify: {
    apiKey: req('SHOPIFY_API_KEY'),
    apiSecret: req('SHOPIFY_API_SECRET'),
    adminToken: req('SHOPIFY_ADMIN_ACCESS_TOKEN'),
    storeDomain: req('SHOPIFY_STORE_DOMAIN'),
    webhookSecret: req('SHOPIFY_WEBHOOK_SECRET'),
    apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10',
  },

  aliexpress: {
    rapidApiKey: req('ALIEXPRESS_RAPIDAPI_KEY'),
    rapidApiHost: req('ALIEXPRESS_RAPIDAPI_HOST'),
    affiliateId: process.env.ALIEXPRESS_AFFILIATE_ID || '',
  },

  dsers: {
    apiKey: req('DSERS_API_KEY'),
    apiSecret: req('DSERS_API_SECRET'),
    warehouseId: process.env.DSERS_WAREHOUSE_ID || 'default',
  },

  junglescout: {
    apiKey: req('JUNGLE_SCOUT_API_KEY'),
    email: req('JUNGLE_SCOUT_EMAIL'),
  },
} as const;

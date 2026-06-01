import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import type {
  ShopifyProduct,
  ShopifyProductInput,
  ShopifyOrder,
} from '../types';

export class ShopifyClient {
  private api: AxiosInstance;
  private domain: string;

  constructor() {
    this.domain = config.shopify.storeDomain;
    this.api = axios.create({
      baseURL: `https://${this.domain}/admin/api/${config.shopify.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': config.shopify.adminToken,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });
  }

  // ─── Auth ────────────────────────────────────────────────────
  getAuthUrl(redirectUri: string, state: string): string {
    const scopes = [
      'read_products', 'write_products',
      'read_orders', 'write_orders',
      'read_fulfillments', 'write_fulfillments',
      'read_inventory', 'write_inventory',
    ].join(',');
    return `https://${this.domain}/admin/oauth/authorize?client_id=${config.shopify.apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
  }

  async getAccessToken(code: string): Promise<string> {
    const { data } = await axios.post(
      `https://${this.domain}/admin/oauth/access_token`,
      {
        client_id: config.shopify.apiKey,
        client_secret: config.shopify.apiSecret,
        code,
      },
    );
    return data.access_token;
  }

  verifyWebhook(body: string, hmacHeader: string): boolean {
    const hash = crypto
      .createHmac('sha256', config.shopify.webhookSecret)
      .update(body, 'utf8')
      .digest('base64');
    return hash === hmacHeader;
  }

  // ─── Products ────────────────────────────────────────────────

  async listProducts(limit = 50, cursor?: string): Promise<{ products: ShopifyProduct[]; nextCursor?: string }> {
    const params: Record<string, unknown> = { limit, status: 'any' };
    if (cursor) params.page_info = cursor;
    const { data, headers } = await this.api.get('/products.json', { params });

    const link = headers.link as string | undefined;
    let nextCursor: string | undefined;
    if (link) {
      const match = link.match(/page_info=([a-f0-9]+)&?/i);
      if (match) nextCursor = match[1];
    }
    return { products: data.products, nextCursor };
  }

  async getProduct(productId: number): Promise<ShopifyProduct> {
    const { data } = await this.api.get(`/products/${productId}.json`);
    return data.product;
  }

  async createProduct(input: ShopifyProductInput): Promise<ShopifyProduct> {
    const { data } = await this.api.post('/products.json', { product: input });
    logger.info({ productId: data.product.id }, 'Shopify product created');
    return data.product;
  }

  async updateProduct(productId: number, input: Partial<ShopifyProductInput>): Promise<ShopifyProduct> {
    const { data } = await this.api.put(`/products/${productId}.json`, { product: input });
    logger.info({ productId }, 'Shopify product updated');
    return data.product;
  }

  async deleteProduct(productId: number): Promise<void> {
    await this.api.delete(`/products/${productId}.json`);
    logger.info({ productId }, 'Shopify product deleted');
  }

  // ─── Orders ──────────────────────────────────────────────────

  async listOrders(limit = 50, status?: string): Promise<{ orders: ShopifyOrder[]; nextCursor?: string }> {
    const params: Record<string, unknown> = { limit, status: 'any' };
    if (status) params.fulfillment_status = status;
    const { data, headers } = await this.api.get('/orders.json', { params });

    const link = headers.link as string | undefined;
    let nextCursor: string | undefined;
    if (link) {
      const match = link.match(/page_info=([a-f0-9]+)&?/i);
      if (match) nextCursor = match[1];
    }
    return { orders: data.orders, nextCursor };
  }

  async getOrder(orderId: number): Promise<ShopifyOrder> {
    const { data } = await this.api.get(`/orders/${orderId}.json`);
    return data.order;
  }

  // ─── Inventory ───────────────────────────────────────────────

  async setInventoryLevel(inventoryItemId: number, locationId: number, quantity: number): Promise<void> {
    await this.api.post('/inventory_levels/set.json', {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available: quantity,
    });
    logger.info({ inventoryItemId, quantity }, 'Shopify inventory level set');
  }

  async listLocations(): Promise<{ id: number; name: string }[]> {
    const { data } = await this.api.get('/locations.json');
    return data.locations;
  }

  // ─── Webhooks ────────────────────────────────────────────────

  async registerWebhook(topic: string, address: string): Promise<{ id: number }> {
    const { data } = await this.api.post('/webhooks.json', {
      webhook: { topic, address, format: 'json' },
    });
    logger.info({ webhookId: data.webhook.id, topic }, 'Shopify webhook registered');
    return data.webhook;
  }

  async listWebhooks(): Promise<{ id: number; topic: string; address: string }[]> {
    const { data } = await this.api.get('/webhooks.json');
    return data.webhooks;
  }

  async deleteWebhook(webhookId: number): Promise<void> {
    await this.api.delete(`/webhooks/${webhookId}.json`);
    logger.info({ webhookId }, 'Shopify webhook deleted');
  }
}

export const shopify = new ShopifyClient();

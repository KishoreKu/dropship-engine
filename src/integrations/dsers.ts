import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { DSersProduct, DSersFulfillmentOrder, FulfillmentStatus } from '../types';

export class DSersClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.dsers.com/v2',
      headers: { 'Content-Type': 'application/json' },
      timeout: 30_000,
    });
  }

  private sign(params: Record<string, unknown>): Record<string, unknown> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    const signature = crypto
      .createHmac('sha256', config.dsers.apiSecret)
      .update(`${sorted}&timestamp=${timestamp}`)
      .digest('hex');
    return { ...params, api_key: config.dsers.apiKey, timestamp, sign: signature };
  }

  // ─── Products / Suppliers ────────────────────────────────────

  async listSuppliers(page = 1, limit = 50): Promise<{
    suppliers: { id: string; name: string; platform: string }[];
    total: number;
  }> {
    const signed = this.sign({ action: 'supplier.list', page, limit });
    const { data } = await this.api.post('/gateway', signed);
    return {
      suppliers: (data.data?.list || []).map((s: Record<string, unknown>) => ({
        id: String(s.id || s.supplier_id || ''),
        name: String(s.name || ''),
        platform: String(s.platform || ''),
      })),
      total: Number(data.data?.total || 0),
    };
  }

  async searchProducts(query: string, options?: {
    page?: number;
    supplierId?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ products: DSersProduct[]; total: number }> {
    const signed = this.sign({
      action: 'product.search',
      keyword: query,
      page: options?.page || 1,
      supplier_id: options?.supplierId,
      min_price: options?.minPrice,
      max_price: options?.maxPrice,
    });
    const { data } = await this.api.post('/gateway', signed);
    const products: DSersProduct[] = ((data.data?.list || []) as any[]).map((p: Record<string, unknown>) => ({
      id: String(p.id || p.product_id || ''),
      supplierId: String(p.supplierId || p.supplier_id || ''),
      supplierName: String(p.supplierName || p.supplier_name || ''),
      title: String(p.title || ''),
      price: String(p.price || '0'),
      currency: String(p.currency || 'USD'),
      images: ((p.images || []) as string[]).map(String),
      shippingMethods: ((p.shippingMethods || p.shipping_methods || []) as any[]).map((s: Record<string, unknown>) => ({
        id: String(s.id || s.shipping_id || ''),
        name: String(s.name || ''),
        cost: String(s.cost || '0'),
        estimatedDays: String(s.estimatedDays || s.estimated_days || ''),
      })),
      category: String(p.category || ''),
    }));
    return { products, total: Number(data.data?.total || products.length) };
  }

  // ─── Fulfillment ─────────────────────────────────────────────

  async createFulfillmentOrder(order: {
    shopifyOrderId: number;
    items: { productId: string; quantity: number; variantId?: string }[];
    shippingMethod: string;
    address: {
      firstName: string;
      lastName: string;
      address1: string;
      address2?: string;
      city: string;
      province?: string;
      zip: string;
      country: string;
      phone?: string;
    };
  }): Promise<{ dsersOrderId: string }> {
    const signed = this.sign({
      action: 'fulfillment.create',
      shopify_order_id: order.shopifyOrderId,
      items: order.items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
        variant_id: i.variantId || '',
      })),
      shipping_method: order.shippingMethod,
      warehouse_id: config.dsers.warehouseId,
      address: order.address,
    });
    const { data } = await this.api.post('/gateway', signed);
    logger.info({ dsersOrderId: data.data?.order_id }, 'DSers fulfillment order created');
    return { dsersOrderId: String(data.data?.order_id || data.data?.id || '') };
  }

  async getFulfillmentStatus(dsersOrderId: string): Promise<{
    status: FulfillmentStatus;
    trackingNumber?: string;
    trackingUrl?: string;
  }> {
    const signed = this.sign({ action: 'fulfillment.status', order_id: dsersOrderId });
    const { data } = await this.api.post('/gateway', signed);
    const d = data.data || {};
    return {
      status: (d.status || 'pending').toLowerCase() as FulfillmentStatus,
      trackingNumber: d.tracking_number || d.trackingNumber,
      trackingUrl: d.tracking_url || d.trackingUrl,
    };
  }

  async cancelFulfillmentOrder(dsersOrderId: string): Promise<void> {
    const signed = this.sign({ action: 'fulfillment.cancel', order_id: dsersOrderId });
    await this.api.post('/gateway', signed);
    logger.info({ dsersOrderId }, 'DSers fulfillment order cancelled');
  }

  // ─── Inventory ───────────────────────────────────────────────

  async syncInventory(productId: string, quantity: number): Promise<void> {
    const signed = this.sign({
      action: 'inventory.sync',
      product_id: productId,
      quantity,
    });
    await this.api.post('/gateway', signed);
    logger.info({ productId, quantity }, 'DSers inventory synced');
  }
}

export const dsers = new DSersClient();

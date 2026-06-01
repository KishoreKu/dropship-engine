import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { AliExpressProduct, AliExpressProductDetail } from '../types';

export class AliExpressClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `https://${config.aliexpress.rapidApiHost}`,
      headers: {
        'x-rapidapi-key': config.aliexpress.rapidApiKey,
        'x-rapidapi-host': config.aliexpress.rapidApiHost,
      },
      timeout: 20_000,
    });
  }

  async searchProducts(query: string, options?: {
    page?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'BEST_MATCH' | 'SALES' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST';
    freeShipping?: boolean;
  }): Promise<{ products: AliExpressProduct[]; total: number; page: number }> {
    const { data } = await this.api.get('/api', {
      params: {
        action: 'search',
        q: query,
        page: options?.page || 1,
        minPrice: options?.minPrice,
        maxPrice: options?.maxPrice,
        sort: options?.sortBy || 'BEST_MATCH',
        freeShipping: options?.freeShipping,
      },
    });
    const products: AliExpressProduct[] = (data.products || data.result || []).map((p: Record<string, unknown>) => ({
      productId: String(p.productId || p.product_id || ''),
      title: String(p.title || ''),
      price: String(p.price || p.app_sale_price || '0'),
      originalPrice: String(p.originalPrice || p.app_sale_price_currency || '0'),
      sales: Number(p.sales || p.totalsold || 0),
      rating: Number(p.rating || p.evaluateRate || 0),
      imageUrl: String(p.imageUrl || p.image_url || ''),
      detailUrl: String(p.detailUrl || p.product_detail_url || ''),
      shopName: String(p.shopName || p.store_name || ''),
      shopId: String(p.shopId || p.store_id || ''),
      freeShipping: Boolean(p.freeShipping || p.free_shipment || false),
    }));
    return {
      products,
      total: Number(data.total || data.totalResults || products.length),
      page: options?.page || 1,
    };
  }

  async getProductDetail(productId: string): Promise<AliExpressProductDetail> {
    const { data } = await this.api.get('/api', {
      params: { action: 'productDetail', productId },
    });
    const d = data.data || data.result || data;
    return {
      productId: String(d.productId || productId),
      title: String(d.title || ''),
      description: String(d.description || ''),
      images: (d.images || d.image_urls || []).map(String),
      priceRange: {
        min: String(d.priceMin || d.min_price || '0'),
        max: String(d.priceMax || d.max_price || '0'),
      },
      variants: ((d.variants || d.sku_props || []) as any[]).map((v: Record<string, unknown>) => ({
        id: String(v.id || v.sku_id || ''),
        name: String(v.name || v.sku_name || ''),
        price: String(v.price || v.sku_price || '0'),
        stock: Number(v.stock || v.quantity || 0),
        skuProperties: ((v.skuProperties || v.sku_props || []) as any[]).map((sp: Record<string, unknown>) => ({
          name: String(sp.name || sp.prop_name || ''),
          value: String(sp.value || sp.prop_value || ''),
        })),
      })),
      specifications: ((d.specifications || d.specs || []) as any[]).reduce(
        (acc: Record<string, string>, s: Record<string, unknown>) => {
          acc[String(s.name || s.attr_name || '')] = String(s.value || s.attr_value || '');
          return acc;
        },
        {},
      ),
      shippingInfo: {
        freeShipping: Boolean(d.freeShipping || d.free_shipment || false),
        estimatedDays: String(d.estimatedDays || d.shipping_time || ''),
        cost: String(d.shippingCost || d.shipping_cost || '0'),
      },
    };
  }

  async getAffiliateLink(productUrl: string): Promise<string> {
    if (!config.aliexpress.affiliateId) return productUrl;
    const { data } = await this.api.get('/api', {
      params: {
        action: 'getAffiliateLink',
        productUrl,
        affiliateId: config.aliexpress.affiliateId,
      },
    });
    return String(data.affiliateUrl || data.url || productUrl);
  }
}

export const aliexpress = new AliExpressClient();

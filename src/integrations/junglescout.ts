import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { JSProductResearch, JSMarketAnalysis } from '../types';

export class JungleScoutClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.junglescout.com/v2',
      headers: {
        'x-api-key': config.junglescout.apiKey,
        'x-user-email': config.junglescout.email,
        'Content-Type': 'application/json',
      },
      timeout: 20_000,
    });
  }

  // ─── Product Research ────────────────────────────────────────

  async searchProducts(keyword: string, options?: {
    marketplace?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ products: JSProductResearch[]; total: number }> {
    const { data } = await this.api.get('/products/search', {
      params: {
        keyword,
        marketplace: options?.marketplace || 'US',
        page: options?.page || 1,
        page_size: options?.pageSize || 25,
        sort_by: options?.sortBy || 'sales',
        min_price: options?.minPrice,
        max_price: options?.maxPrice,
      },
    });
    const products: JSProductResearch[] = (data.data || []).map((p: Record<string, unknown>) => ({
      asin: String(p.asin || ''),
      title: String(p.title || ''),
      brand: String(p.brand || ''),
      category: String(p.category || ''),
      price: Number(p.price || 0),
      monthlySales: Number(p.monthly_sales || p.sales || 0),
      revenue: Number(p.revenue || p.monthly_revenue || 0),
      reviewCount: Number(p.review_count || p.reviews || 0),
      rating: Number(p.rating || 0),
      bsr: Number(p.bsr || p.best_sellers_rank || 0),
      fees: {
        amazonFee: Number(p.amazon_fee || p.referral_fee || 0),
        fulfillmentFee: Number(p.fulfillment_fee || p.fba_fee || 0),
        estimatedProfit: Number(p.estimated_profit || p.profit || 0),
        profitMargin: Number(p.profit_margin || 0),
      },
    }));
    return { products, total: Number(data.total || data.meta?.total || products.length) };
  }

  async getProductDetail(asin: string): Promise<JSProductResearch> {
    const { data } = await this.api.get(`/products/${asin}`);
    const p = data.data || data;
    return {
      asin: String(p.asin || asin),
      title: String(p.title || ''),
      brand: String(p.brand || ''),
      category: String(p.category || ''),
      price: Number(p.price || 0),
      monthlySales: Number(p.monthly_sales || p.sales || 0),
      revenue: Number(p.revenue || p.monthly_revenue || 0),
      reviewCount: Number(p.review_count || p.reviews || 0),
      rating: Number(p.rating || 0),
      bsr: Number(p.bsr || p.best_sellers_rank || 0),
      fees: {
        amazonFee: Number(p.amazon_fee || p.referral_fee || 0),
        fulfillmentFee: Number(p.fulfillment_fee || p.fba_fee || 0),
        estimatedProfit: Number(p.estimated_profit || p.profit || 0),
        profitMargin: Number(p.profit_margin || 0),
      },
    };
  }

  // ─── Market Analysis ─────────────────────────────────────────

  async getMarketAnalysis(keyword: string, marketplace?: string): Promise<JSMarketAnalysis> {
    const { data } = await this.api.get('/market/analysis', {
      params: { keyword, marketplace: marketplace || 'US' },
    });
    const m = data.data || data;
    return {
      category: String(m.category || keyword),
      avgPrice: Number(m.avg_price || 0),
      avgRating: Number(m.avg_rating || 0),
      avgMonthlySales: Number(m.avg_monthly_sales || 0),
      totalProducts: Number(m.total_products || m.product_count || 0),
      avgRevenue: Number(m.avg_revenue || 0),
      competitionLevel: (m.competition_level || 'medium') as 'low' | 'medium' | 'high',
      topBrands: (m.top_brands || []).map((b: Record<string, unknown>) => ({
        name: String(b.name || b.brand || ''),
        marketShare: Number(b.market_share || b.share || 0),
      })),
      seasonality: (m.seasonality || []).map((s: Record<string, unknown>) => ({
        month: String(s.month || ''),
        demand: Number(s.demand || 0),
      })),
    };
  }

  // ─── Keyword Research ────────────────────────────────────────

  async getKeywordSuggestions(keyword: string): Promise<{
    keyword: string;
    searchVolume: number;
    competition: 'low' | 'medium' | 'high';
    cpc: number;
  }[]> {
    const { data } = await this.api.get('/keywords/suggestions', {
      params: { keyword, marketplace: 'US' },
    });
    return (data.data || []).map((k: Record<string, unknown>) => ({
      keyword: String(k.keyword || ''),
      searchVolume: Number(k.search_volume || k.volume || 0),
      competition: (k.competition || 'medium') as 'low' | 'medium' | 'high',
      cpc: Number(k.cpc || k.bid || 0),
    }));
  }
}

export const jungleScout = new JungleScoutClient();

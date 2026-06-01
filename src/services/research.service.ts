import { jungleScout } from '../integrations/junglescout';
import { aliexpress } from '../integrations/aliexpress';
import { logger } from '../utils/logger';
import type { JSProductResearch, JSMarketAnalysis } from '../types';

export const researchService = {
  async searchAmazon(keyword: string, options?: {
    marketplace?: string;
    page?: number;
    pageSize?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ products: JSProductResearch[]; total: number }> {
    return jungleScout.searchProducts(keyword, {
      marketplace: options?.marketplace,
      page: options?.page,
      pageSize: options?.pageSize,
      minPrice: options?.minPrice,
      maxPrice: options?.maxPrice,
    });
  },

  async getAmazonProductDetail(asin: string): Promise<JSProductResearch> {
    return jungleScout.getProductDetail(asin);
  },

  async getMarketAnalysis(keyword: string, marketplace?: string): Promise<JSMarketAnalysis> {
    return jungleScout.getMarketAnalysis(keyword, marketplace);
  },

  async getKeywordSuggestions(keyword: string) {
    return jungleScout.getKeywordSuggestions(keyword);
  },

  async crossReference(query: string): Promise<{
    amazon: JSProductResearch[];
    aliexpress: { productId: string; title: string; price: string; sales: number }[];
    analysis: JSMarketAnalysis | null;
  }> {
    logger.info({ query }, 'Cross-referencing products across platforms');

    const [amazonResult, aliResult, analysis] = await Promise.all([
      jungleScout.searchProducts(query, { pageSize: 10 }),
      aliexpress.searchProducts(query, { page: 1 }),
      jungleScout.getMarketAnalysis(query).catch(() => null),
    ]);

    return {
      amazon: amazonResult.products,
      aliexpress: aliResult.products.map((p) => ({
        productId: p.productId,
        title: p.title,
        price: p.price,
        sales: p.sales,
      })),
      analysis,
    };
  },
};

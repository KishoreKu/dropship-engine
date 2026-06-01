import { v4 as uuid } from 'uuid';
import { shopify } from '../integrations/shopify';
import { aliexpress } from '../integrations/aliexpress';
import { dsers } from '../integrations/dsers';
import { logger } from '../utils/logger';
import type { ImportedProduct, ShopifyProductInput, AliExpressProduct } from '../types';

// In-memory store – swap with Prisma/Postgres in production
const importedProducts = new Map<string, ImportedProduct>();

export const productService = {
  async searchAliExpress(query: string, options?: {
    page?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'BEST_MATCH' | 'SALES' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST';
    freeShipping?: boolean;
  }) {
    return aliexpress.searchProducts(query, options);
  },

  async getAliExpressDetail(productId: string) {
    return aliexpress.getProductDetail(productId);
  },

  async importFromAliExpress(aliExpressProduct: AliExpressProduct): Promise<ImportedProduct> {
    logger.info({ productId: aliExpressProduct.productId }, 'Importing product from AliExpress');

    const detail = await aliexpress.getProductDetail(aliExpressProduct.productId);

    const shopifyInput: ShopifyProductInput = {
      title: aliExpressProduct.title,
      description: detail.description || aliExpressProduct.title,
      vendor: aliExpressProduct.shopName,
      productType: detail.specifications?.category || 'Dropshipping',
      variants: detail.variants.length > 0
        ? detail.variants.map((v) => ({
            price: v.price,
            sku: `AE-${aliExpressProduct.productId}-${v.id}`,
            inventoryQuantity: v.stock,
          }))
        : [{
            price: aliExpressProduct.price,
            sku: `AE-${aliExpressProduct.productId}`,
            inventoryQuantity: 999,
          }],
      images: detail.images.slice(0, 10).map((src) => ({ src })),
      tags: ['dropshipping', 'aliexpress', aliExpressProduct.shopName],
      status: 'draft',
    };

    const shopifyProduct = await shopify.createProduct(shopifyInput);

    const imported: ImportedProduct = {
      id: uuid(),
      shopifyProductId: shopifyProduct.id,
      aliExpressProductId: aliExpressProduct.productId,
      title: aliExpressProduct.title,
      price: aliExpressProduct.price,
      sku: `AE-${aliExpressProduct.productId}`,
      images: detail.images.slice(0, 5),
      status: 'imported',
      createdAt: new Date().toISOString(),
    };

    importedProducts.set(imported.id, imported);
    logger.info({ importedId: imported.id, shopifyProductId: shopifyProduct.id }, 'Product import complete');
    return imported;
  },

  async listImported(): Promise<ImportedProduct[]> {
    return Array.from(importedProducts.values());
  },

  async getImported(id: string): Promise<ImportedProduct | undefined> {
    return importedProducts.get(id);
  },

  async syncToShopify(productId: string): Promise<ImportedProduct> {
    const imported = importedProducts.get(productId);
    if (!imported) throw new Error(`Imported product not found: ${productId}`);
    if (imported.shopifyProductId) {
      await shopify.updateProduct(imported.shopifyProductId, { status: 'active' });
    }
    imported.status = 'imported';
    return imported;
  },

  async searchDSers(query: string, options?: { page?: number; supplierId?: string }) {
    return dsers.searchProducts(query, options);
  },

  async listShopifyProducts(page = 1, limit = 50) {
    return shopify.listProducts(limit);
  },
};

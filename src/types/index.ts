// ─── Shared domain types ──────────────────────────────────

export interface ShopifyProductInput {
  title: string;
  description: string;
  vendor?: string;
  productType?: string;
  variants: {
    price: string;
    compareAtPrice?: string;
    sku: string;
    inventoryQuantity?: number;
  }[];
  images?: { src: string }[];
  tags?: string[];
  status?: 'active' | 'draft' | 'archived';
}

export interface ShopifyProduct extends ShopifyProductInput {
  id: number;
  handle: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyOrder {
  id: number;
  orderNumber: number;
  email: string;
  financialStatus: string;
  fulfillmentStatus: string;
  lineItems: ShopifyLineItem[];
  shippingAddress: Address;
  createdAt: string;
}

export interface ShopifyLineItem {
  id: number;
  productId: number;
  variantId: number;
  title: string;
  quantity: number;
  price: string;
  sku: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string;
  phone?: string;
}

// ─── AliExpress ────────────────────────────────────────────

export interface AliExpressProduct {
  productId: string;
  title: string;
  price: string;
  originalPrice: string;
  sales: number;
  rating: number;
  imageUrl: string;
  detailUrl: string;
  shopName: string;
  shopId: string;
  freeShipping: boolean;
}

export interface AliExpressProductDetail {
  productId: string;
  title: string;
  description: string;
  images: string[];
  priceRange: { min: string; max: string };
  variants: AliExpressVariant[];
  specifications: Record<string, string>;
  shippingInfo: {
    freeShipping: boolean;
    estimatedDays: string;
    cost: string;
  };
}

export interface AliExpressVariant {
  id: string;
  name: string;
  price: string;
  stock: number;
  skuProperties: { name: string; value: string }[];
}

// ─── DSers ─────────────────────────────────────────────────

export interface DSersSupplier {
  id: string;
  name: string;
  platform: string;
  logo: string;
  rating: number;
  productCount: number;
}

export interface DSersProduct {
  id: string;
  supplierId: string;
  supplierName: string;
  title: string;
  price: string;
  currency: string;
  images: string[];
  shippingMethods: DSersShippingMethod[];
  category: string;
}

export interface DSersShippingMethod {
  id: string;
  name: string;
  cost: string;
  estimatedDays: string;
}

export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface DSersFulfillmentOrder {
  id: string;
  shopifyOrderId: number;
  dsersOrderId?: string;
  status: FulfillmentStatus;
  items: { productId: string; quantity: number; variantId: string }[];
  shippingMethod: string;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── JungleScout ───────────────────────────────────────────

export interface JSProductResearch {
  asin: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  monthlySales: number;
  revenue: number;
  reviewCount: number;
  rating: number;
  bsr: number;
  fees: {
    amazonFee: number;
    fulfillmentFee: number;
    estimatedProfit: number;
    profitMargin: number;
  };
}

export interface JSMarketAnalysis {
  category: string;
  avgPrice: number;
  avgRating: number;
  avgMonthlySales: number;
  totalProducts: number;
  avgRevenue: number;
  competitionLevel: 'low' | 'medium' | 'high';
  topBrands: { name: string; marketShare: number }[];
  seasonality: { month: string; demand: number }[];
}

// ─── App ───────────────────────────────────────────────────

export interface ImportedProduct {
  id: string;
  shopifyProductId?: number;
  aliExpressProductId: string;
  dsersProductId?: string;
  title: string;
  price: string;
  sku: string;
  images: string[];
  status: 'pending' | 'imported' | 'failed';
  createdAt: string;
}

export interface SyncLog {
  id: string;
  type: 'product_import' | 'fulfillment' | 'research' | 'inventory';
  status: 'success' | 'partial' | 'failed';
  message: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

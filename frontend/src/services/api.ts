const BASE = 'http://localhost:3000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Products
  searchAliExpress: (q: string, params?: Record<string, string>) =>
    request<{ products: any[]; total: number }>(`/products/search/aliexpress?q=${encodeURIComponent(q)}${params ? '&' + new URLSearchParams(params) : ''}`),

  searchDSers: (q: string, params?: Record<string, string>) =>
    request<{ products: any[]; total: number }>(`/products/search/dsers?q=${encodeURIComponent(q)}${params ? '&' + new URLSearchParams(params) : ''}`),

  importProduct: (data: any) =>
    request<any>('/products/import', { method: 'POST', body: JSON.stringify(data) }),

  listImported: () =>
    request<{ products: any[] }>('/products/imported'),

  // Orders
  listOrders: (params?: string) =>
    request<{ orders: any[] }>(`/orders${params || ''}`),

  getUnfulfilledOrders: () =>
    request<{ orders: any[] }>('/orders/unfulfilled'),

  // Fulfillment
  createFulfillment: (shopifyOrderId: number) =>
    request<any>('/fulfillment', { method: 'POST', body: JSON.stringify({ shopifyOrderId }) }),

  listFulfillments: () =>
    request<{ orders: any[] }>('/fulfillment'),

  // Research
  searchAmazon: (q: string) =>
    request<{ products: any[]; total: number }>(`/research/amazon?q=${encodeURIComponent(q)}`),

  marketAnalysis: (keyword: string) =>
    request<any>(`/research/market-analysis?keyword=${encodeURIComponent(keyword)}`),

  crossReference: (q: string) =>
    request<any>(`/research/cross-reference?q=${encodeURIComponent(q)}`),
};

import { v4 as uuid } from 'uuid';
import { shopify } from '../integrations/shopify';
import { logger } from '../utils/logger';
import type { ShopifyOrder } from '../types';

const orderCache = new Map<number, ShopifyOrder>();

export const orderService = {
  async fetchRecent(limit = 50, status?: string) {
    const result = await shopify.listOrders(limit, status);
    for (const o of result.orders) orderCache.set(o.id, o);
    return result;
  },

  async getById(orderId: number): Promise<ShopifyOrder> {
    if (orderCache.has(orderId)) return orderCache.get(orderId)!;
    const order = await shopify.getOrder(orderId);
    orderCache.set(orderId, order);
    return order;
  },

  async handleWebhook(body: string, topic: string): Promise<void> {
    const order: ShopifyOrder = JSON.parse(body).order || JSON.parse(body);
    orderCache.set(order.id, order);

    switch (topic) {
      case 'orders/create':
        logger.info({ orderId: order.id, orderNumber: order.orderNumber }, 'New order received');
        break;
      case 'orders/updated':
        logger.info({ orderId: order.id, status: order.fulfillmentStatus }, 'Order updated');
        break;
      case 'orders/fulfilled':
        logger.info({ orderId: order.id }, 'Order fulfilled');
        break;
      case 'orders/partially_fulfilled':
        logger.info({ orderId: order.id }, 'Order partially fulfilled');
        break;
      default:
        logger.debug({ topic }, 'Unhandled webhook topic');
    }
  },

  async getUnfulfilled() {
    const result = await shopify.listOrders(250, 'unfulfilled');
    return result.orders.filter((o) => o.fulfillmentStatus !== 'fulfilled');
  },
};

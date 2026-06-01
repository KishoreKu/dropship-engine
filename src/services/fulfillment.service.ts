import { v4 as uuid } from 'uuid';
import { dsers } from '../integrations/dsers';
import { shopify } from '../integrations/shopify';
import { logger } from '../utils/logger';
import type { DSersFulfillmentOrder, FulfillmentStatus } from '../types';

const fulfillmentOrders = new Map<string, DSersFulfillmentOrder>();

export const fulfillmentService = {
  async create(shopifyOrderId: number): Promise<DSersFulfillmentOrder> {
    const order = await shopify.getOrder(shopifyOrderId);

    const fulfillment: DSersFulfillmentOrder = {
      id: uuid(),
      shopifyOrderId: order.id,
      status: 'pending',
      items: order.lineItems.filter((i) => i.sku?.startsWith('AE-')).map((i) => ({
        productId: i.sku.replace('AE-', '').split('-')[0],
        quantity: i.quantity,
        variantId: i.sku,
      })),
      shippingMethod: 'standard',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (fulfillment.items.length === 0) {
      throw new Error('No dropshippable items (SKU must start with AE-)');
    }

    const result = await dsers.createFulfillmentOrder({
      shopifyOrderId: order.id,
      items: fulfillment.items,
      shippingMethod: fulfillment.shippingMethod,
      address: {
        firstName: order.shippingAddress.firstName,
        lastName: order.shippingAddress.lastName,
        address1: order.shippingAddress.address1,
        address2: order.shippingAddress.address2,
        city: order.shippingAddress.city,
        province: order.shippingAddress.province,
        zip: order.shippingAddress.zip,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone,
      },
    });

    fulfillment.dsersOrderId = result.dsersOrderId;
    fulfillment.status = 'processing';
    fulfillmentOrders.set(fulfillment.id, fulfillment);

    logger.info({ fulfillmentId: fulfillment.id, dsersOrderId: result.dsersOrderId }, 'Fulfillment order created');
    return fulfillment;
  },

  async getStatus(fulfillmentId: string): Promise<DSersFulfillmentOrder | undefined> {
    const fo = fulfillmentOrders.get(fulfillmentId);
    if (!fo) return undefined;
    if (fo.dsersOrderId) {
      try {
        const status = await dsers.getFulfillmentStatus(fo.dsersOrderId);
        fo.status = status.status;
        fo.trackingNumber = status.trackingNumber;
        fo.trackingUrl = status.trackingUrl;
        fo.updatedAt = new Date().toISOString();
      } catch (err) {
        logger.warn({ err, fulfillmentId }, 'Failed to fetch DSers status');
      }
    }
    return fo;
  },

  async list(): Promise<DSersFulfillmentOrder[]> {
    return Array.from(fulfillmentOrders.values());
  },

  async cancel(fulfillmentId: string): Promise<void> {
    const fo = fulfillmentOrders.get(fulfillmentId);
    if (!fo) throw new Error(`Fulfillment not found: ${fulfillmentId}`);
    if (fo.dsersOrderId) {
      await dsers.cancelFulfillmentOrder(fo.dsersOrderId);
    }
    fo.status = 'cancelled';
    fo.updatedAt = new Date().toISOString();
    logger.info({ fulfillmentId }, 'Fulfillment cancelled');
  },

  async pollStatuses(): Promise<void> {
    for (const [id, fo] of fulfillmentOrders) {
      if (fo.status === 'shipped' || fo.status === 'delivered' || fo.status === 'cancelled') continue;
      if (fo.dsersOrderId) {
        try {
          const status = await dsers.getFulfillmentStatus(fo.dsersOrderId);
          fo.status = status.status;
          fo.trackingNumber = status.trackingNumber;
          fo.trackingUrl = status.trackingUrl;
          fo.updatedAt = new Date().toISOString();
          logger.info({ fulfillmentId: id, status: fo.status }, 'Fulfillment status updated');
        } catch (err) {
          logger.warn({ err, fulfillmentId: id }, 'Poll failed');
        }
      }
    }
  },
};

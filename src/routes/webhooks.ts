import { Router, Request, Response } from 'express';
import { shopify } from '../integrations/shopify';
import { fulfillmentService } from '../services/fulfillment.service';
import { orderService } from '../services/order.service';
import { logger } from '../utils/logger';

export const webhookRouter = Router();

webhookRouter.post('/shopify/:topic', async (req: Request, res: Response) => {
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const rawBody = JSON.stringify(req.body);

  if (!shopify.verifyWebhook(rawBody, hmac)) {
    logger.warn({ topic: req.params.topic }, 'Invalid webhook HMAC');
    res.status(401).json({ error: 'Invalid HMAC' });
    return;
  }

  const topic = req.params.topic as string;

  try {
    await orderService.handleWebhook(rawBody, topic);

    if (topic === 'orders/create') {
      const order = req.body;
      await fulfillmentService.create(order.id).catch((err) => {
        logger.warn({ err, orderId: order.id }, 'Auto-fulfillment skipped');
      });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err, topic }, 'Webhook handler failed');
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

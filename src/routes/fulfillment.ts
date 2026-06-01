import { Router, Request, Response } from 'express';
import { fulfillmentService } from '../services/fulfillment.service';
import { logger } from '../utils/logger';

export const fulfillmentRouter = Router();

fulfillmentRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { shopifyOrderId } = req.body;
    if (!shopifyOrderId) {
      res.status(400).json({ error: 'shopifyOrderId is required' });
      return;
    }
    const result = await fulfillmentService.create(Number(shopifyOrderId));
    res.status(201).json(result);
  } catch (err: any) {
    logger.error({ err }, 'Fulfillment creation failed');
    const status = err.message?.includes('not found') || err.message?.includes('dropshippable') ? 400 : 500;
    res.status(status).json({ error: err.message || 'Fulfillment creation failed' });
  }
});

fulfillmentRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const orders = await fulfillmentService.list();
    res.json({ orders });
  } catch (err) {
    logger.error({ err }, 'Failed to list fulfillment orders');
    res.status(500).json({ error: 'Failed to list fulfillment orders' });
  }
});

fulfillmentRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await fulfillmentService.getStatus(id);
    if (!order) {
      res.status(404).json({ error: 'Fulfillment order not found' });
      return;
    }
    res.json(order);
  } catch (err) {
    logger.error({ err }, 'Failed to get fulfillment status');
    res.status(500).json({ error: 'Failed to get fulfillment status' });
  }
});

fulfillmentRouter.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await fulfillmentService.cancel(id);
    res.json({ status: 'cancelled' });
  } catch (err) {
    logger.error({ err }, 'Failed to cancel fulfillment');
    res.status(500).json({ error: 'Failed to cancel fulfillment' });
  }
});

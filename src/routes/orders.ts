import { Router, Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { logger } from '../utils/logger';

export const orderRouter = Router();

orderRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { limit, status } = req.query;
    const result = await orderService.fetchRecent(
      Number(limit) || 50,
      typeof status === 'string' ? status : undefined,
    );
    res.json(result);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch orders');
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

orderRouter.get('/unfulfilled', async (_req: Request, res: Response) => {
  try {
    const orders = await orderService.getUnfulfilled();
    res.json({ orders });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch unfulfilled orders');
    res.status(500).json({ error: 'Failed to fetch unfulfilled orders' });
  }
});

orderRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await orderService.getById(Number(req.params.id));
    res.json(order);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch order');
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';
import { config } from './config';
import { logger } from './utils/logger';
import { authMiddleware } from './middleware/auth';
import { productRouter } from './routes/products';
import { orderRouter } from './routes/orders';
import { fulfillmentRouter } from './routes/fulfillment';
import { researchRouter } from './routes/research';
import { webhookRouter } from './routes/webhooks';
import { fulfillmentService } from './services/fulfillment.service';

const app = express();

// ─── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('short'));
app.use('/webhooks', express.json({ verify: (req, _res, buf) => { (req as any).rawBody = buf; } }));
app.use('/api', express.json());

// ─── Public routes ──────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/webhooks', webhookRouter);

// ─── Protected routes ───────────────────────────────────────
app.use('/api/products', authMiddleware, productRouter);
app.use('/api/orders', authMiddleware, orderRouter);
app.use('/api/fulfillment', authMiddleware, fulfillmentRouter);
app.use('/api/research', authMiddleware, researchRouter);

// ─── Cron: poll DSers fulfillment statuses every 5 min ─────
cron.schedule('*/5 * * * *', () => {
  fulfillmentService.pollStatuses().catch((err) =>
    logger.error({ err }, 'Fulfillment poll cycle failed'),
  );
});

// ─── Start ──────────────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(`Dropship Engine running on :${config.port}`);
  logger.info(`Health: http://localhost:${config.port}/health`);
});

export default app;

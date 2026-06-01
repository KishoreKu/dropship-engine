import { Router, Request, Response } from 'express';
import { researchService } from '../services/research.service';
import { logger } from '../utils/logger';

export const researchRouter = Router();

researchRouter.get('/amazon', async (req: Request, res: Response) => {
  try {
    const { q, marketplace, page, pageSize, minPrice, maxPrice } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    const result = await researchService.searchAmazon(q, {
      marketplace: typeof marketplace === 'string' ? marketplace : undefined,
      page: Number(page) || undefined,
      pageSize: Number(pageSize) || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
    res.json(result);
  } catch (err) {
    logger.error({ err }, 'Amazon search failed');
    res.status(500).json({ error: 'Amazon search failed' });
  }
});

researchRouter.get('/amazon/:asin', async (req: Request, res: Response) => {
  try {
    const asin = req.params.asin as string;
    const product = await researchService.getAmazonProductDetail(asin);
    res.json(product);
  } catch (err) {
    logger.error({ err }, 'Failed to get Amazon product');
    res.status(500).json({ error: 'Failed to get Amazon product' });
  }
});

researchRouter.get('/market-analysis', async (req: Request, res: Response) => {
  try {
    const { keyword, marketplace } = req.query;
    if (!keyword || typeof keyword !== 'string') {
      res.status(400).json({ error: 'Query parameter "keyword" is required' });
      return;
    }
    const analysis = await researchService.getMarketAnalysis(keyword, typeof marketplace === 'string' ? marketplace : undefined);
    res.json(analysis);
  } catch (err) {
    logger.error({ err }, 'Market analysis failed');
    res.status(500).json({ error: 'Market analysis failed' });
  }
});

researchRouter.get('/keywords', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    const suggestions = await researchService.getKeywordSuggestions(q);
    res.json({ suggestions });
  } catch (err) {
    logger.error({ err }, 'Keyword suggestions failed');
    res.status(500).json({ error: 'Keyword suggestions failed' });
  }
});

researchRouter.get('/cross-reference', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    const result = await researchService.crossReference(q);
    res.json(result);
  } catch (err) {
    logger.error({ err }, 'Cross-reference failed');
    res.status(500).json({ error: 'Cross-reference failed' });
  }
});

import { Router, Request, Response } from 'express';
import { productService } from '../services/product.service';
import { logger } from '../utils/logger';

export const productRouter = Router();

productRouter.get('/search/aliexpress', async (req: Request, res: Response) => {
  try {
    const { q, page, minPrice, maxPrice, sortBy, freeShipping } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    const result = await productService.searchAliExpress(q, {
      page: Number(page) || 1,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy: sortBy as any,
      freeShipping: freeShipping === 'true',
    });
    res.json(result);
  } catch (err) {
    logger.error({ err }, 'AliExpress search failed');
    res.status(500).json({ error: 'AliExpress search failed' });
  }
});

productRouter.get('/search/dsers', async (req: Request, res: Response) => {
  try {
    const { q, page, supplierId } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    const result = await productService.searchDSers(q, {
      page: Number(page) || 1,
      supplierId: typeof supplierId === 'string' ? supplierId : undefined,
    });
    res.json(result);
  } catch (err) {
    logger.error({ err }, 'DSers search failed');
    res.status(500).json({ error: 'DSers search failed' });
  }
});

productRouter.post('/import', async (req: Request, res: Response) => {
  try {
    const { productId, title, price, imageUrl, shopName, sales, rating, detailUrl } = req.body;
    if (!productId || !title) {
      res.status(400).json({ error: 'productId and title are required' });
      return;
    }
    const imported = await productService.importFromAliExpress({
      productId, title, price, originalPrice: '', sales, rating, imageUrl, detailUrl,
      shopName, shopId: '', freeShipping: false,
    });
    res.status(201).json(imported);
  } catch (err) {
    logger.error({ err }, 'Product import failed');
    res.status(500).json({ error: 'Product import failed' });
  }
});

productRouter.get('/imported', async (_req: Request, res: Response) => {
  try {
    const products = await productService.listImported();
    res.json({ products });
  } catch (err) {
    logger.error({ err }, 'Failed to list imported products');
    res.status(500).json({ error: 'Failed to list imported products' });
  }
});

productRouter.get('/imported/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await productService.getImported(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err) {
    logger.error({ err }, 'Failed to get imported product');
    res.status(500).json({ error: 'Failed to get imported product' });
  }
});

productRouter.post('/imported/:id/sync', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await productService.syncToShopify(id);
    res.json(product);
  } catch (err) {
    logger.error({ err }, 'Product sync failed');
    res.status(500).json({ error: 'Product sync failed' });
  }
});

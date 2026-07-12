import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config';
import { generateToken } from '../middleware/auth';
import { verifyPassword } from '../utils/password';
import { logger } from '../utils/logger';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, try again later' },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  try {
    const { email, password } = parsed.data;
    // Verify the password even on email mismatch so response timing
    // doesn't reveal whether the email exists.
    const emailMatches = email.toLowerCase() === config.auth.adminEmail.toLowerCase();
    const passwordMatches = await verifyPassword(password, config.auth.adminPasswordHash);

    if (!emailMatches || !passwordMatches) {
      logger.warn({ email }, 'Failed login attempt');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ sub: email, role: 'admin' });
    res.json({ token, expiresIn: 86400 });
  } catch (err) {
    logger.error({ err }, 'Login failed');
    res.status(500).json({ error: 'Login failed' });
  }
});

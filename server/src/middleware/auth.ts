import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { CONFIG } from '../config.js';

/**
 * Middleware requiring authentication via Bearer token or x-api-key header.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-api-key']) {
    token = String(req.headers['x-api-key']).trim();
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required (provide Authorization: Bearer <token> or x-api-key)'
    });
  }

  const expectedKey = CONFIG.API_KEY;
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expectedKey);

  if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid API token'
    });
  }

  next();
}

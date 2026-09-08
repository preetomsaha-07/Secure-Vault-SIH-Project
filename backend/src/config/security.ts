import helmet from 'helmet';
import cors from 'cors';
import { CookieOptions, Request, Response, NextFunction } from 'express';
import { ENV } from './env.js';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", ENV.CLIENT_URL],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: ENV.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // For blob / preview streaming
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // In dev, allow localhost or client URL
    if (!origin || origin === ENV.CLIENT_URL || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked: Origin not authorized by SecureVault'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-MFA-Token', 'X-Step-Up-Auth'],
  exposedHeaders: ['Content-Disposition', 'X-Integrity-SHA256', 'X-Encrypted-Algorithm'],
});

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 2 * 60 * 60 * 1000, // 2 hours
  path: '/',
};

export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

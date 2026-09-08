import rateLimit from 'express-rate-limit';

export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login/register attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Account temporarily throttled for security.' },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload rate limit exceeded. Please wait before uploading more documents.' },
});

export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60, // 60 searches per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Search rate limit exceeded. Please slow down.' },
});

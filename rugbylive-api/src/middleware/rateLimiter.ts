import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,            // 2 req/s per IP — generous for a web app
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
})

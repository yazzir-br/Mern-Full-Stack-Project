import rateLimit from 'express-rate-limit';

const windowMs = Number(
  process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
);

const limit = Number(
  process.env.LOGIN_RATE_LIMIT_MAX || 5
);

export const loginLimiter = rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again later.'
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts. Please try again later.'
    });
  }
});




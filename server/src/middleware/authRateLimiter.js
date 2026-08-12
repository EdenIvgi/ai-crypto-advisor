import rateLimit from 'express-rate-limit'

import { isTest } from '../config/env.js'

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000
const MAX_ATTEMPTS_PER_WINDOW = 20

export const authRateLimiter = isTest
  ? (_request, _response, next) => next()
  : rateLimit({
      windowMs: FIFTEEN_MINUTES_MS,
      limit: MAX_ATTEMPTS_PER_WINDOW,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        error: {
          message: 'Too many attempts. Please wait a few minutes and try again.',
          code: 'TOO_MANY_REQUESTS',
        },
      },
    })

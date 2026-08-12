import rateLimit from 'express-rate-limit'

import { isTest } from '../config/env.js'

const TEN_MINUTES_MS = 10 * 60 * 1000
const MAX_QUESTIONS_PER_WINDOW = 10

// Counted per reader rather than per address, because this is the one route that spends money on
// somebody's API key, and a shared office or a mobile network is one address for everybody on it.
export const cryptoQuestionRateLimiter = isTest
  ? (_request, _response, next) => next()
  : rateLimit({
      windowMs: TEN_MINUTES_MS,
      limit: MAX_QUESTIONS_PER_WINDOW,
      keyGenerator: (request) => String(request.userId),
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        error: {
          message: 'That is a lot of questions. Please wait a few minutes and ask again.',
          code: 'TOO_MANY_REQUESTS',
        },
      },
    })

import { Router } from 'express'
import { z } from 'zod'

import {
  getCoinPrices,
  getMarketNews,
  getAiInsight,
  getCryptoMeme,
  askAboutCrypto,
} from '../controllers/dashboardController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { loadCurrentUser } from '../middleware/loadCurrentUser.js'
import { requireOnboarding } from '../middleware/requireOnboarding.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { cryptoQuestionRateLimiter } from '../middleware/cryptoQuestionRateLimiter.js'

const MINIMUM_QUESTION_LENGTH = 3
const MAXIMUM_QUESTION_LENGTH = 300

const questionBodySchema = z.object({
  question: z
    .string()
    .trim()
    .min(MINIMUM_QUESTION_LENGTH, 'Ask a question first')
    .max(MAXIMUM_QUESTION_LENGTH, `Keep it under ${MAXIMUM_QUESTION_LENGTH} characters`),
})

export const dashboardRoutes = Router()

dashboardRoutes.use(requireAuth, loadCurrentUser, requireOnboarding)

dashboardRoutes.get('/prices', getCoinPrices)
dashboardRoutes.get('/news', getMarketNews)
dashboardRoutes.get('/insight', getAiInsight)
dashboardRoutes.get('/meme', getCryptoMeme)

dashboardRoutes.post(
  '/ask',
  cryptoQuestionRateLimiter,
  validateRequest({ body: questionBodySchema }),
  askAboutCrypto
)

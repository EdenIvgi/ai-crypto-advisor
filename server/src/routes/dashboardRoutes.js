import { Router } from 'express'

import {
  getCoinPrices,
  getMarketNews,
  getAiInsight,
  getCryptoMeme,
} from '../controllers/dashboardController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { loadCurrentUser } from '../middleware/loadCurrentUser.js'
import { requireOnboarding } from '../middleware/requireOnboarding.js'

export const dashboardRoutes = Router()

dashboardRoutes.use(requireAuth, loadCurrentUser, requireOnboarding)

dashboardRoutes.get('/prices', getCoinPrices)
dashboardRoutes.get('/news', getMarketNews)
dashboardRoutes.get('/insight', getAiInsight)
dashboardRoutes.get('/meme', getCryptoMeme)

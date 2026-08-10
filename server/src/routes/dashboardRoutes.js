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

// Every section needs the same three things first: a valid session, the user's document,
// and the guarantee that they answered the quiz. Applying the chain once at the router
// keeps it from drifting apart across four routes.
dashboardRoutes.use(requireAuth, loadCurrentUser, requireOnboarding)

dashboardRoutes.get('/prices', getCoinPrices)
dashboardRoutes.get('/news', getMarketNews)
dashboardRoutes.get('/insight', getAiInsight)
dashboardRoutes.get('/meme', getCryptoMeme)

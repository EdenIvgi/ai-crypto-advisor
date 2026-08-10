import { Router } from 'express'
import { z } from 'zod'

import {
  getQuizOptionsForClient,
  getPreferences,
  replacePreferences,
} from '../controllers/preferencesController.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { SUPPORTED_ASSET_IDS } from '../data/supportedAssets.js'
import { INVESTOR_TYPES, CONTENT_SECTIONS } from '../data/preferenceOptions.js'

const MAX_WATCHED_ASSETS = 8

/**
 * Built from the same lists the quiz is served from and the schema enumerates, so an answer
 * the UI can produce is always an answer this accepts. The asset cap is a real limit, not a
 * formality: every id here becomes part of a CoinGecko request on every dashboard load.
 */
const preferencesBodySchema = z.object({
  watchedAssetIds: z
    .array(z.enum(SUPPORTED_ASSET_IDS, { message: 'That is not an asset we can follow' }))
    .min(1, 'Pick at least one asset')
    .max(MAX_WATCHED_ASSETS, `Pick up to ${MAX_WATCHED_ASSETS} assets`),
  investorType: z.enum(INVESTOR_TYPES, { message: 'Pick how you invest' }),
  contentSections: z
    .array(z.enum(CONTENT_SECTIONS))
    .min(1, 'Pick at least one kind of content'),
})

export const preferencesRoutes = Router()

preferencesRoutes.get('/options', requireAuth, getQuizOptionsForClient)

preferencesRoutes.get('/', requireAuth, getPreferences)

preferencesRoutes.put(
  '/',
  requireAuth,
  validateRequest({ body: preferencesBodySchema }),
  replacePreferences
)

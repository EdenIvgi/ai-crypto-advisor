import { Router } from 'express'
import { z } from 'zod'

import {
  getQuizOptionsForClient,
  getPreferences,
  replacePreferences,
} from '../controllers/preferencesController.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { INVESTOR_TYPES, CONTENT_SECTIONS } from '../data/preferenceOptions.js'

const MAX_WATCHED_ASSETS = 12
const MAX_ASSET_FIELD_LENGTH = 100

/**
 * An asset is whatever CoinGecko returned for a search, so this describes its shape rather
 * than enumerating a closed set — there is no list of valid coins to check against.
 */
const watchedAssetSchema = z.object({
  id: z.string().trim().min(1).max(MAX_ASSET_FIELD_LENGTH),
  name: z.string().trim().min(1).max(MAX_ASSET_FIELD_LENGTH),
  symbol: z.string().trim().min(1).max(MAX_ASSET_FIELD_LENGTH),
})

const preferencesBodySchema = z.object({
  watchedAssets: z
    .array(watchedAssetSchema)
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

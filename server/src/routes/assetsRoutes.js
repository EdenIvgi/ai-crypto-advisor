import { Router } from 'express'
import { z } from 'zod'

import { getAssetSearchResults } from '../controllers/assetsController.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { requireAuth } from '../middleware/requireAuth.js'

const MINIMUM_QUERY_LENGTH = 2
const MAXIMUM_QUERY_LENGTH = 50

const searchQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(MINIMUM_QUERY_LENGTH, 'Type at least two characters')
    .max(MAXIMUM_QUERY_LENGTH, 'That search is too long'),
})

export const assetsRoutes = Router()

// Behind a session but not behind onboarding: the quiz itself is what calls this.
assetsRoutes.get(
  '/search',
  requireAuth,
  validateRequest({ query: searchQuerySchema }),
  getAssetSearchResults
)

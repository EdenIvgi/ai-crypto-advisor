import { Router } from 'express'
import { z } from 'zod'

import { castVote, getMyVotes } from '../controllers/feedbackController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { CONTENT_SECTIONS } from '../data/preferenceOptions.js'
import { VOTE_VALUES } from '../data/feedbackOptions.js'

const MAX_CONTENT_ID_LENGTH = 200

/**
 * `contentId` is opaque here on purpose — each section decides what identifies the thing it
 * showed, and the API only insists that it is a short string. It is bounded because it goes
 * into an index, and unbounded index keys are how a collection becomes unqueryable.
 */
const voteBodySchema = z.object({
  sectionType: z.enum(CONTENT_SECTIONS, { message: 'That is not a section you can vote on' }),
  contentId: z.string().min(1).max(MAX_CONTENT_ID_LENGTH),
  vote: z.enum(VOTE_VALUES, { message: 'A vote is either up or down' }),
})

export const feedbackRoutes = Router()

feedbackRoutes.post('/', requireAuth, validateRequest({ body: voteBodySchema }), castVote)

feedbackRoutes.get('/mine', requireAuth, getMyVotes)

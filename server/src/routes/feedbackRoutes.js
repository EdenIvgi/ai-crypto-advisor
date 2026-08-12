import { Router } from 'express'
import { z } from 'zod'

import { castVote, withdrawVote, getMyVotes } from '../controllers/feedbackController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { CONTENT_SECTIONS } from '../data/preferenceOptions.js'
import { VOTE_VALUES } from '../data/feedbackOptions.js'

const MAX_CONTENT_ID_LENGTH = 200

const voteTargetSchema = z.object({
  sectionType: z.enum(CONTENT_SECTIONS, { message: 'That is not a section you can vote on' }),
  contentId: z.string().min(1).max(MAX_CONTENT_ID_LENGTH),
})

const voteBodySchema = voteTargetSchema.extend({
  vote: z.enum(VOTE_VALUES, { message: 'A vote is either up or down' }),
})

export const feedbackRoutes = Router()

feedbackRoutes.post('/', requireAuth, validateRequest({ body: voteBodySchema }), castVote)

// The target travels as query parameters rather than as a body: a body on DELETE is legal but
// has no agreed meaning, and intermediaries are free to drop it.
feedbackRoutes.delete(
  '/',
  requireAuth,
  validateRequest({ query: voteTargetSchema }),
  withdrawVote
)

feedbackRoutes.get('/mine', requireAuth, getMyVotes)

import { submitVote, loadVotesForUser } from '../services/feedbackService.js'

export const castVote = async (request, response) => {
  const { sectionType, contentId, vote } = request.body

  // Named one by one rather than spread, so that a body carrying its own `userId` could
  // never reach the service and vote as somebody else.
  const savedVote = await submitVote({ userId: request.userId, sectionType, contentId, vote })

  response.status(201).json({ vote: savedVote })
}

export const getMyVotes = async (request, response) => {
  const votes = await loadVotesForUser(request.userId)
  response.json({ votes })
}

import { submitVote, removeVote, loadVotesForUser } from '../services/feedbackService.js'

export const castVote = async (request, response) => {
  const { sectionType, contentId, vote } = request.body

  // Named one by one rather than spread, so that a body carrying its own `userId` could
  // never reach the service and vote as somebody else.
  const savedVote = await submitVote({ userId: request.userId, sectionType, contentId, vote })

  response.status(201).json({ vote: savedVote })
}

export const withdrawVote = async (request, response) => {
  const { sectionType, contentId } = request.query

  await removeVote({ userId: request.userId, sectionType, contentId })

  // 204 whether or not a row was there. The caller asked for this content to carry no vote from
  // them, and afterwards it does not — reporting 404 would make a second click look like a bug.
  response.status(204).end()
}

export const getMyVotes = async (request, response) => {
  const votes = await loadVotesForUser(request.userId)
  response.json({ votes })
}

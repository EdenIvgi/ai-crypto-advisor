import { FeedbackVote } from '../models/FeedbackVote.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const DUPLICATE_KEY_ERROR_CODE = 11000

export const submitVote = async ({ userId, sectionType, contentId, vote }) => {
  const upsertVote = () =>
    FeedbackVote.findOneAndUpdate(
      { userId, sectionType, contentId },
      { $set: { vote, votedOnDate: getTodayDateKey() } },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )

  try {
    return toVoteDto(await upsertVote())
  } catch (writeError) {
    // Two clicks close enough together can both find no existing vote and both try to
    // insert; the unique index lets exactly one win and rejects the other. That rejection
    // means the row now exists, so the loser simply repeats itself and updates it. Without
    // this, a fast change of mind would surface as a 500 on a working feature.
    if (writeError?.code !== DUPLICATE_KEY_ERROR_CODE) throw writeError
    return toVoteDto(await upsertVote())
  }
}

export const removeVote = async ({ userId, sectionType, contentId }) => {
  const { deletedCount } = await FeedbackVote.deleteOne({ userId, sectionType, contentId })

  return deletedCount > 0
}

export const loadVotesForUser = async (userId) => {
  const votes = await FeedbackVote.find({ userId }).sort({ updatedAt: -1 })

  return votes.map(toVoteDto)
}

const toVoteDto = (voteDocument) => ({
  sectionType: voteDocument.sectionType,
  contentId: voteDocument.contentId,
  vote: voteDocument.vote,
  votedOnDate: voteDocument.votedOnDate,
})

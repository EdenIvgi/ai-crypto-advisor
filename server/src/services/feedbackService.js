import { FeedbackVote } from '../models/FeedbackVote.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const DUPLICATE_KEY_ERROR_CODE = 11000

/**
 * Records what somebody thought of a section, replacing their previous opinion of the same
 * content rather than adding to it.
 *
 * The upsert is keyed by exactly the fields the unique index covers, so changing a thumb up
 * to a thumb down updates one document and two rapid clicks cannot produce two rows.
 *
 * @param {{ userId: string, sectionType: string, contentId: string, vote: 'up' | 'down' }} castVote
 * @returns {Promise<{ sectionType: string, contentId: string, vote: string, votedOnDate: string }>}
 */
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

/**
 * Withdraws an opinion, rather than recording a third kind of one.
 *
 * A vote is a row, so having no opinion is having no row. The alternative — keeping the row with
 * something like `vote: 'none'` — would fill the very dataset these votes exist to become with
 * records of nobody thinking anything.
 *
 * Deleting a vote that is not there is not an error. Two clicks on a pressed thumb should leave
 * the same state as one, and a retry after a dropped response should not fail.
 *
 * @param {{ userId: string, sectionType: string, contentId: string }} target
 * @returns {Promise<boolean>} Whether a vote was actually removed.
 */
export const removeVote = async ({ userId, sectionType, contentId }) => {
  const { deletedCount } = await FeedbackVote.deleteOne({ userId, sectionType, contentId })

  return deletedCount > 0
}

/**
 * Every vote this user has cast. The dashboard needs them all on load so a thumb still looks
 * pressed after a refresh — without this the interface would forget an opinion the database
 * remembers, which reads as the vote not having been saved.
 *
 * @param {string} userId
 * @returns {Promise<Array<{ sectionType: string, contentId: string, vote: string, votedOnDate: string }>>}
 */
export const loadVotesForUser = async (userId) => {
  const votes = await FeedbackVote.find({ userId }).sort({ updatedAt: -1 })

  return votes.map(toVoteDto)
}

/** The public shape of a vote. The user's own id is never echoed back to them. */
const toVoteDto = (voteDocument) => ({
  sectionType: voteDocument.sectionType,
  contentId: voteDocument.contentId,
  vote: voteDocument.vote,
  votedOnDate: voteDocument.votedOnDate,
})

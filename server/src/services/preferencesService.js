import { User } from '../models/User.js'
import { toUserDto } from './authService.js'
import { forgetTodaysInsight } from './aiInsightService.js'
import { removeVote } from './feedbackService.js'
import { NotFoundError } from '../lib/httpErrors.js'
import { SUGGESTED_ASSETS } from '../data/suggestedAssets.js'
import {
  INVESTOR_TYPES,
  CONTENT_SECTIONS,
  INVESTOR_TYPE_LABELS,
  CONTENT_SECTION_LABELS,
  AI_INSIGHT_SECTION,
} from '../data/preferenceOptions.js'

/**
 * Everything the quiz needs to render itself. The investor types and content sections are
 * closed sets served from here so the client can never offer an answer the schema rejects.
 * The assets are only the suggestions shown before anybody searches.
 *
 * @returns {{ assets: Array<{id, symbol, name}>, investorTypes: Array<{value, label}>, contentSections: Array<{value, label}> }}
 */
export const getQuizOptions = () => ({
  assets: SUGGESTED_ASSETS,
  investorTypes: INVESTOR_TYPES.map((value) => ({ value, label: INVESTOR_TYPE_LABELS[value] })),
  contentSections: CONTENT_SECTIONS.map((value) => ({
    value,
    label: CONTENT_SECTION_LABELS[value],
  })),
})

/**
 * @param {string} userId
 * @returns {Promise<object | null>} The saved preferences, or null if the quiz is unanswered.
 */
export const loadPreferences = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new NotFoundError('That account no longer exists')
  return user.preferences ?? null
}

/**
 * Replaces the whole preferences object rather than merging. The quiz always submits a
 * complete set of answers, and a partial merge would let a stale client resurrect an answer
 * the user had just cleared.
 *
 * Answers can be changed at any time, not only during onboarding, which is why the previous set
 * is read first: one section of the dashboard is written for a reader and kept for the day, and
 * only a comparison can say whether it is still addressed to the right person.
 *
 * @param {string} userId
 * @param {{ watchedAssets: Array<{ id: string, name: string, symbol: string }>, investorType: string, contentSections: string[] }} preferences
 * @returns {Promise<ReturnType<typeof toUserDto>>}
 */
export const savePreferences = async (userId, preferences) => {
  const readerBefore = await User.findById(userId).select('preferences').lean()
  if (!readerBefore) throw new NotFoundError('That account no longer exists')

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { preferences } },
    { returnDocument: 'after', runValidators: true }
  )

  if (!updatedUser) throw new NotFoundError('That account no longer exists')

  if (changesWhatTheInsightWouldSay(readerBefore.preferences, preferences)) {
    await discardTodaysInsight(userId)
  }

  return toUserDto(updatedUser)
}

/**
 * Whether the new answers change what the model would write.
 *
 * The insight is built from the investing style and the names of the assets followed, and from
 * nothing else — so switching a *section* on or off is not a reason to spend a model call, and
 * not a reason to throw away a paragraph the reader may already have read and voted on.
 *
 * Assets are compared as a set. The prompt is handed names; the order they were ticked in is
 * click order, which carries no meaning.
 */
const changesWhatTheInsightWouldSay = (before, after) => {
  // No previous answers means this is onboarding, and the dashboard that generates an insight is
  // unreachable until the quiz is done — so there is nothing yet to invalidate.
  if (!before) return false

  return (
    before.investorType !== after.investorType ||
    toSortedAssetIds(before.watchedAssets) !== toSortedAssetIds(after.watchedAssets)
  )
}

const toSortedAssetIds = (watchedAssets) =>
  watchedAssets
    .map((asset) => asset.id)
    .sort()
    .join()

/**
 * Drops today's insight and the thumb that was cast on it.
 *
 * The vote goes too because the paragraph it was about no longer exists, and its `contentId` is
 * built from the reader and the date rather than from the text — so a vote left behind would
 * silently reattach itself to whatever gets written next. A recorded opinion about writing
 * nobody read is worse than no opinion at all, in the one dataset this project keeps.
 *
 * Failures are reported and swallowed. The reader asked to save their answers, and those are
 * saved; a stale paragraph for the rest of the day is exactly what they would have had anyway.
 */
const discardTodaysInsight = async (userId) => {
  try {
    const staleContentId = await forgetTodaysInsight(userId)

    await removeVote({ userId, sectionType: AI_INSIGHT_SECTION, contentId: staleContentId })
  } catch (discardError) {
    console.warn("Kept today's insight after a preferences change:", discardError.message)
  }
}

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

export const getQuizOptions = () => ({
  assets: SUGGESTED_ASSETS,
  investorTypes: INVESTOR_TYPES.map((value) => ({ value, label: INVESTOR_TYPE_LABELS[value] })),
  contentSections: CONTENT_SECTIONS.map((value) => ({
    value,
    label: CONTENT_SECTION_LABELS[value],
  })),
})

export const loadPreferences = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new NotFoundError('That account no longer exists')
  return user.preferences ?? null
}

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

const discardTodaysInsight = async (userId) => {
  try {
    const staleContentId = await forgetTodaysInsight(userId)

    await removeVote({ userId, sectionType: AI_INSIGHT_SECTION, contentId: staleContentId })
  } catch (discardError) {
    console.warn("Kept today's insight after a preferences change:", discardError.message)
  }
}

import { User } from '../models/User.js'
import { toUserDto } from './authService.js'
import { NotFoundError } from '../lib/httpErrors.js'
import { SUPPORTED_ASSETS } from '../data/supportedAssets.js'
import {
  INVESTOR_TYPES,
  CONTENT_SECTIONS,
  INVESTOR_TYPE_LABELS,
  CONTENT_SECTION_LABELS,
} from '../data/preferenceOptions.js'

/**
 * Everything the quiz needs to render itself. Serving the options from here rather than
 * hardcoding them in the client means the two can never disagree about what a valid answer
 * is — the same lists feed this endpoint, the Zod schema, and the Mongoose enum.
 *
 * @returns {{ assets: Array<{id, symbol, name}>, investorTypes: Array<{value, label}>, contentSections: Array<{value, label}> }}
 */
export const getQuizOptions = () => ({
  assets: SUPPORTED_ASSETS,
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
 * @param {string} userId
 * @param {{ watchedAssetIds: string[], investorType: string, contentSections: string[] }} preferences
 * @returns {Promise<ReturnType<typeof toUserDto>>}
 */
export const savePreferences = async (userId, preferences) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { preferences } },
    { new: true, runValidators: true }
  )

  if (!updatedUser) throw new NotFoundError('That account no longer exists')

  return toUserDto(updatedUser)
}

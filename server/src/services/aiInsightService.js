import { MOCK_INSIGHTS_BY_INVESTOR_TYPE } from '../data/mockDashboard.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const DEFAULT_INVESTOR_TYPE = 'hodler'

/**
 * Today's insight for one user, written for the way they said they invest.
 *
 * M11 replaces the body with a cached OpenRouter call stored one document per user per day.
 * The `id` is already the composite that document will be keyed by, so a vote cast on a
 * sample insight and a vote cast on a generated one identify their target the same way.
 *
 * @param {{ userId: string, investorType: string }} reader
 * @returns {Promise<{ insight: { id: string, text: string, date: string }, isFallback: boolean }>}
 */
export const loadDailyInsight = async ({ userId, investorType }) => {
  const date = getTodayDateKey()
  const text =
    MOCK_INSIGHTS_BY_INVESTOR_TYPE[investorType] ??
    MOCK_INSIGHTS_BY_INVESTOR_TYPE[DEFAULT_INVESTOR_TYPE]

  return { insight: { id: `${userId}:${date}`, text, date }, isFallback: true }
}

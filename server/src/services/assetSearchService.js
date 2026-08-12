import { searchCoins } from '../clients/coinGeckoClient.js'
import { createTtlCache } from '../lib/inMemoryCache.js'

const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000

const assetSearchCache = createTtlCache({ ttlMs: SEARCH_CACHE_TTL_MS })

/**
 * Coins matching what somebody typed, for the asset question in the quiz.
 *
 * Unlike a dashboard service this one throws: the reader is mid-action rather than reading a
 * page, so a failed search has to be reported instead of quietly serving nothing.
 *
 * @param {string} query
 * @returns {Promise<{ assets: Array<{ id: string, name: string, symbol: string }> }>}
 */
export const searchAssets = async (query) => {
  const normalizedQuery = query.trim().toLowerCase()

  const { value: assets } = await assetSearchCache.getOrFetch(normalizedQuery, () =>
    searchCoins(normalizedQuery)
  )

  return { assets }
}

import { searchCoins } from '../clients/coinGeckoClient.js'
import { createTtlCache } from '../lib/inMemoryCache.js'

const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000

const assetSearchCache = createTtlCache({ ttlMs: SEARCH_CACHE_TTL_MS })

export const searchAssets = async (query) => {
  const normalizedQuery = query.trim().toLowerCase()

  const { value: assets } = await assetSearchCache.getOrFetch(normalizedQuery, () =>
    searchCoins(normalizedQuery)
  )

  return { assets }
}

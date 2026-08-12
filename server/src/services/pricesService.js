import { fetchCoinQuotes } from '../clients/coinGeckoClient.js'
import { createTtlCache } from '../lib/inMemoryCache.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const COIN_PRICES_CACHE_TTL_MS = 60 * 1000

const coinPricesCache = createTtlCache({ ttlMs: COIN_PRICES_CACHE_TTL_MS })

export const loadCoinPrices = async (watchedAssets) => {
  const assetIds = watchedAssets.map((asset) => asset.id)

  try {
    // Keyed by the sorted ids so that two people following the same assets in a different
    // order share one cached response rather than each paying for their own.
    const { value: quotes, isStale } = await coinPricesCache.getOrFetch(
      [...assetIds].sort().join(','),
      () => fetchCoinQuotes([...assetIds].sort())
    )

    return buildResponse(joinQuotesToAssets(watchedAssets, quotes), isStale)
  } catch (priceLookupError) {
    console.warn('Serving unpriced coins:', priceLookupError.message)
    return buildResponse(joinQuotesToAssets(watchedAssets, []), true)
  }
}

const joinQuotesToAssets = (watchedAssets, quotes) => {
  const quotesById = new Map(quotes.map((quote) => [quote.id, quote]))

  return watchedAssets.map(({ id, symbol, name }) => {
    const quote = quotesById.get(id)

    return {
      id,
      symbol,
      name,
      priceUsd: quote?.priceUsd ?? null,
      change24hPercent: quote?.change24hPercent ?? null,
    }
  })
}

const buildResponse = (coins, isFallback) => ({
  contentId: getTodayDateKey(),
  coins,
  isFallback,
})

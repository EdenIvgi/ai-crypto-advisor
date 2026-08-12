import { fetchCoinQuotes } from '../clients/coinGeckoClient.js'
import { createTtlCache } from '../lib/inMemoryCache.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

// Long enough that a page refresh costs nothing against a rate-limited free API, short
// enough that a price on screen is never meaningfully behind the market.
const COIN_PRICES_CACHE_TTL_MS = 60 * 1000

const coinPricesCache = createTtlCache({ ttlMs: COIN_PRICES_CACHE_TTL_MS })

/**
 * Prices for the assets this user follows, in the order they were chosen.
 *
 * Every asset gets a row whether or not it could be priced. A coin somebody deliberately chose
 * disappearing from their dashboard reads as a bug, so an unpriced one keeps its name and
 * reports `priceUsd: null` for the card to render as unavailable.
 *
 * This function never throws. A section of a dashboard is not worth an error page.
 *
 * @param {Array<{ id: string, name: string, symbol: string }>} watchedAssets
 * @returns {Promise<{ contentId: string, coins: Array<{ id: string, symbol: string, name: string, priceUsd: number | null, change24hPercent: number | null }>, isFallback: boolean }>}
 */
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

/**
 * Joins each asset to its quote, keeping the reader's order and keeping assets CoinGecko had
 * nothing for.
 */
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

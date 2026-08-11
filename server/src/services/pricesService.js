import { SUPPORTED_ASSETS } from '../data/supportedAssets.js'
import { MOCK_COIN_PRICES } from '../data/mockDashboard.js'
import { fetchCoinQuotes } from '../clients/coinGeckoClient.js'
import { createTtlCache } from '../lib/inMemoryCache.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const ASSETS_BY_ID = new Map(SUPPORTED_ASSETS.map((asset) => [asset.id, asset]))

// Long enough that a page refresh costs nothing against a rate-limited free API, short
// enough that a price on screen is never meaningfully behind the market.
const COIN_PRICES_CACHE_TTL_MS = 60 * 1000

const coinPricesCache = createTtlCache({ ttlMs: COIN_PRICES_CACHE_TTL_MS })

/**
 * Prices for the assets this user follows, in the order they were chosen.
 *
 * Three sources, in order of preference: a live CoinGecko response, the last one that
 * succeeded, and finally the sample data the dashboard was built against. The last two both
 * report `isFallback: true`, because both mean the same thing to a reader — these are not the
 * numbers the market is quoting right now.
 *
 * This function never throws. A section of a dashboard is not worth an error page.
 *
 * @param {string[]} watchedAssetIds - CoinGecko ids, e.g. ['bitcoin', 'ethereum']
 * @returns {Promise<{ contentId: string, coins: Array<{ id: string, symbol: string, name: string, priceUsd: number, change24hPercent: number }>, isFallback: boolean }>}
 */
export const loadCoinPrices = async (watchedAssetIds) => {
  const knownAssetIds = watchedAssetIds.filter((assetId) => ASSETS_BY_ID.has(assetId))

  try {
    // Keyed by the sorted ids so that two people following the same assets in a different
    // order share one cached response rather than each paying for their own. The client
    // returns them in the order asked, so the cache holds one person's order — which is why
    // the naming happens below, over the ids this caller actually asked about.
    const { value: quotes, isStale } = await coinPricesCache.getOrFetch(
      [...knownAssetIds].sort().join(','),
      () => fetchCoinQuotes([...knownAssetIds].sort())
    )

    return buildResponse(nameQuotesInChosenOrder(quotes, knownAssetIds), isStale)
  } catch (priceLookupError) {
    console.warn('Falling back to sample prices:', priceLookupError.message)
    return buildResponse(buildSampleCoins(knownAssetIds), true)
  }
}

/**
 * Joins each quote to the asset's display name and ticker, in the order this reader chose.
 *
 * The names come from `data/supportedAssets.js` rather than from CoinGecko, which is why the
 * client does not return them: they are ours, they never change between requests, and there is
 * no reason to cache twelve copies of the word "Bitcoin".
 */
const nameQuotesInChosenOrder = (quotes, watchedAssetIds) => {
  const quotesById = new Map(quotes.map((quote) => [quote.id, quote]))

  return watchedAssetIds
    .filter((assetId) => quotesById.has(assetId))
    .map((assetId) => {
      const { symbol, name } = ASSETS_BY_ID.get(assetId)
      const { priceUsd, change24hPercent } = quotesById.get(assetId)

      return { id: assetId, symbol, name, priceUsd, change24hPercent }
    })
}

const buildSampleCoins = (watchedAssetIds) =>
  watchedAssetIds
    .filter((assetId) => MOCK_COIN_PRICES[assetId])
    .map((assetId) => ({
      id: assetId,
      symbol: ASSETS_BY_ID.get(assetId).symbol,
      name: ASSETS_BY_ID.get(assetId).name,
      ...MOCK_COIN_PRICES[assetId],
    }))

const buildResponse = (coins, isFallback) => ({
  contentId: getTodayDateKey(),
  coins,
  isFallback,
})

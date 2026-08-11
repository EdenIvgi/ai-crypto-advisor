import { SUPPORTED_ASSETS } from '../data/supportedAssets.js'
import { MOCK_COIN_PRICES } from '../data/mockDashboard.js'
import { fetchCoinMarkets } from '../clients/coinGeckoClient.js'
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
    // order share one cached response rather than each paying for their own.
    const { value: coins, isStale } = await coinPricesCache.getOrFetch(
      [...knownAssetIds].sort().join(','),
      () => fetchCoinMarkets(knownAssetIds)
    )

    return buildResponse(sortAsChosen(coins, knownAssetIds), isStale)
  } catch (priceLookupError) {
    console.warn('Falling back to sample prices:', priceLookupError.message)
    return buildResponse(buildSampleCoins(knownAssetIds), true)
  }
}

/**
 * CoinGecko answers in market-capitalisation order, which is not the order anyone chose. A
 * list that reshuffles itself relative to the quiz is harder to read at a glance.
 */
const sortAsChosen = (coins, watchedAssetIds) =>
  watchedAssetIds
    .map((assetId) => coins.find((coin) => coin.id === assetId))
    .filter((coin) => coin !== undefined)

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

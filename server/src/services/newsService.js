import { SUPPORTED_ASSETS } from '../data/supportedAssets.js'
import { MOCK_NEWS_ARTICLES } from '../data/mockDashboard.js'
import { fetchLatestPosts, isCryptoPanicConfigured } from '../clients/cryptoPanicClient.js'
import { createTtlCache } from '../lib/inMemoryCache.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const SYMBOLS_BY_ASSET_ID = new Map(SUPPORTED_ASSETS.map((asset) => [asset.id, asset.symbol]))

const ARTICLE_COUNT = 5

// Ten times the price cache, because headlines arrive at a tenth of the rate. Prices move
// between two glances at the screen; a story published four minutes ago is still the news.
const MARKET_NEWS_CACHE_TTL_MS = 10 * 60 * 1000

const marketNewsCache = createTtlCache({ ttlMs: MARKET_NEWS_CACHE_TTL_MS })

/**
 * Headlines about the assets this user follows, newest first.
 *
 * Same three sources as every other section, in the same order: live, last good response,
 * bundled sample. The last two both report `isFallback: true`, so the interface never
 * presents saved headlines as today's.
 *
 * This function never throws. A section of a dashboard is not worth an error page.
 *
 * @param {string[]} watchedAssetIds - CoinGecko ids, e.g. ['bitcoin', 'ethereum']
 * @returns {Promise<{ contentId: string, articles: Array<{ id: string, title: string, url: string, source: string, publishedAt: string }>, isFallback: boolean }>}
 */
export const loadMarketNews = async (watchedAssetIds) => {
  const watchedSymbols = watchedAssetIds
    .map((assetId) => SYMBOLS_BY_ASSET_ID.get(assetId))
    .filter((symbol) => symbol !== undefined)

  // A configuration fact, not a failure, so it is answered before anything is attempted
  // rather than by letting the client throw once per request into an empty cache.
  if (!isCryptoPanicConfigured) return buildResponse(buildSampleArticles(), true)

  try {
    // Keyed by the sorted symbols, so everyone following the same assets shares one upstream
    // request no matter what order they picked them in.
    const { value: articles, isStale } = await marketNewsCache.getOrFetch(
      [...watchedSymbols].sort().join(','),
      () => fetchLatestPosts(watchedSymbols)
    )

    return buildResponse(articles.slice(0, ARTICLE_COUNT), isStale)
  } catch (newsLookupError) {
    console.warn('Falling back to sample headlines:', newsLookupError.message)
    return buildResponse(buildSampleArticles(), true)
  }
}

/**
 * `hoursAgo` becomes a timestamp at the moment the request is served, so the sample feed
 * reads as this morning's news rather than as whenever the file was written.
 */
const buildSampleArticles = () => {
  const nowMs = Date.now()

  return MOCK_NEWS_ARTICLES.slice(0, ARTICLE_COUNT).map(({ hoursAgo, ...article }) => ({
    ...article,
    publishedAt: new Date(nowMs - hoursAgo * 60 * 60 * 1000).toISOString(),
  }))
}

const buildResponse = (articles, isFallback) => ({
  // The vote is on the day's selection of headlines, not on a single article — the section
  // shows a list and carries one thumb.
  contentId: getTodayDateKey(),
  articles,
  isFallback,
})

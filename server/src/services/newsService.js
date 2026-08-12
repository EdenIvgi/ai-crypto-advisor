import { MOCK_NEWS_ARTICLES } from '../data/mockDashboard.js'
import { fetchLatestArticles } from '../clients/newsFeedClient.js'
import { createTtlCache } from '../lib/inMemoryCache.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const ARTICLE_COUNT = 5

// Ten times the price cache, because headlines arrive at a tenth of the rate. Prices move
// between two glances at the screen; a story published four minutes ago is still the news.
const MARKET_NEWS_CACHE_TTL_MS = 10 * 60 * 1000

// One entry, not one per reader: every dashboard reads the same four feeds, and who follows
// what is applied below, after the cache. So the publishers see one request per ten minutes
// no matter how many people are looking.
const SHARED_FEED_CACHE_KEY = 'all-feeds'

const marketNewsCache = createTtlCache({ ttlMs: MARKET_NEWS_CACHE_TTL_MS })

/**
 * Headlines for the dashboard's news section: five of them, the ones naming an asset this
 * reader follows first, the rest by recency.
 *
 * Ranked rather than filtered, deliberately. A headline is matched by looking for the coin's
 * name in it, which is a guess — "the largest cryptocurrency has recovered" is about Bitcoin
 * and says nothing of the sort. Ranking lets that guess order the list without ever costing
 * anyone an article it got wrong, and the section can never come up short.
 *
 * Same three sources as every other section, in the same order: live, last good response,
 * bundled sample. The last two both report `isFallback: true`, so the interface never
 * presents saved headlines as today's.
 *
 * This function never throws. A section of a dashboard is not worth an error page.
 *
 * @param {Array<{ id: string, name: string, symbol: string }>} watchedAssets
 * @returns {Promise<{ contentId: string, articles: Array<{ id: string, title: string, url: string, source: string, publishedAt: string }>, isFallback: boolean }>}
 */
export const loadMarketNews = async (watchedAssets) => {
  try {
    const { value: articles, isStale } = await marketNewsCache.getOrFetch(
      SHARED_FEED_CACHE_KEY,
      fetchLatestArticles
    )

    return buildResponse(
      rankForReader(articles, watchedAssets).slice(0, ARTICLE_COUNT),
      isStale
    )
  } catch (newsLookupError) {
    console.warn('Falling back to sample headlines:', newsLookupError.message)
    return buildResponse(buildSampleArticles(), true)
  }
}

/**
 * Lifts the headlines naming one of the reader's assets to the top. The list arrives newest
 * first and both groups are built by walking it in order, so recency survives inside each.
 */
const rankForReader = (articles, watchedAssets) => {
  const headlineMatchers = buildHeadlineMatchers(watchedAssets)
  if (headlineMatchers.length === 0) return articles

  const articlesNamingWatchedAssets = []
  const otherArticles = []

  for (const article of articles) {
    const matchesReader = headlineMatchers.some((matcher) => matcher.test(article.title))
    if (matchesReader) {
      articlesNamingWatchedAssets.push(article)
    } else {
      otherArticles.push(article)
    }
  }

  return [...articlesNamingWatchedAssets, ...otherArticles]
}

/**
 * Two patterns per asset, and the difference between them is the point. A name can be written
 * however a sub-editor felt that morning, so it is matched case-insensitively. A ticker cannot
 * be: `DOT` is Polkadot and `dot` is punctuation, and `\bATOM\b` without that rule would claim
 * every headline containing the word "atom".
 */
const buildHeadlineMatchers = (watchedAssets) =>
  watchedAssets.flatMap((asset) => [
    new RegExp(`\\b${escapeForRegExp(asset.name)}\\b`, 'i'),
    new RegExp(`\\b${escapeForRegExp(asset.symbol)}\\b`),
  ])

// A coin name is whatever CoinGecko calls it, and plenty contain characters a regular
// expression reads as syntax — "Curve DAO (old)" would throw rather than match.
const escapeForRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

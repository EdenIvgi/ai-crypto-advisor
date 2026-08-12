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

const buildHeadlineMatchers = (watchedAssets) =>
  watchedAssets.flatMap((asset) => [
    new RegExp(`\\b${escapeForRegExp(asset.name)}\\b`, 'i'),
    new RegExp(`\\b${escapeForRegExp(asset.symbol)}\\b`),
  ])

// A coin name is whatever CoinGecko calls it, and plenty contain characters a regular
// expression reads as syntax — "Curve DAO (old)" would throw rather than match.
const escapeForRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

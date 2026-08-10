import { MOCK_NEWS_ARTICLES } from '../data/mockDashboard.js'

const ARTICLE_COUNT = 5

/**
 * Headlines for the dashboard's news section, newest first.
 *
 * M9 replaces the body with a CryptoPanic call filtered by the user's assets, falling back
 * to a static file on any failure. The shape returned here is the one it has to produce.
 *
 * @returns {Promise<{ articles: Array<{ id: string, title: string, url: string, source: string, publishedAt: string }>, isFallback: boolean }>}
 */
export const loadMarketNews = async () => {
  const now = Date.now()

  const articles = MOCK_NEWS_ARTICLES.slice(0, ARTICLE_COUNT).map(
    ({ hoursAgo, ...article }) => ({
      ...article,
      publishedAt: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
    })
  )

  return { articles, isFallback: true }
}

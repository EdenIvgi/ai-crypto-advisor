import { loadCoinPrices } from '../services/pricesService.js'
import { loadMarketNews } from '../services/newsService.js'
import { loadDailyInsight } from '../services/aiInsightService.js'
import { loadDailyMeme } from '../services/memeService.js'

/**
 * One endpoint per section rather than one combined payload, so a slow or failing source
 * degrades its own card and nothing else. The client fetches all four in parallel.
 */

export const getCoinPrices = async (request, response) => {
  response.json(await loadCoinPrices(request.currentUser.preferences.watchedAssetIds))
}

export const getMarketNews = async (request, response) => {
  response.json(await loadMarketNews(request.currentUser.preferences.watchedAssetIds))
}

export const getAiInsight = async (request, response) => {
  response.json(
    await loadDailyInsight({
      userId: request.userId,
      investorType: request.currentUser.preferences.investorType,
    })
  )
}

export const getCryptoMeme = async (_request, response) => {
  response.json(await loadDailyMeme())
}

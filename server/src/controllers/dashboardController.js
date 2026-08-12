import { loadCoinPrices } from '../services/pricesService.js'
import { loadMarketNews } from '../services/newsService.js'
import { loadDailyInsight } from '../services/aiInsightService.js'
import { loadDailyMeme } from '../services/memeService.js'

export const getCoinPrices = async (request, response) => {
  response.json(await loadCoinPrices(request.currentUser.preferences.watchedAssets))
}

export const getMarketNews = async (request, response) => {
  response.json(await loadMarketNews(request.currentUser.preferences.watchedAssets))
}

export const getAiInsight = async (request, response) => {
  const { investorType, watchedAssets } = request.currentUser.preferences

  response.json(await loadDailyInsight({ userId: request.userId, investorType, watchedAssets }))
}

export const getCryptoMeme = async (_request, response) => {
  response.json(await loadDailyMeme())
}

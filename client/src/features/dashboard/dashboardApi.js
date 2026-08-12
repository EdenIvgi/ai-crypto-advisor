import { requestApi } from '@/lib/apiClient.js'

export const fetchCoinPrices = () => requestApi('/api/dashboard/prices')

export const fetchMarketNews = () => requestApi('/api/dashboard/news')

export const fetchAiInsight = () => requestApi('/api/dashboard/insight')

export const fetchCryptoMeme = () => requestApi('/api/dashboard/meme')

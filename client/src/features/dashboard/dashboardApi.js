import { requestApi } from '@/lib/apiClient.js'

/**
 * One request per section. They are separate endpoints so that a source which is slow or
 * down affects only its own card — a single combined payload would make the whole dashboard
 * as slow as its worst integration.
 */

export const fetchCoinPrices = () => requestApi('/api/dashboard/prices')

export const fetchMarketNews = () => requestApi('/api/dashboard/news')

export const fetchAiInsight = () => requestApi('/api/dashboard/insight')

export const fetchCryptoMeme = () => requestApi('/api/dashboard/meme')

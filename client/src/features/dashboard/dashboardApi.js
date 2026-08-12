import { requestApi } from '@/lib/apiClient.js'

// Deliberately longer than the server's own budget for the model, so a slow answer arrives as the
// server's message rather than as an abort with nothing to show for it.
const ASK_TIMEOUT_MS = 40000

export const fetchCoinPrices = () => requestApi('/api/dashboard/prices')

export const fetchMarketNews = () => requestApi('/api/dashboard/news')

export const fetchAiInsight = () => requestApi('/api/dashboard/insight')

export const fetchCryptoMeme = () => requestApi('/api/dashboard/meme')

export const postCryptoQuestion = (question) =>
  requestApi('/api/dashboard/ask', {
    method: 'POST',
    body: { question },
    signal: AbortSignal.timeout(ASK_TIMEOUT_MS),
  })

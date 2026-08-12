import { useMutation, useQuery } from '@tanstack/react-query'

import {
  fetchCoinPrices,
  fetchMarketNews,
  fetchAiInsight,
  fetchCryptoMeme,
  postCryptoQuestion,
} from './dashboardApi.js'

const PRICES_STALE_TIME_MS = 60 * 1000
const NEWS_STALE_TIME_MS = 5 * 60 * 1000
const DAILY_STALE_TIME_MS = 60 * 60 * 1000

export const useCoinPrices = () =>
  useQuery({
    queryKey: ['dashboard', 'prices'],
    queryFn: fetchCoinPrices,
    staleTime: PRICES_STALE_TIME_MS,
    refetchInterval: PRICES_STALE_TIME_MS,
  })

export const useMarketNews = () =>
  useQuery({
    queryKey: ['dashboard', 'news'],
    queryFn: fetchMarketNews,
    staleTime: NEWS_STALE_TIME_MS,
  })

export const useAiInsight = () =>
  useQuery({
    queryKey: ['dashboard', 'insight'],
    queryFn: fetchAiInsight,
    staleTime: DAILY_STALE_TIME_MS,
  })

export const useCryptoMeme = () =>
  useQuery({
    queryKey: ['dashboard', 'meme'],
    queryFn: fetchCryptoMeme,
    staleTime: DAILY_STALE_TIME_MS,
  })

// A mutation rather than a query, because asking is something the reader does rather than
// something the page has: nothing is cached, and the same question asked twice is asked twice.
export const useAskAboutCrypto = () => useMutation({ mutationFn: postCryptoQuestion })

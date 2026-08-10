import { useQuery } from '@tanstack/react-query'

import {
  fetchCoinPrices,
  fetchMarketNews,
  fetchAiInsight,
  fetchCryptoMeme,
} from './dashboardApi.js'

const PRICES_STALE_TIME_MS = 60 * 1000
const NEWS_STALE_TIME_MS = 5 * 60 * 1000
const DAILY_STALE_TIME_MS = 60 * 60 * 1000

/**
 * Four independent queries rather than one, matching the four endpoints. Each section
 * subscribes only to its own, so one failure leaves the other three untouched.
 *
 * The stale times mirror how often each source actually changes, which is also what the
 * server-side caches will use from M8 onward: refetching prices is worth it, refetching a
 * meme chosen once a day is not.
 */

export const useCoinPrices = () =>
  useQuery({
    queryKey: ['dashboard', 'prices'],
    queryFn: fetchCoinPrices,
    staleTime: PRICES_STALE_TIME_MS,
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

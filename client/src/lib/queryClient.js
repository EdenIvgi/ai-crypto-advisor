import { QueryClient } from '@tanstack/react-query'
import { ApiRequestError } from './apiClient.js'

const ONE_MINUTE_MS = 60 * 1000

/**
 * Retrying a 401 or a 400 just delays the error the user needs to see, so retries are
 * limited to failures that a second attempt could plausibly fix — network blips and
 * server errors, which on Render's free tier usually means a cold start.
 */
const shouldRetryRequest = (failureCount, error) => {
  if (failureCount >= 2) return false
  if (!(error instanceof ApiRequestError)) return false
  if (error.code === 'NETWORK_ERROR') return true
  return error.statusCode >= 500
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: ONE_MINUTE_MS,
      refetchOnWindowFocus: false,
      retry: shouldRetryRequest,
    },
    mutations: {
      retry: false,
    },
  },
})

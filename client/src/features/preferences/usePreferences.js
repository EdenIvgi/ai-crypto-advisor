import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { CURRENT_USER_QUERY_KEY } from '@/features/auth/useAuth.js'
import { fetchQuizOptions, putPreferences, searchAssets } from './preferencesApi.js'

export const MINIMUM_SEARCH_LENGTH = 2

// CoinGecko rebuilds its own search index every ten minutes, so holding a result for that long
// costs nothing in freshness and keeps a repeated search off the monthly call allowance.
const ASSET_SEARCH_STALE_TIME_MS = 10 * 60 * 1000

export const useQuizOptions = () =>
  useQuery({
    queryKey: ['preferences', 'options'],
    queryFn: fetchQuizOptions,
    staleTime: Infinity,
  })

export const useAssetSearch = (query) => {
  const trimmedQuery = query.trim()

  return useQuery({
    queryKey: ['assets', 'search', trimmedQuery.toLowerCase()],
    queryFn: () => searchAssets(trimmedQuery),
    enabled: trimmedQuery.length >= MINIMUM_SEARCH_LENGTH,
    staleTime: ASSET_SEARCH_STALE_TIME_MS,
  })
}

export const useSavePreferences = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: putPreferences,
    onSuccess: ({ user }) => {
      // Replaced rather than invalidated, and before navigating: the guard reads this to decide
      // whether the quiz is done, so a refetch in flight would bounce a new user back to it.
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user)

      // Every section is built from these answers, and the insight may have been thrown away and
      // rewritten server-side, so none of the four cached responses can be trusted afterwards.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      // The server withdraws the thumb on an insight it discarded, so the votes this browser
      // holds may name content that no longer exists.
      queryClient.invalidateQueries({ queryKey: ['feedback', 'mine'] })

      navigate('/dashboard', { replace: true })
    },
  })
}

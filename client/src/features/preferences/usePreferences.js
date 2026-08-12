import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { CURRENT_USER_QUERY_KEY } from '@/features/auth/useAuth.js'
import { fetchQuizOptions, putPreferences, searchAssets } from './preferencesApi.js'

export const MINIMUM_SEARCH_LENGTH = 2

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

      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      queryClient.invalidateQueries({ queryKey: ['feedback', 'mine'] })

      navigate('/dashboard', { replace: true })
    },
  })
}

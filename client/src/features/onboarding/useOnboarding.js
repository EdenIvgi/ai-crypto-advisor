import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { CURRENT_USER_QUERY_KEY } from '@/features/auth/useAuth.js'
import { fetchQuizOptions, putPreferences } from './preferencesApi.js'

/**
 * The quiz's questions come from the server so the options can never drift from what the
 * API will accept. They do not change between sessions, so they are cached indefinitely.
 */
export const useQuizOptions = () =>
  useQuery({
    queryKey: ['preferences', 'options'],
    queryFn: fetchQuizOptions,
    staleTime: Infinity,
  })

export const useSavePreferences = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: putPreferences,
    onSuccess: ({ user }) => {
      // The saved answers change what the dashboard shows, so the cached user has to be
      // replaced before we navigate — otherwise the guard would still see them as
      // un-onboarded and bounce them straight back here.
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user)
      navigate('/dashboard', { replace: true })
    },
  })
}

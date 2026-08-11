import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { CURRENT_USER_QUERY_KEY } from '@/features/auth/useAuth.js'
import { fetchQuizOptions, putPreferences } from './preferencesApi.js'

/**
 * The questions come from the server so the options can never drift from what the API will
 * accept. They do not change between sessions, so they are cached indefinitely.
 */
export const useQuizOptions = () =>
  useQuery({
    queryKey: ['preferences', 'options'],
    queryFn: fetchQuizOptions,
    staleTime: Infinity,
  })

/**
 * Saves a complete set of answers, from onboarding or from the settings screen, and lands on the
 * dashboard — which is the answer to "did that work", because the dashboard is what the answers
 * configure.
 *
 * Both callers share this, and the cache work matters more for the second one: the first time
 * through there is nothing cached to be wrong.
 */
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

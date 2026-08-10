import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { ApiRequestError } from '@/lib/apiClient.js'
import {
  fetchCurrentUser,
  postRegistration,
  postLogin,
  postDemoLogin,
  postLogout,
} from './authApi.js'

export const CURRENT_USER_QUERY_KEY = ['auth', 'me']

/**
 * Who is signed in, or `null`. A 401 is the expected answer for a visitor, not a failure, so
 * it resolves to null instead of putting the query into an error state — otherwise every
 * screen would have to special-case "errored because signed out".
 */
export const useCurrentUser = () => {
  const query = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      try {
        const { user } = await fetchCurrentUser()
        return user
      } catch (error) {
        if (error instanceof ApiRequestError && error.statusCode === 401) return null
        throw error
      }
    },
  })

  return {
    user: query.data ?? null,
    isSignedIn: Boolean(query.data),
    isResolvingSession: query.isPending,
    sessionError: query.error,
  }
}

/**
 * Shared by every way of starting a session. Each one puts the returned user straight into
 * the cache, so the next screen renders without a second round trip, then sends the person
 * where they belong: the quiz if they have not answered it, the dashboard if they have.
 */
const useStartSession = (submitCredentials) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: submitCredentials,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user)
      navigate(user.hasCompletedOnboarding ? '/dashboard' : '/onboarding', { replace: true })
    },
  })
}

export const useSignup = () => useStartSession(postRegistration)
export const useLogin = () => useStartSession(postLogin)
export const useDemoLogin = () => useStartSession(postDemoLogin)

export const useLogout = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: postLogout,
    onSuccess: () => {
      // Clear everything, not just the session: dashboard and feedback data belong to the
      // person who just left.
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })
}

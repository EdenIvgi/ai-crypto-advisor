import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useCurrentUser } from '@/features/auth/useAuth.js'

/**
 * Guards everything behind a session, and enforces the one ordering rule the product has:
 * you answer the quiz before you see a dashboard.
 *
 * `requiresOnboarding` is false for the quiz route itself — otherwise it would redirect to
 * itself forever.
 */
export const ProtectedRoute = ({ requiresOnboarding = true }) => {
  const { user, isResolvingSession } = useCurrentUser()
  const location = useLocation()

  if (isResolvingSession) return <SessionPlaceholder />

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  if (requiresOnboarding && !user.hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  if (!requiresOnboarding && user.hasCompletedOnboarding) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

/**
 * Shown only while the session request is in flight. It says nothing, on purpose: flashing
 * "signed out" or "signing in" before the answer is known would be a guess, and on a cold
 * Render instance that guess would be on screen for several seconds.
 */
const SessionPlaceholder = () => (
  <div className="flex min-h-svh items-center justify-center" role="status" aria-live="polite">
    <span className="sr-only">Checking your session</span>
    <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
)

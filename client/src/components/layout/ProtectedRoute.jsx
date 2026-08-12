import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useCurrentUser } from '@/features/auth/useAuth.js'

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

const SessionPlaceholder = () => (
  <div className="flex min-h-svh items-center justify-center" role="status" aria-live="polite">
    <span className="sr-only">Checking your session</span>
    <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
)

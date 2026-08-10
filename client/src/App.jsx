import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'

import { AppHeader } from '@/components/layout/AppHeader.jsx'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute.jsx'
import { LoginPage } from '@/features/auth/LoginPage.jsx'
import { SignupPage } from '@/features/auth/SignupPage.jsx'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage.jsx'
import { DashboardPage } from '@/features/dashboard/DashboardPage.jsx'

/** Signed-in screens share the header; the auth screens have their own full-page layout. */
const SignedInLayout = () => (
  <div className="min-h-svh">
    <AppHeader />
    <Outlet />
  </div>
)

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* The quiz is the one signed-in screen that must be reachable before onboarding. */}
      <Route element={<ProtectedRoute requiresOnboarding={false} />}>
        <Route element={<SignedInLayout />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<SignedInLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      {/* Anything else lands on the dashboard, which redirects onward as the session requires. */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
)

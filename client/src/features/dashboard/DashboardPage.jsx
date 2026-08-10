import { useCurrentUser } from '@/features/auth/useAuth.js'

/** Placeholder until M5 builds the four sections. The session and its guards are real. */
export const DashboardPage = () => {
  const { user } = useCurrentUser()

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <p className="eyebrow mb-3">Your daily briefing</p>
      <h1 className="text-3xl font-semibold tracking-tight">Good to see you, {user?.name}</h1>
      <p className="mt-3 text-muted-foreground">
        Following{' '}
        <span className="font-mono text-foreground">
          {user?.preferences?.watchedAssetIds.join(', ')}
        </span>
        . The four sections arrive in M5.
      </p>
    </main>
  )
}

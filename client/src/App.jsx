import { useQuery } from '@tanstack/react-query'
import { requestApi } from './lib/apiClient.js'

/**
 * Scaffold screen for M1: it exists to prove the client, the API, and the cross-origin
 * policy all line up before any feature is built on top of them. M3 replaces it with the
 * real router and the login screen.
 */
export const App = () => {
  const apiHealthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => requestApi('/api/health'),
  })

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">AI Crypto Advisor</h1>
          <p className="text-sm text-muted-foreground">
            Scaffold is up. Feature work starts at M2.
          </p>
        </div>

        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium">API connection</p>
          <p className="mt-1 text-muted-foreground">
            {apiHealthQuery.isPending && 'Checking…'}
            {apiHealthQuery.isError && apiHealthQuery.error.message}
            {apiHealthQuery.isSuccess &&
              `Reachable — up for ${apiHealthQuery.data.uptimeSeconds}s`}
          </p>
        </div>
      </div>
    </main>
  )
}

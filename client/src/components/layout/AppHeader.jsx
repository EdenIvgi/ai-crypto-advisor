import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button.jsx'
import { useCurrentUser, useLogout } from '@/features/auth/useAuth.js'

export const AppHeader = () => {
  const { user } = useCurrentUser()
  const logout = useLogout()

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link to="/dashboard" className="flex items-baseline gap-1.5 text-base">
          <span className="font-mono text-xs font-medium tracking-[0.2em] text-primary uppercase">
            AI
          </span>
          <span className="font-semibold tracking-tight">Crypto Advisor</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </div>
    </header>
  )
}

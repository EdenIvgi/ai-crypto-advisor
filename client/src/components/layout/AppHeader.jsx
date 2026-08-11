import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button.jsx'
import { ThemeToggle } from '@/components/layout/ThemeToggle.jsx'
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

        <div className="flex items-center gap-1 sm:gap-2">
          {user ? <ProfileLink name={user.name} /> : null}
          <ThemeToggle />
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

/**
 * The way into the settings screen, and the only one — which is why the initial stays visible when
 * the name does not. On a narrow screen there is no room for both the name and Sign out, and
 * hiding the whole control would leave a phone with no way to change an answer.
 *
 * The `sr-only` line names the destination rather than the person, since "Eden A" on its own does
 * not tell anybody what the link does.
 */
const ProfileLink = ({ name }) => (
  <Button variant="ghost" size="sm" asChild>
    <Link to="/settings">
      <span
        aria-hidden="true"
        className="flex size-6 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-medium text-primary"
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="sr-only">Your preferences</span>
      <span className="hidden max-w-32 truncate text-muted-foreground sm:inline">{name}</span>
    </Link>
  </Button>
)

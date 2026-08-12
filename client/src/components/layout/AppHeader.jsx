import { useRef } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx'
import { ThemeToggle } from '@/components/layout/ThemeToggle.jsx'
import { useCurrentUser, useLogout } from '@/features/auth/useAuth.js'

export const AppHeader = () => {
  const { user } = useCurrentUser()

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
          {user ? <ProfileMenu name={user.name} /> : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

const ProfileMenu = ({ name }) => {
  const logout = useLogout()
  const wasClosedByPointer = useRef(false)

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-32 truncate text-sm text-muted-foreground sm:inline">
        {name}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Your account"
            className="group hover:bg-transparent dark:hover:bg-transparent"
          >
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-medium text-primary transition-transform duration-100 ease-out motion-safe:group-hover:scale-110"
            >
              {name.trim().charAt(0).toUpperCase()}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-44"
          onPointerDownOutside={() => {
            wasClosedByPointer.current = true
          }}
          onCloseAutoFocus={(event) => {
            if (!wasClosedByPointer.current) return
            wasClosedByPointer.current = false
            event.preventDefault()
          }}
        >
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/settings">Your preferences</Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={logout.isPending}
            onSelect={() => logout.mutate()}
            className="cursor-pointer"
          >
            {logout.isPending ? 'Signing out…' : 'Sign out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

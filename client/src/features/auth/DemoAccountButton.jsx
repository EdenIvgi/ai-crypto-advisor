import { Button } from '@/components/ui/button.jsx'

import { useDemoLogin } from './useAuth.js'

export const DemoAccountButton = () => {
  const demoLogin = useDemoLogin()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-muted-foreground uppercase">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => demoLogin.mutate()}
        disabled={demoLogin.isPending}
      >
        {demoLogin.isPending ? 'Opening the demo…' : 'Look around with a demo account'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Skips the quiz and lands on a dashboard that is already set up.
      </p>

      {demoLogin.isError ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {demoLogin.error.message}
        </p>
      ) : null}
    </div>
  )
}

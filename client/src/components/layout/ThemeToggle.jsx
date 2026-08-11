import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button.jsx'
import {
  applyTheme,
  rememberTheme,
  readAppliedTheme,
  DARK_THEME,
  LIGHT_THEME,
} from '@/lib/theme.js'

/**
 * Switches between the two themes and remembers which one.
 *
 * The icon shows where the button goes rather than where you are — a sun to go light, a moon to go
 * dark — which is what the accessible label says out loud. A control named for its destination is
 * one you can use without first working out which state you are in.
 *
 * The initial value is read from the class the inline script in `index.html` already applied, not
 * from storage, so the button cannot start out disagreeing with the page.
 */
export const ThemeToggle = () => {
  const [theme, setTheme] = useState(readAppliedTheme)

  const nextTheme = theme === DARK_THEME ? LIGHT_THEME : DARK_THEME

  const switchToNextTheme = () => {
    applyTheme(nextTheme)
    rememberTheme(nextTheme)
    setTheme(nextTheme)
  }

  const NextThemeIcon = nextTheme === DARK_THEME ? Moon : Sun

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={switchToNextTheme}
      aria-label={`Switch to the ${nextTheme} theme`}
      className="text-muted-foreground hover:text-foreground"
    >
      <NextThemeIcon className="size-4" aria-hidden="true" />
    </Button>
  )
}

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

const THEME_STORAGE_KEY = 'ai-crypto-advisor.theme'

export const DARK_THEME = 'dark'
export const LIGHT_THEME = 'light'

export const readAppliedTheme = () =>
  document.documentElement.classList.contains(DARK_THEME) ? DARK_THEME : LIGHT_THEME

export const applyTheme = (theme) => {
  document.documentElement.classList.toggle(DARK_THEME, theme === DARK_THEME)
}

export const rememberTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (storageError) {
    console.warn('Could not save your theme for next time:', storageError.message)
  }
}

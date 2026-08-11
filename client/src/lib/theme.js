/**
 * The theme is a class on `<html>` rather than a media query, because the reader's choice has to
 * beat the operating system's — and `@custom-variant dark (&:is(.dark *))` in `index.css` resolves
 * against an ancestor carrying that class.
 *
 * The same key is spelled out again in the inline script in `index.html`. That duplication is
 * deliberate: that script has to run before the bundle loads, so it cannot import this module, and
 * importing one would cost the round trip it exists to avoid.
 */
const THEME_STORAGE_KEY = 'ai-crypto-advisor.theme'

export const DARK_THEME = 'dark'
export const LIGHT_THEME = 'light'

/**
 * The theme currently painted, read from the document rather than from storage.
 *
 * Storage says what the reader once chose; the class says what they are looking at. Reading the
 * class is what stops the toggle from ever disagreeing with the page it sits on.
 *
 * @returns {'light' | 'dark'}
 */
export const readAppliedTheme = () =>
  document.documentElement.classList.contains(DARK_THEME) ? DARK_THEME : LIGHT_THEME

/**
 * Paints a theme immediately.
 *
 * @param {'light' | 'dark'} theme
 */
export const applyTheme = (theme) => {
  document.documentElement.classList.toggle(DARK_THEME, theme === DARK_THEME)
}

/**
 * Remembers the choice for next time, and shrugs if it cannot.
 *
 * `localStorage` throws rather than returning null when a browser has storage switched off or is
 * in a mode that forbids it. Losing the preference for this session is a much smaller failure than
 * a page that will not render.
 *
 * @param {'light' | 'dark'} theme
 */
export const rememberTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (storageError) {
    console.warn('Could not save your theme for next time:', storageError.message)
  }
}

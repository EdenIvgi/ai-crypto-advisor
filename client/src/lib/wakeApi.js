import { requestApi } from './apiClient.js'

/**
 * Pokes the API as soon as the page loads, and ignores the answer.
 *
 * The API is on a free Render instance, which is stopped after fifteen minutes of quiet and
 * takes the better part of a minute to come back. Without this, the first thing anyone does
 * — press "Look around with a demo account" — is what starts that minute, and the app looks
 * broken while it passes. Sending this at load spends the wait on the seconds somebody is
 * reading the sign-in page instead.
 *
 * Deliberately not a query: nothing renders from it, nothing retries it, and a failure is
 * not worth reporting, because every request that matters reports its own.
 */
export const wakeApi = () => {
  requestApi('/api/health').catch(() => {})
}

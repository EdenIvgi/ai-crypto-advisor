import { requestApi } from '@/lib/apiClient.js'

export const fetchQuizOptions = () => requestApi('/api/preferences/options')

export const putPreferences = (preferences) =>
  requestApi('/api/preferences', { method: 'PUT', body: preferences })

export const searchAssets = (query) =>
  requestApi(`/api/assets/search?query=${encodeURIComponent(query)}`)

import { requestApi } from '@/lib/apiClient.js'

export const fetchQuizOptions = () => requestApi('/api/preferences/options')

export const putPreferences = (preferences) =>
  requestApi('/api/preferences', { method: 'PUT', body: preferences })

import { requestApi } from './apiClient.js'

export const wakeApi = () => {
  requestApi('/api/health').catch(() => {})
}

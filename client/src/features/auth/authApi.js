import { requestApi } from '@/lib/apiClient.js'

export const fetchCurrentUser = () => requestApi('/api/auth/me')

export const postRegistration = ({ email, name, password }) =>
  requestApi('/api/auth/register', { method: 'POST', body: { email, name, password } })

export const postLogin = ({ email, password }) =>
  requestApi('/api/auth/login', { method: 'POST', body: { email, password } })

export const postDemoLogin = () => requestApi('/api/auth/demo', { method: 'POST' })

export const postLogout = () => requestApi('/api/auth/logout', { method: 'POST' })

import { requestApi } from '@/lib/apiClient.js'

/**
 * Every auth call the client can make. Components reach these through the hooks in
 * useAuth.js rather than calling them directly.
 *
 * None of these handle the token: it travels as an httpOnly cookie the browser attaches on
 * its own, which is why there is nothing here that reads or stores one.
 */

export const fetchCurrentUser = () => requestApi('/api/auth/me')

export const postRegistration = ({ email, name, password }) =>
  requestApi('/api/auth/register', { method: 'POST', body: { email, name, password } })

export const postLogin = ({ email, password }) =>
  requestApi('/api/auth/login', { method: 'POST', body: { email, password } })

export const postDemoLogin = () => requestApi('/api/auth/demo', { method: 'POST' })

export const postLogout = () => requestApi('/api/auth/logout', { method: 'POST' })

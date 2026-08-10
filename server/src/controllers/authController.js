import {
  registerUser,
  authenticateUser,
  loadUserById,
  issueAccessToken,
  setAuthCookie,
  clearAuthCookie,
} from '../services/authService.js'

/**
 * Signing in and signing up are the same thing from here on: create or verify the account,
 * then hand out a cookie. Keeping that in one helper is why a newly registered user is
 * logged in immediately, with no second round trip.
 */
const respondWithSession = (response, user, statusCode = 200) => {
  setAuthCookie(response, issueAccessToken(user.id))
  response.status(statusCode).json({ user })
}

export const register = async (request, response) => {
  const user = await registerUser(request.body)
  respondWithSession(response, user, 201)
}

export const logIn = async (request, response) => {
  const user = await authenticateUser(request.body)
  respondWithSession(response, user)
}

export const logOut = (_request, response) => {
  clearAuthCookie(response)
  response.status(204).end()
}

export const getCurrentUser = async (request, response) => {
  const user = await loadUserById(request.userId)
  response.json({ user })
}

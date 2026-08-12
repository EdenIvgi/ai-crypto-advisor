import {
  registerUser,
  authenticateUser,
  logInAsDemoUser,
  loadUserById,
  issueAccessToken,
  setAuthCookie,
  clearAuthCookie,
} from '../services/authService.js'

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

export const logInAsDemo = async (_request, response) => {
  const user = await logInAsDemoUser()
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

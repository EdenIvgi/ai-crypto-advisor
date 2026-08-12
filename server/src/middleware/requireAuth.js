import { readAuthCookie, verifyAccessToken } from '../services/authService.js'
import { UnauthorizedError } from '../lib/httpErrors.js'

export const requireAuth = (request, _response, next) => {
  const token = readAuthCookie(request)

  if (!token) {
    return next(new UnauthorizedError('You need to sign in to do that'))
  }

  try {
    request.userId = verifyAccessToken(token).userId
    next()
  } catch (verificationError) {
    next(verificationError)
  }
}

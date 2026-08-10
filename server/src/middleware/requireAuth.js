import { readAuthCookie, verifyAccessToken } from '../services/authService.js'
import { UnauthorizedError } from '../lib/httpErrors.js'

/**
 * The only middleware that knows where the token lives. Controllers downstream read
 * `request.userId` and never touch cookies or JWTs, so moving the token to a header later
 * would be a change to this file alone.
 *
 * @type {import('express').RequestHandler}
 */
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

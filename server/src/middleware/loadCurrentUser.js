import { User } from '../models/User.js'
import { UnauthorizedError } from '../lib/httpErrors.js'

/**
 * Puts the signed-in user's document on `request.currentUser`, for routes that need more
 * than the id `requireAuth` provides. Runs after it, never instead of it.
 *
 * The dashboard endpoints all need the same preferences, so loading them once here keeps
 * four controllers from each issuing the same query.
 *
 * A valid token for a deleted account is treated as not signed in rather than as a missing
 * resource: the token is the thing that is no longer good, and a 401 is what makes the
 * client clear the session instead of showing an error page.
 *
 * @type {import('express').RequestHandler}
 */
export const loadCurrentUser = async (request, _response, next) => {
  const user = await User.findById(request.userId)

  if (!user) return next(new UnauthorizedError('That account no longer exists'))

  request.currentUser = user
  next()
}

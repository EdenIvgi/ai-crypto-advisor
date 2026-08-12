import { User } from '../models/User.js'
import { UnauthorizedError } from '../lib/httpErrors.js'

export const loadCurrentUser = async (request, _response, next) => {
  const user = await User.findById(request.userId)

  if (!user) return next(new UnauthorizedError('That account no longer exists'))

  request.currentUser = user
  next()
}

import { NotFoundError } from '../lib/httpErrors.js'

/**
 * Registered after every route, so anything that falls through gets the same JSON error
 * shape as a deliberate failure rather than Express's default HTML page.
 */
export const notFoundHandler = (request, _response, next) => {
  next(new NotFoundError(`No route matches ${request.method} ${request.originalUrl}`))
}

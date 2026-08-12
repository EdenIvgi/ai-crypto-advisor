import { NotFoundError } from '../lib/httpErrors.js'

export const notFoundHandler = (request, _response, next) => {
  next(new NotFoundError(`No route matches ${request.method} ${request.originalUrl}`))
}

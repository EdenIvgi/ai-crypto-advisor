/**
 * Errors that a service or controller can throw to produce a specific HTTP response.
 * `errorHandler` is the only place that turns these into a response — nothing else in the
 * codebase should be building an error body by hand.
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Safe to show the user; never include internals or secrets.
   * @param {number} statusCode
   * @param {string} code - Stable machine-readable code the client can branch on.
   */
  constructor(message, statusCode, code) {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
    this.code = code
  }
}

export class BadRequestError extends ApiError {
  /**
   * @param {string} message
   * @param {unknown} [fieldErrors] - Per-field validation detail, when there is any.
   */
  constructor(message = 'The request was not valid', fieldErrors) {
    super(message, 400, 'BAD_REQUEST')
    this.fieldErrors = fieldErrors
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'You need to sign in to do that') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'You are not allowed to do that') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'That resource does not exist') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'That conflicts with something that already exists') {
    super(message, 409, 'CONFLICT')
  }
}

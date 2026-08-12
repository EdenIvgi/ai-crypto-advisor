export class ApiError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
    this.code = code
  }
}

export class BadRequestError extends ApiError {
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
  constructor(
    message = 'That conflicts with something that already exists',
    code = 'CONFLICT'
  ) {
    super(message, 409, code)
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message = 'That part of the app is unavailable right now') {
    super(message, 503, 'SERVICE_UNAVAILABLE')
  }
}

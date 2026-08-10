import { ApiError } from '../lib/httpErrors.js'
import { isTest } from '../config/env.js'

/**
 * The single place an error becomes a response. Express identifies an error handler by its
 * arity, so this must keep all four parameters.
 *
 * Known `ApiError`s carry a status and a message meant for the user. Anything else is a bug,
 * so it is logged in full on the server and reported to the client as a generic 500: an
 * unexpected error message can leak file paths, query fragments, or credentials.
 */
export const errorHandler = (error, request, response, next) => {
  if (response.headersSent) return next(error)

  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      },
    })
  }

  if (!isTest) {
    console.error(`Unhandled error on ${request.method} ${request.originalUrl}:`, error)
  }

  return response.status(500).json({
    error: {
      message: 'Something went wrong on our end',
      code: 'INTERNAL_ERROR',
    },
  })
}

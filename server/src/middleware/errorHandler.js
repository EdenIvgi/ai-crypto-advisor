import { ApiError } from '../lib/httpErrors.js'
import { isTest } from '../config/env.js'

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

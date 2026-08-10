import { isTest } from '../config/env.js'

/**
 * One line per finished request: method, path, status, duration. Logging on `finish`
 * rather than on the way in means the status code and timing are already known.
 */
export const requestLogger = (request, response, next) => {
  if (isTest) return next()

  const startedAtMs = performance.now()

  response.on('finish', () => {
    const durationMs = Math.round(performance.now() - startedAtMs)
    console.log(
      `${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms`
    )
  })

  next()
}

import { isTest } from '../config/env.js'

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

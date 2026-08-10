import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { env } from './config/env.js'
import { requestLogger } from './middleware/requestLogger.js'
import { notFoundHandler } from './middleware/notFoundHandler.js'
import { errorHandler } from './middleware/errorHandler.js'
import { healthRoutes } from './routes/healthRoutes.js'
import { authRoutes } from './routes/authRoutes.js'
import { preferencesRoutes } from './routes/preferencesRoutes.js'
import { dashboardRoutes } from './routes/dashboardRoutes.js'
import { feedbackRoutes } from './routes/feedbackRoutes.js'

/**
 * Builds the Express app without starting a server, so tests can drive it in-process
 * through Supertest. `index.js` is what actually listens.
 *
 * Middleware order matters and is deliberate: security headers, then the cross-origin
 * policy, then body and cookie parsing so handlers see parsed input, then logging, then
 * routes, and finally the two terminal handlers.
 */
export const createApp = () => {
  const app = express()

  // Render terminates TLS at its proxy. Without this, Express sees the request as
  // insecure and refuses to set the `Secure` auth cookie in production.
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  app.use(requestLogger)

  app.use('/api', healthRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/preferences', preferencesRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/feedback', feedbackRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

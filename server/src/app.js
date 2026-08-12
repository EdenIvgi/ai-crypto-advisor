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
import { assetsRoutes } from './routes/assetsRoutes.js'
import { dashboardRoutes } from './routes/dashboardRoutes.js'
import { feedbackRoutes } from './routes/feedbackRoutes.js'

export const createApp = () => {
  const app = express()
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  app.use(requestLogger)

  app.use('/api', healthRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/preferences', preferencesRoutes)
  app.use('/api/assets', assetsRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/feedback', feedbackRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

import { Router } from 'express'

export const healthRoutes = Router()

/**
 * Cheap liveness check. Render pings it to keep the free instance warm, and the client
 * calls it on load so a cold start finishes before the user submits anything.
 */
healthRoutes.get('/health', (_request, response) => {
  response.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) })
})

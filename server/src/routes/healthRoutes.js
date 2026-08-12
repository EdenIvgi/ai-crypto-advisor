import { Router } from 'express'

export const healthRoutes = Router()

healthRoutes.get('/health', (_request, response) => {
  response.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) })
})

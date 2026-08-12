import { Router } from 'express'
import { z } from 'zod'

import {
  register,
  logIn,
  logInAsDemo,
  logOut,
  getCurrentUser,
} from '../controllers/authController.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { authRateLimiter } from '../middleware/authRateLimiter.js'

const MINIMUM_PASSWORD_LENGTH = 8

const emailField = z.email('Enter a valid email address')

const passwordField = z
  .string()
  .min(MINIMUM_PASSWORD_LENGTH, `Use at least ${MINIMUM_PASSWORD_LENGTH} characters`)

const registerBodySchema = z.object({
  email: emailField,
  name: z.string().trim().min(1, 'Tell us your name').max(80, 'That name is too long'),
  password: passwordField,
})

// Deliberately looser than registration: an existing account may predate a rule change, and
// a length complaint on the login form would tell an attacker their guess was too short.
const loginBodySchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Enter your password'),
})

export const authRoutes = Router()

authRoutes.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerBodySchema }),
  register
)

authRoutes.post('/login', authRateLimiter, validateRequest({ body: loginBodySchema }), logIn)

authRoutes.post('/demo', authRateLimiter, logInAsDemo)

authRoutes.post('/logout', logOut)

authRoutes.get('/me', requireAuth, getCurrentUser)

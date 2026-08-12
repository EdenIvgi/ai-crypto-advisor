import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'

import { User } from '../models/User.js'
import { DEMO_ACCOUNT } from '../data/demoAccount.js'
import { env, isProduction, isTest } from '../config/env.js'
import { ConflictError, UnauthorizedError } from '../lib/httpErrors.js'

const PASSWORD_HASH_ROUNDS = 10
const TOKEN_LIFETIME = '7d'
const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000
const AUTH_COOKIE_NAME = 'token'

const signingSecret = env.JWT_SECRET ?? randomBytes(32).toString('hex')

if (!env.JWT_SECRET && !isProduction && !isTest) {
  console.warn(
    'JWT_SECRET is not set, so this process generated a random one. ' +
      'Sessions will not survive a restart. Set JWT_SECRET in server/.env to keep them.'
  )
}

export const toUserDto = (userDocument) => ({
  id: userDocument._id.toString(),
  email: userDocument.email,
  name: userDocument.name,
  hasCompletedOnboarding: Boolean(userDocument.preferences),
  preferences: userDocument.preferences ?? null,
})

export const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, PASSWORD_HASH_ROUNDS)

export const verifyPassword = (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash)

export const issueAccessToken = (userId) =>
  jwt.sign({ userId }, signingSecret, { expiresIn: TOKEN_LIFETIME })

export const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, signingSecret)
    return { userId: payload.userId }
  } catch {
    throw new UnauthorizedError('Your session is not valid. Please sign in again.')
  }
}

const buildAuthCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
})

export const setAuthCookie = (response, token) => {
  response.cookie(AUTH_COOKIE_NAME, token, {
    ...buildAuthCookieOptions(),
    maxAge: TOKEN_LIFETIME_MS,
  })
}

export const clearAuthCookie = (response) => {
  response.clearCookie(AUTH_COOKIE_NAME, buildAuthCookieOptions())
}

export const readAuthCookie = (request) => request.cookies?.[AUTH_COOKIE_NAME]

export const registerUser = async ({ email, name, password }) => {
  const normalizedEmail = email.toLowerCase().trim()

  if (await User.exists({ email: normalizedEmail })) {
    throw new ConflictError('That email is already registered')
  }

  const createdUser = await User.create({
    email: normalizedEmail,
    name: name.trim(),
    passwordHash: await hashPassword(password),
  })

  return toUserDto(createdUser)
}

export const authenticateUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash')

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new UnauthorizedError('That email and password do not match an account')
  }

  return toUserDto(user)
}

export const logInAsDemoUser = async () => {
  const existingDemoUser = await User.findOne({ email: DEMO_ACCOUNT.email })
  if (existingDemoUser) return toUserDto(existingDemoUser)

  const createdDemoUser = await User.create({
    email: DEMO_ACCOUNT.email,
    name: DEMO_ACCOUNT.name,
    passwordHash: await hashPassword(randomBytes(32).toString('hex')),
    preferences: DEMO_ACCOUNT.preferences,
  })

  return toUserDto(createdDemoUser)
}

export const loadUserById = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new UnauthorizedError('Your account is no longer available')
  return toUserDto(user)
}

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

/**
 * Development convenience: without this, `npm run dev` from a fresh clone would refuse to
 * start. A hardcoded fallback secret would be worse — this one is random per process, so
 * sessions simply do not survive a restart. Production requires a real secret (config/env.js).
 */
const signingSecret = env.JWT_SECRET ?? randomBytes(32).toString('hex')

if (!env.JWT_SECRET && !isProduction && !isTest) {
  console.warn(
    'JWT_SECRET is not set, so this process generated a random one. ' +
      'Sessions will not survive a restart. Set JWT_SECRET in server/.env to keep them.'
  )
}

/**
 * The public shape of a user. Nothing else in the codebase should build a user response,
 * so `passwordHash` can never leak by omission.
 *
 * @param {import('mongoose').Document} userDocument
 * @returns {{ id: string, email: string, name: string, hasCompletedOnboarding: boolean, preferences: object | null }}
 */
export const toUserDto = (userDocument) => ({
  id: userDocument._id.toString(),
  email: userDocument.email,
  name: userDocument.name,
  hasCompletedOnboarding: Boolean(userDocument.preferences),
  preferences: userDocument.preferences ?? null,
})

/** @param {string} plainPassword @returns {Promise<string>} */
export const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, PASSWORD_HASH_ROUNDS)

/** @param {string} plainPassword @param {string} passwordHash @returns {Promise<boolean>} */
export const verifyPassword = (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash)

/**
 * The payload carries only the user id. Everything else is loaded fresh from the database on
 * each request, so a token issued a week ago can never carry a stale name or stale preferences.
 *
 * @param {string} userId
 * @returns {string}
 */
export const issueAccessToken = (userId) =>
  jwt.sign({ userId }, signingSecret, { expiresIn: TOKEN_LIFETIME })

/**
 * @param {string} token
 * @returns {{ userId: string }}
 * @throws {UnauthorizedError} when the token is missing, malformed, tampered with, or expired.
 */
export const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, signingSecret)
    return { userId: payload.userId }
  } catch {
    throw new UnauthorizedError('Your session is not valid. Please sign in again.')
  }
}

/**
 * Every cookie option lives here so register, login, demo login, and logout cannot drift
 * apart. `sameSite: 'none'` with `secure` is what allows the cookie to travel from the
 * Vercel frontend to the Render API in production; `lax` keeps it working over plain http
 * in local development.
 */
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

/**
 * @param {{ email: string, name: string, password: string }} registration
 * @returns {Promise<ReturnType<typeof toUserDto>>}
 * @throws {ConflictError} when the email is already registered.
 */
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

/**
 * A wrong email and a wrong password produce the same error on purpose: distinguishing them
 * would tell an attacker which addresses have accounts.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<ReturnType<typeof toUserDto>>}
 * @throws {UnauthorizedError}
 */
export const authenticateUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash')

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new UnauthorizedError('That email and password do not match an account')
  }

  return toUserDto(user)
}

/**
 * Signs the visitor in as the shared demo account, creating it on first use so a fresh
 * deployment needs no seeding step. The session it hands out is an ordinary one — same
 * token, same cookie — so the demo path exercises the real auth code rather than a
 * shortcut around it.
 *
 * @returns {Promise<ReturnType<typeof toUserDto>>}
 */
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

/**
 * @param {string} userId
 * @returns {Promise<ReturnType<typeof toUserDto>>}
 * @throws {UnauthorizedError} when the token names a user that no longer exists.
 */
export const loadUserById = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new UnauthorizedError('Your account is no longer available')
  return toUserDto(user)
}

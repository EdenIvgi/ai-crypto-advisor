import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'

import { createApp } from '../app.js'
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from './testDatabase.js'

const app = createApp()

const NEW_ACCOUNT = {
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  password: 'correct-horse-battery',
}

const registerNewAccount = () => request(app).post('/api/auth/register').send(NEW_ACCOUNT)

/**
 * Integration test #1 of the capped suite (see .claude/docs/testing-policy.md). One pass
 * through the auth flow covers the JWT, the cookie, and `requireAuth` together — the three
 * pieces that have to agree for anything else in the app to work.
 */
describe('auth flow', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('registers an account, signs it in, and never returns the password hash', async () => {
    const registerResponse = await registerNewAccount()

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.body.user).toMatchObject({
      email: NEW_ACCOUNT.email,
      name: NEW_ACCOUNT.name,
      hasCompletedOnboarding: false,
    })
    expect(JSON.stringify(registerResponse.body)).not.toContain('passwordHash')
  })

  it('sets an httpOnly cookie that authenticates the next request', async () => {
    const registerResponse = await registerNewAccount()
    const authCookie = registerResponse.headers['set-cookie']

    expect(authCookie.join()).toContain('HttpOnly')

    const meResponse = await request(app).get('/api/auth/me').set('Cookie', authCookie)

    expect(meResponse.status).toBe(200)
    expect(meResponse.body.user.email).toBe(NEW_ACCOUNT.email)
  })

  it('rejects a request with no cookie', async () => {
    const meResponse = await request(app).get('/api/auth/me')

    expect(meResponse.status).toBe(401)
    expect(meResponse.body.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects a tampered token', async () => {
    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['token=not-a-real-jwt'])

    expect(meResponse.status).toBe(401)
  })

  it('refuses a second account with the same email', async () => {
    await registerNewAccount()
    const duplicateResponse = await registerNewAccount()

    expect(duplicateResponse.status).toBe(409)
    expect(duplicateResponse.body.error.code).toBe('CONFLICT')
  })

  it('gives the same answer for a wrong password and an unknown email', async () => {
    await registerNewAccount()

    const wrongPasswordResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: NEW_ACCOUNT.email, password: 'not-the-password' })

    const unknownEmailResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: NEW_ACCOUNT.password })

    expect(wrongPasswordResponse.status).toBe(401)
    expect(unknownEmailResponse.status).toBe(401)
    expect(wrongPasswordResponse.body.error.message).toBe(
      unknownEmailResponse.body.error.message
    )
  })

  it('reports which field was invalid on a bad registration', async () => {
    const invalidResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', name: '', password: 'short' })

    expect(invalidResponse.status).toBe(400)
    expect(invalidResponse.body.error.code).toBe('BAD_REQUEST')
    expect(Object.keys(invalidResponse.body.error.fieldErrors)).toEqual(
      expect.arrayContaining(['email', 'name', 'password'])
    )
  })

  it('signs out by clearing the cookie', async () => {
    const registerResponse = await registerNewAccount()
    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', registerResponse.headers['set-cookie'])

    expect(logoutResponse.status).toBe(204)
    expect(logoutResponse.headers['set-cookie'].join()).toContain('token=;')
  })
})

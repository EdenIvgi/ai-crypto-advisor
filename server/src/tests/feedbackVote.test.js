import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'

import { createApp } from '../app.js'
import { FeedbackVote } from '../models/FeedbackVote.js'
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from './testDatabase.js'

const app = createApp()

const VOTED_CONTENT = { sectionType: 'ai_insight', contentId: 'insight-2026-08-10' }
const DUPLICATE_KEY_ERROR_CODE = 11000

const signUpAndGetCookie = async (email) => {
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({ email, name: 'Grace Hopper', password: 'correct-horse-battery' })

  return registerResponse.headers['set-cookie']
}

const castVote = (authCookie, vote) =>
  request(app)
    .post('/api/feedback')
    .set('Cookie', authCookie)
    .send({ ...VOTED_CONTENT, vote })

const withdrawVote = (authCookie) =>
  request(app).delete('/api/feedback').query(VOTED_CONTENT).set('Cookie', authCookie)

describe('feedback voting', () => {
  beforeAll(async () => {
    await startTestDatabase()
    // Mongoose builds indexes in the background after connecting. Without waiting, the first
    // write can land before the unique index exists and the duplicate this test is about
    // would slip through — the test would pass for the wrong reason.
    await FeedbackVote.init()
  })
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('records a vote and hands it back', async () => {
    const authCookie = await signUpAndGetCookie('grace@example.com')

    const voteResponse = await castVote(authCookie, 'up')

    expect(voteResponse.status).toBe(201)
    expect(voteResponse.body.vote).toMatchObject({ ...VOTED_CONTENT, vote: 'up' })
  })

  it('updates an existing vote rather than storing a second one', async () => {
    const authCookie = await signUpAndGetCookie('grace@example.com')

    await castVote(authCookie, 'up')
    const changedMindResponse = await castVote(authCookie, 'down')

    expect(changedMindResponse.status).toBe(201)

    const storedVotes = await FeedbackVote.find({})
    expect(storedVotes).toHaveLength(1)
    expect(storedVotes[0].vote).toBe('down')
  })

  it('removes the vote when it is withdrawn, and stays removed', async () => {
    const authCookie = await signUpAndGetCookie('grace@example.com')
    await castVote(authCookie, 'up')

    const withdrawalResponse = await withdrawVote(authCookie)

    expect(withdrawalResponse.status).toBe(204)
    expect(await FeedbackVote.countDocuments({})).toBe(0)

    const myVotesResponse = await request(app)
      .get('/api/feedback/mine')
      .set('Cookie', authCookie)

    expect(myVotesResponse.body.votes).toEqual([])

    // Withdrawing an opinion nobody holds is not an error. A second click, or a retry after a
    // dropped response, has to leave the same state rather than reporting a failure.
    expect((await withdrawVote(authCookie)).status).toBe(204)
  })

  it('lets the database refuse a duplicate, not just the upsert', async () => {
    const authCookie = await signUpAndGetCookie('grace@example.com')
    await castVote(authCookie, 'up')
    const { userId } = await FeedbackVote.findOne({})

    // Written straight to the model, going around the upsert. The test above passes on
    // upsert semantics alone and stays green with the unique index removed, so on its own it
    // proves nothing about the constraint. This is the assertion that fails without it.
    const duplicate = FeedbackVote.create({
      userId,
      ...VOTED_CONTENT,
      vote: 'down',
      votedOnDate: '2026-08-10',
    })

    await expect(duplicate).rejects.toMatchObject({ code: DUPLICATE_KEY_ERROR_CODE })
    expect(await FeedbackVote.countDocuments({})).toBe(1)
  })

  it('survives two votes racing each other', async () => {
    const authCookie = await signUpAndGetCookie('grace@example.com')

    const [firstResponse, secondResponse] = await Promise.all([
      castVote(authCookie, 'up'),
      castVote(authCookie, 'down'),
    ])

    expect(firstResponse.status).toBe(201)
    expect(secondResponse.status).toBe(201)
    expect(await FeedbackVote.countDocuments({})).toBe(1)
  })

  it('returns the changed vote from the votes endpoint after a reload', async () => {
    const authCookie = await signUpAndGetCookie('grace@example.com')

    await castVote(authCookie, 'up')
    await castVote(authCookie, 'down')

    const myVotesResponse = await request(app)
      .get('/api/feedback/mine')
      .set('Cookie', authCookie)

    expect(myVotesResponse.status).toBe(200)
    expect(myVotesResponse.body.votes).toEqual([
      expect.objectContaining({ ...VOTED_CONTENT, vote: 'down' }),
    ])
  })

  it('keeps two people opinions on the same content apart', async () => {
    const graceCookie = await signUpAndGetCookie('grace@example.com')
    const adaCookie = await signUpAndGetCookie('ada@example.com')

    await castVote(graceCookie, 'up')
    await castVote(adaCookie, 'down')

    expect(await FeedbackVote.countDocuments({})).toBe(2)

    const graceVotesResponse = await request(app)
      .get('/api/feedback/mine')
      .set('Cookie', graceCookie)

    expect(graceVotesResponse.body.votes).toEqual([expect.objectContaining({ vote: 'up' })])
  })

  it('refuses a vote from someone who is not signed in', async () => {
    const anonymousResponse = await request(app)
      .post('/api/feedback')
      .send({ ...VOTED_CONTENT, vote: 'up' })

    expect(anonymousResponse.status).toBe(401)
    expect(await FeedbackVote.countDocuments({})).toBe(0)
  })

  it('refuses a vote that is neither up nor down', async () => {
    const authCookie = await signUpAndGetCookie('grace@example.com')

    const nonsenseResponse = await castVote(authCookie, 'sideways')

    expect(nonsenseResponse.status).toBe(400)
    expect(nonsenseResponse.body.error.fieldErrors).toHaveProperty('vote')
  })
})

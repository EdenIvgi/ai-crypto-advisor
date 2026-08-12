import { DailyMeme } from '../models/DailyMeme.js'
import { DAILY_MEMES } from '../data/dailyMemes.js'
import { fetchCryptoMemes } from '../clients/memeApiClient.js'
import { createTtlCache } from '../lib/inMemoryCache.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const DUPLICATE_KEY_ERROR_CODE = 11000
const BATCH_CACHE_TTL_MS = 10 * 60 * 1000

// Holds the batch, never the choice. Which meme a reader gets is settled in the database; this
// only stops ten readers arriving at once from becoming ten requests to the same public API.
const memeBatchCache = createTtlCache({ ttlMs: BATCH_CACHE_TTL_MS })

/**
 * This reader's meme for today. Chosen once and stored, so it holds still until midnight however
 * often the process restarts — the source returns a different batch on every call, and a free
 * instance that sleeps would otherwise hand out a new meme every few minutes.
 *
 * Different readers get different memes. That is the point of the section being personal rather
 * than a front page, and it is why the row is keyed by reader as well as by day.
 *
 * This function never throws. A section of a dashboard is not worth an error page.
 *
 * @param {string} userId
 * @returns {Promise<{ contentId: string, meme: { id: string, title: string, imageUrl: string, sourceUrl: string }, isFallback: boolean }>}
 */
export const loadDailyMeme = async (userId) => {
  const date = getTodayDateKey()

  const storedMeme = await readStoredMeme(userId, date)
  if (storedMeme) return buildResponse(storedMeme, false)

  try {
    const { value: memes } = await memeBatchCache.getOrFetch(date, fetchCryptoMemes)
    const chosen = selectFor(memes, userId, date)

    return buildResponse(await rememberTodaysMeme(userId, date, chosen), false)
  } catch (memeLookupError) {
    console.warn('Falling back to the drawn memes:', memeLookupError.message)

    // Deliberately not stored. Fallback material must not become the day's answer, or an outage
    // at midnight would hold a drawn meme on the page until tomorrow. The rotation below is fixed
    // by reader and date, so it is stable on its own for as long as the outage lasts.
    return buildResponse(selectFor(DAILY_MEMES, userId, date), true)
  }
}

const readStoredMeme = async (userId, memeDate) => {
  try {
    const stored = await DailyMeme.findOne({ userId, memeDate }).lean()
    return stored?.meme ?? null
  } catch (readError) {
    console.warn('Could not read the stored meme:', readError.message)
    return null
  }
}

/**
 * Returns the meme this reader settled on, which is not always the one passed in: two of their
 * tabs racing on a cold start both choose from different batches, the unique index lets one win,
 * and the loser adopts the winner's rather than showing something that will not survive a reload.
 */
const rememberTodaysMeme = async (userId, memeDate, meme) => {
  try {
    await DailyMeme.create({ userId, memeDate, meme })
    return meme
  } catch (writeError) {
    if (writeError?.code === DUPLICATE_KEY_ERROR_CODE) {
      return (await readStoredMeme(userId, memeDate)) ?? meme
    }

    console.warn('Chose a meme but could not store it:', writeError.message)
    return meme
  }
}

// The reader is mixed into the index so that two people on the same day land on different memes,
// and the day is mixed in so that one person's meme moves on tomorrow.
const selectFor = (memes, userId, dateKey) => {
  const dayNumber = Math.floor(Date.parse(dateKey) / MILLISECONDS_PER_DAY)

  return memes[(dayNumber + hashToNumber(String(userId))) % memes.length]
}

const hashToNumber = (value) => {
  let hash = 0

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1_000_003
  }

  return hash
}

const buildResponse = (meme, isFallback) => ({ contentId: meme.id, meme, isFallback })

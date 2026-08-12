import { DAILY_MEMES } from '../data/dailyMemes.js'
import { fetchCryptoMemes } from '../clients/memeApiClient.js'
import { createTtlCache } from '../lib/inMemoryCache.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const MEME_CACHE_TTL_MS = MILLISECONDS_PER_DAY

const cryptoMemeCache = createTtlCache({ ttlMs: MEME_CACHE_TTL_MS })

export const loadDailyMeme = async () => {
  const dateKey = getTodayDateKey()

  try {
    const { value: memes } = await cryptoMemeCache.getOrFetch(dateKey, fetchCryptoMemes)

    return buildResponse(selectForDate(memes, dateKey), false)
  } catch (memeLookupError) {
    console.warn('Falling back to the drawn memes:', memeLookupError.message)
    return buildResponse(selectForDate(DAILY_MEMES, dateKey), true)
  }
}

// Chosen by the day rather than at random, and the batch is held for the day, so the same
// reader sees the same meme all day and the thumb they pressed stays attached to it — the vote
// names a meme, not a date.
const selectForDate = (memes, dateKey) => {
  const dayNumber = Math.floor(Date.parse(dateKey) / MILLISECONDS_PER_DAY)

  return memes[dayNumber % memes.length]
}

const buildResponse = (meme, isFallback) => ({ contentId: meme.id, meme, isFallback })

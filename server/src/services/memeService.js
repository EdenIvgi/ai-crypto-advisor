import { DAILY_MEMES } from '../data/dailyMemes.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export const loadDailyMeme = async () => {
  const meme = selectMemeForDate(getTodayDateKey())

  return { contentId: meme.id, meme, isFallback: false }
}

const selectMemeForDate = (dateKey) => {
  const dayNumber = Math.floor(Date.parse(dateKey) / MILLISECONDS_PER_DAY)

  return DAILY_MEMES[dayNumber % DAILY_MEMES.length]
}

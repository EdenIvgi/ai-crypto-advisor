import { DAILY_MEMES } from '../data/dailyMemes.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export const loadDailyMeme = async () => {
  const meme = selectMemeForDate(getTodayDateKey())

  // The meme's own id, not the date: this section shows one item, so a vote is about that
  // meme. When it comes round again the reader's thumb is still on it, which is right — they
  // already said what they thought of this one.
  return { contentId: meme.id, meme, isFallback: false }
}

const selectMemeForDate = (dateKey) => {
  const dayNumber = Math.floor(Date.parse(dateKey) / MILLISECONDS_PER_DAY)

  return DAILY_MEMES[dayNumber % DAILY_MEMES.length]
}

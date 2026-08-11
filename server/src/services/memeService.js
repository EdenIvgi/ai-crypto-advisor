import { DAILY_MEMES } from '../data/dailyMemes.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * The meme of the day: the same one for everybody, a different one tomorrow.
 *
 * The only section with no third party behind it, which is why it is also the only one whose
 * `isFallback` is a constant. It is `false` because these memes are the source rather than a
 * stand-in for one — a badge saying "sample" would be describing the fallback that this
 * section does not have. The field stays so every dashboard response has the same envelope.
 *
 * @returns {Promise<{ contentId: string, meme: { id: string, title: string, imageUrl: string, sourceUrl: string }, isFallback: boolean }>}
 */
export const loadDailyMeme = async () => {
  const meme = selectMemeForDate(getTodayDateKey())

  // The meme's own id, not the date: this section shows one item, so a vote is about that
  // meme. When it comes round again the reader's thumb is still on it, which is right — they
  // already said what they thought of this one.
  return { contentId: meme.id, meme, isFallback: false }
}

/**
 * Whole days since the epoch, rather than the day of the year. Day-of-year restarts at 1 while
 * the list is part-way through, so on 1 January the rotation would jump backwards and repeat a
 * meme for no reason a reader could see.
 */
const selectMemeForDate = (dateKey) => {
  const dayNumber = Math.floor(Date.parse(dateKey) / MILLISECONDS_PER_DAY)

  return DAILY_MEMES[dayNumber % DAILY_MEMES.length]
}

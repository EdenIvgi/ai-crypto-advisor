import { MOCK_MEME } from '../data/mockDashboard.js'

/**
 * The meme of the day.
 *
 * M10 replaces the body with a Reddit call and a static list to rotate through when Reddit
 * refuses — which it often does from cloud IP ranges, so the fallback path is the expected
 * one rather than the exceptional one.
 *
 * @returns {Promise<{ meme: { id: string, title: string, imageUrl: string, sourceUrl: string }, isFallback: boolean }>}
 */
export const loadDailyMeme = async () => ({ meme: MOCK_MEME, isFallback: true })

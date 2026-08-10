/**
 * The day an item of daily content belongs to, as `YYYY-MM-DD`.
 *
 * Deliberately UTC rather than the server's local zone: this key becomes half of the unique
 * index that limits the AI insight to one generation per user per day (M11), and a key that
 * moved with the host's timezone would let a redeploy in another region hand the same user a
 * second "today".
 *
 * @returns {string}
 */
export const getTodayDateKey = () => new Date().toISOString().slice(0, 10)

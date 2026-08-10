const SUB_DOLLAR_DECIMALS = 4
const DOLLAR_DECIMALS = 2
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/**
 * A price with the precision the number actually needs. Crypto spans six figures and
 * fractions of a cent in the same list, so a fixed two decimals would round DOGE to $0.24
 * and ATOM's fourth digit away — the difference people are looking for.
 *
 * @param {number} priceUsd
 * @returns {string}
 */
export const formatPriceUsd = (priceUsd) => {
  const decimals = priceUsd < 1 ? SUB_DOLLAR_DECIMALS : DOLLAR_DECIMALS

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(priceUsd)
}

/**
 * A signed percentage. The sign is always written, including for a gain, so the direction
 * survives for anyone who cannot tell the two market colours apart.
 *
 * @param {number} changePercent
 * @returns {string}
 */
export const formatChangePercent = (changePercent) =>
  `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`

/**
 * How long ago something was published, in the coarsest unit that is still informative.
 *
 * @param {string} isoTimestamp
 * @returns {string}
 */
export const formatTimeSince = (isoTimestamp) => {
  const elapsedMinutes = Math.round((Date.now() - new Date(isoTimestamp).getTime()) / 60_000)

  if (elapsedMinutes < MINUTES_PER_HOUR) {
    return relativeTimeFormatter.format(-elapsedMinutes, 'minute')
  }

  const elapsedHours = Math.round(elapsedMinutes / MINUTES_PER_HOUR)
  if (elapsedHours < HOURS_PER_DAY) return relativeTimeFormatter.format(-elapsedHours, 'hour')

  return relativeTimeFormatter.format(-Math.round(elapsedHours / HOURS_PER_DAY), 'day')
}

/**
 * The date at the top of the briefing, in the reader's own locale and without the year —
 * nobody needs telling what year today is.
 *
 * @returns {string}
 */
export const formatBriefingDate = () =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

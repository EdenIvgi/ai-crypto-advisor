const SUB_DOLLAR_DECIMALS = 4
const DOLLAR_DECIMALS = 2
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24

/**
 * Pinned rather than following the browser, which is the opposite of the usual advice and
 * deliberate: every word in this interface is written in English, and a reader whose browser
 * is set to another language would otherwise get a Hebrew weekday inside an English sentence,
 * a right-to-left date in a left-to-right label, and `118,432.50$` instead of `$118,432.50`.
 * A half-translated interface is worse than an untranslated one. This is the line to change
 * first if the product is ever actually localised.
 */
const INTERFACE_LOCALE = 'en-US'

const relativeTimeFormatter = new Intl.RelativeTimeFormat(INTERFACE_LOCALE, { numeric: 'auto' })

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

  return new Intl.NumberFormat(INTERFACE_LOCALE, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(priceUsd)
}

/**
 * A signed percentage, to one decimal place. The sign is always written, including for a gain,
 * so the direction survives for anyone who cannot tell the two market colours apart.
 *
 * The value behind this now arrives at full precision — `-1.1862608339690541` — so one decimal
 * is a reading decision rather than a limit: it is how CoinGecko presents the same figure, and
 * the second decimal of a 24-hour change is noise nobody acts on. The rounding is ours and
 * happens once, here, which is the difference from the earlier version of this file: that one
 * rounded a figure that had *already* been rounded upstream.
 *
 * @param {number} changePercent
 * @returns {string}
 */
export const formatChangePercent = (changePercent) => {
  // CoinGecko has no 24-hour figure for a coin it has not tracked for a full day, and any coin
  // it lists can now be followed.
  if (changePercent === null || changePercent === undefined) return '—'

  return `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`
}

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
 * The date at the top of the briefing, without the year — nobody needs telling what year
 * today is.
 *
 * @returns {string}
 */
export const formatBriefingDate = () =>
  new Intl.DateTimeFormat(INTERFACE_LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

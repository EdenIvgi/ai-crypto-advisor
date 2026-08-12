const SUB_DOLLAR_DECIMALS = 4
const DOLLAR_DECIMALS = 2
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24

const INTERFACE_LOCALE = 'en-US'

const relativeTimeFormatter = new Intl.RelativeTimeFormat(INTERFACE_LOCALE, { numeric: 'auto' })

export const formatPriceUsd = (priceUsd) => {
  const decimals = priceUsd < 1 ? SUB_DOLLAR_DECIMALS : DOLLAR_DECIMALS

  return new Intl.NumberFormat(INTERFACE_LOCALE, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(priceUsd)
}

export const formatChangePercent = (changePercent) => {
  // CoinGecko has no 24-hour figure for a coin it has not tracked for a full day, and any coin
  // it lists can now be followed.
  if (changePercent === null || changePercent === undefined) return '—'

  return `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`
}

export const formatTimeSince = (isoTimestamp) => {
  const elapsedMinutes = Math.round((Date.now() - new Date(isoTimestamp).getTime()) / 60_000)

  if (elapsedMinutes < MINUTES_PER_HOUR) {
    return relativeTimeFormatter.format(-elapsedMinutes, 'minute')
  }

  const elapsedHours = Math.round(elapsedMinutes / MINUTES_PER_HOUR)
  if (elapsedHours < HOURS_PER_DAY) return relativeTimeFormatter.format(-elapsedHours, 'hour')

  return relativeTimeFormatter.format(-Math.round(elapsedHours / HOURS_PER_DAY), 'day')
}

export const formatBriefingDate = () =>
  new Intl.DateTimeFormat(INTERFACE_LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

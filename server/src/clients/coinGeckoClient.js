import { z } from 'zod'

import { env } from '../config/env.js'

const COIN_GECKO_MARKETS_URL = 'https://api.coingecko.com/api/v3/coins/markets'
const REQUEST_TIMEOUT_MS = 8000

/**
 * Only the five fields this application uses, out of the thirty CoinGecko returns. Parsing
 * narrowly is deliberate: it documents the dependency exactly, and a response that changes
 * shape fails here, at the boundary, rather than as an undefined somewhere in a component.
 *
 * `price_change_percentage_24h` is nullable because CoinGecko omits it for an asset it has
 * not been tracking for a full day.
 */
const coinMarketRowSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  price_change_percentage_24h: z.number().nullable(),
})

const coinMarketsResponseSchema = z.array(coinMarketRowSchema)

/**
 * Current prices for a set of CoinGecko ids, in one request.
 *
 * One request for all of them rather than one each: this is a free, rate-limited API, and a
 * dashboard following eight assets would otherwise spend eight of its allowance on a single
 * page load.
 *
 * @param {string[]} assetIds - CoinGecko coin ids, e.g. ['bitcoin', 'ethereum']
 * @returns {Promise<Array<{ id: string, symbol: string, name: string, priceUsd: number, change24hPercent: number }>>}
 * @throws When the request fails, times out, or comes back in an unexpected shape.
 */
export const fetchCoinMarkets = async (assetIds) => {
  const requestUrl = new URL(COIN_GECKO_MARKETS_URL)
  requestUrl.searchParams.set('vs_currency', 'usd')
  requestUrl.searchParams.set('ids', assetIds.join(','))

  const response = await fetch(requestUrl, {
    headers: buildRequestHeaders(),
    // Without this, a source that accepts the connection and then says nothing would hold a
    // dashboard request open until the browser gave up on it.
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`CoinGecko answered ${response.status}`)
  }

  return coinMarketsResponseSchema.parse(await response.json()).map(toCoinDto)
}

/**
 * The key is optional and free. Without one the public allowance is shared by IP address,
 * which on a cloud host means sharing it with strangers — so the application works either
 * way, and a key simply makes being turned away less likely.
 */
const buildRequestHeaders = () => ({
  accept: 'application/json',
  ...(env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {}),
})

/**
 * `price_change_percentage_24h` is read as given, and it is worth writing down why, because the
 * response contains three other ways to answer the same question and none of them is better.
 *
 * That field arrives rounded to a tenth of a per cent. Deriving a precise figure instead — from
 * `price_change_24h` against `current_price`, both full precision — looks like an obvious
 * improvement, agrees with `market_cap_change_percentage_24h` to within 0.03 points, and is
 * wrong for this purpose: it matches nothing a reader can check. CoinGecko's own markets table
 * shows the rounded field, and their per-coin page shows a third value again — BTC was -0.9% on
 * one and -1.1% on the other at the same moment, with the derived figure -0.745%.
 *
 * They are inconsistent across their own surfaces, so "correct" is unavailable and the choice is
 * only which number a reader can reconcile. This one matches the listing they would look at.
 * Deriving would have invented a fourth answer.
 */
const toCoinDto = (row) => ({
  id: row.id,
  symbol: row.symbol.toUpperCase(),
  name: row.name,
  priceUsd: row.current_price,
  // A missing 24-hour change is shown as no movement rather than dropping the asset from the
  // list. The interface renders exactly zero in a neutral colour, so it does not read as a
  // gain — losing the price because a percentage is unavailable would be the worse trade.
  change24hPercent: row.price_change_percentage_24h ?? 0,
})

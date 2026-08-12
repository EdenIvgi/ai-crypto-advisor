import { z } from 'zod'

import { env } from '../config/env.js'

const COIN_GECKO_SIMPLE_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price'
const COIN_GECKO_SEARCH_URL = 'https://api.coingecko.com/api/v3/search'
const REQUEST_TIMEOUT_MS = 8000
const SEARCH_RESULT_LIMIT = 10

/**
 * `/simple/price`, not `/coins/markets`, and the difference is the whole reason this file was
 * rewritten. Both answer "what is it worth and how far has it moved today"; they do not agree.
 *
 * Sampled at the same moment, for Bitcoin:
 *
 * | endpoint         | 24h change  | its own `last_updated` |
 * | ---------------- | ----------- | ---------------------- |
 * | `/coins/markets` | `-0.9`      | 174s ago               |
 * | `/simple/price`  | `-1.0944`   | 134s ago               |
 * | `/coins/{id}`    | `-1.0944`   | 25s ago                |
 *
 * `/coins/markets` rounds the figure to a tenth of a per cent and is the stalest of the three —
 * twelve assets pulled from it came back as exact multiples of 0.1. The other two carry full
 * precision, and `-1.0944` is what CoinGecko's own per-coin page displays, as `-1.1%`.
 *
 * `/simple/price` over `/coins/{id}` because it prices every asset in one request, where
 * `/coins/{id}` needs one per coin — and this is a free tier that returned 429 after three
 * requests in thirty seconds during testing.
 */
const quoteSchema = z.object({
  usd: z.number(),
  // Absent for an asset CoinGecko has not tracked for a full day.
  usd_24h_change: z.number().nullish(),
})

// Keyed by coin id, and only the ids CoinGecko recognised — a record rather than a fixed shape,
// because the caller decides what to ask for and unknown ids are simply left out.
const simplePriceResponseSchema = z.record(z.string(), quoteSchema)

/**
 * Prices for a set of CoinGecko ids, in one request, **in the order they were asked for**.
 *
 * That ordering is part of the contract rather than an accident: a keyed response has no order
 * of its own, and the list on screen should read the way somebody answered the quiz.
 *
 * One request for all of them rather than one each: this is a free, rate-limited API, and a
 * dashboard following eight assets would otherwise spend eight of its allowance on a page load.
 *
 * @param {string[]} assetIds - CoinGecko coin ids, e.g. ['bitcoin', 'ethereum']
 * @returns {Promise<Array<{ id: string, priceUsd: number, change24hPercent: number }>>}
 * @throws When the request fails, times out, or comes back in an unexpected shape.
 */
export const fetchCoinQuotes = async (assetIds) => {
  const requestUrl = new URL(COIN_GECKO_SIMPLE_PRICE_URL)
  requestUrl.searchParams.set('ids', assetIds.join(','))
  requestUrl.searchParams.set('vs_currencies', 'usd')
  requestUrl.searchParams.set('include_24hr_change', 'true')

  const response = await fetch(requestUrl, {
    headers: buildRequestHeaders(),
    // Without this, a source that accepts the connection and then says nothing would hold a
    // dashboard request open until the browser gave up on it.
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`CoinGecko answered ${response.status}`)
  }

  const quotesById = simplePriceResponseSchema.parse(await response.json())

  return assetIds
    .filter((assetId) => quotesById[assetId] !== undefined)
    .map((assetId) => toQuoteDto(assetId, quotesById[assetId]))
}

const searchResponseSchema = z.object({
  coins: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      symbol: z.string(),
    })
  ),
})

/**
 * Coins matching a search term, most relevant first, as CoinGecko ranks them.
 *
 * @param {string} query
 * @returns {Promise<Array<{ id: string, name: string, symbol: string }>>}
 * @throws When the request fails, times out, or comes back in an unexpected shape.
 */
export const searchCoins = async (query) => {
  const requestUrl = new URL(COIN_GECKO_SEARCH_URL)
  requestUrl.searchParams.set('query', query)

  const response = await fetch(requestUrl, {
    headers: buildRequestHeaders(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`CoinGecko answered ${response.status}`)
  }

  const { coins } = searchResponseSchema.parse(await response.json())

  return coins.slice(0, SEARCH_RESULT_LIMIT).map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
  }))
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

const toQuoteDto = (assetId, quote) => ({
  id: assetId,
  priceUsd: quote.usd,
  // A missing 24-hour change is reported as no movement rather than dropping the asset from the
  // list. The interface renders exactly zero in a neutral colour, so it does not read as a
  // gain — losing the price because a percentage is unavailable would be the worse trade.
  change24hPercent: quote.usd_24h_change ?? 0,
})

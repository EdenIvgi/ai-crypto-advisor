import { z } from 'zod'

import { env } from '../config/env.js'

const COIN_GECKO_SIMPLE_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price'
const COIN_GECKO_SEARCH_URL = 'https://api.coingecko.com/api/v3/search'
const REQUEST_TIMEOUT_MS = 8000
const SEARCH_RESULT_LIMIT = 10

const quoteSchema = z.object({
  usd: z.number(),
  // Absent for an asset CoinGecko has not tracked for a full day.
  usd_24h_change: z.number().nullish(),
})

// Keyed by coin id, and only the ids CoinGecko recognised — a record rather than a fixed shape,
// because the caller decides what to ask for and unknown ids are simply left out.
const simplePriceResponseSchema = z.record(z.string(), quoteSchema)

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

import { z } from 'zod'

import { env } from '../config/env.js'

const CRYPTO_PANIC_POSTS_URL = 'https://cryptopanic.com/api/v1/posts/'
const REQUEST_TIMEOUT_MS = 8000

/**
 * Whether a live call is possible at all. CryptoPanic has no anonymous tier, so without a key
 * there is nothing to try — the news service reads this and serves sample headlines instead
 * of failing a request per reader to discover the same thing.
 */
export const isCryptoPanicConfigured = Boolean(env.CRYPTOPANIC_API_KEY)

/**
 * Four fields out of the twelve a post carries. Parsing narrowly documents the dependency
 * exactly and turns a response that changed shape into an error here, at the boundary,
 * rather than an undefined inside a component.
 *
 * `source` is an object rather than a string: the publisher's display name lives one level
 * down, and the domain beside it is what the interface would show if the name were missing.
 */
const postSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  url: z.string(),
  published_at: z.string(),
  source: z.object({
    title: z.string().nullable(),
    domain: z.string().nullable(),
  }),
})

const postsResponseSchema = z.object({
  results: z.array(postSchema),
})

/**
 * The most recent posts mentioning any of the given assets, newest first.
 *
 * One request covering every asset the reader follows, not one per asset: this is a
 * rate-limited free tier, and a dashboard following eight coins would otherwise spend eight
 * of its daily allowance on one page load.
 *
 * @param {string[]} assetSymbols - Ticker symbols, e.g. ['BTC', 'ETH']
 * @returns {Promise<Array<{ id: string, title: string, url: string, source: string, publishedAt: string }>>}
 * @throws When the key is missing, the request fails or times out, or the response comes back
 *   in an unexpected shape.
 */
export const fetchLatestPosts = async (assetSymbols) => {
  if (!isCryptoPanicConfigured) throw new Error('CRYPTOPANIC_API_KEY is not configured')

  const requestUrl = new URL(CRYPTO_PANIC_POSTS_URL)
  requestUrl.searchParams.set('auth_token', env.CRYPTOPANIC_API_KEY)
  requestUrl.searchParams.set('currencies', assetSymbols.join(','))
  // Posts, not the videos and podcasts CryptoPanic also indexes. The section is a list of
  // headlines, and a row that silently opens a twenty-minute video is not one.
  requestUrl.searchParams.set('kind', 'news')
  requestUrl.searchParams.set('public', 'true')

  const response = await fetch(requestUrl, {
    headers: { accept: 'application/json' },
    // Without this, a source that accepts the connection and then says nothing would hold a
    // dashboard request open until the browser gave up on it.
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`CryptoPanic answered ${response.status}`)
  }

  return postsResponseSchema.parse(await response.json()).results.map(toArticleDto)
}

const toArticleDto = (post) => ({
  id: String(post.id),
  title: post.title,
  url: post.url,
  // The publisher's own name where they have one, otherwise the domain it came from. Never
  // an empty label — the line under a headline is how a reader decides whether to trust it.
  source: post.source.title ?? post.source.domain ?? 'CryptoPanic',
  publishedAt: post.published_at,
})

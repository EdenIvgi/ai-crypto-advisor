import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'

const NEWS_FEEDS = [
  { source: 'CoinDesk', feedUrl: 'https://www.coindesk.com/arc/outboundfeeds/rss' },
  { source: 'Cointelegraph', feedUrl: 'https://cointelegraph.com/rss' },
  { source: 'Decrypt', feedUrl: 'https://decrypt.co/feed' },
  { source: 'The Block', feedUrl: 'https://www.theblock.co/rss.xml' },
]

const REQUEST_TIMEOUT_MS = 8000

// Some publishers answer a bare fetch with a challenge page. Identifying the caller, with a
// link to the project, is what a well-behaved feed reader does and what they let through.
const REQUEST_USER_AGENT =
  'ai-crypto-advisor/1.0 (+https://github.com/EdenIvgi/ai-crypto-advisor)'

const feedItemSchema = z.object({
  title: z.string(),
  link: z.string(),
  pubDate: z.string(),
})

const feedDocumentSchema = z.object({
  rss: z.object({
    channel: z.object({
      // A channel with exactly one item parses as an object rather than an array, so both are
      // accepted here and normalised to a list below.
      item: z.union([feedItemSchema, z.array(feedItemSchema)]),
    }),
  }),
})

// `htmlEntities` is not the default and is not optional here. Headlines are written by
// people, so they are full of curly apostrophes, which publishers send as `&#8217;` — a
// numeric character reference the parser leaves alone unless asked. Without this, "Revolut's"
// reaches the browser as "Revolut&#8217;s".
const feedParser = new XMLParser({ htmlEntities: true })

export const fetchLatestArticles = async () => {
  const feedResults = await Promise.allSettled(NEWS_FEEDS.map(fetchOneFeed))
  const succeeded = feedResults.filter((result) => result.status === 'fulfilled')

  if (succeeded.length === 0) {
    throw new Error(`all ${NEWS_FEEDS.length} news feeds failed`)
  }

  return succeeded
    .flatMap((result) => result.value)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
}

const fetchOneFeed = async ({ source, feedUrl }) => {
  const response = await fetch(feedUrl, {
    headers: {
      accept: 'application/rss+xml, application/xml',
      'user-agent': REQUEST_USER_AGENT,
    },
    // Without this, a publisher that accepts the connection and then says nothing would hold
    // a dashboard request open until the browser gave up on it.
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`${source} answered ${response.status}`)
  }

  const { rss } = feedDocumentSchema.parse(feedParser.parse(await response.text()))
  const items = Array.isArray(rss.channel.item) ? rss.channel.item : [rss.channel.item]

  return items.map((item) => toArticleDto(item, source)).filter((article) => article !== null)
}

const toArticleDto = (item, source) => {
  const publishedAt = new Date(item.pubDate)
  if (Number.isNaN(publishedAt.getTime())) return null

  return {
    // The article's own URL. Stable across refetches, unique across publishers, and already
    // in hand — an RSS `<guid>` is neither reliably present nor reliably a URL.
    id: item.link,
    title: item.title,
    url: item.link,
    source,
    publishedAt: publishedAt.toISOString(),
  }
}

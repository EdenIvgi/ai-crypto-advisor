/**
 * Stand-in content for the dashboard sections that depend on somebody else's server, shaped
 * exactly like the responses those integrations produce. Building the whole dashboard against
 * these first fixed the response contracts and finished the UI while no third party could
 * break either, and each integration since has replaced one source without the client
 * noticing.
 *
 * These are no longer only a starting point. News reaches for them when its source refuses,
 * which on free public APIs is an ordinary Tuesday — so this is what a reader sees on a bad
 * day, and it goes out with `isFallback: true` so the interface says so.
 *
 * Prices have no entry here. An asset can now be any coin CoinGecko knows, so a bundled price
 * could only ever cover the handful this file happened to list, and a card mixing invented
 * figures with blank rows would be worse than one that says plainly it cannot price anything
 * right now.
 */

/**
 * `hoursAgo` rather than a timestamp: the service turns it into `publishedAt` when the
 * request is served, so a headline in the sample feed never claims to be a year old. The
 * links point at the publications' own market sections, so nothing here is a dead end.
 */
export const MOCK_NEWS_ARTICLES = [
  {
    id: 'sample-news-1',
    title: 'Bitcoin holds above $118,000 as spot ETF inflows extend a third week',
    url: 'https://www.coindesk.com/markets',
    source: 'CoinDesk',
    hoursAgo: 2,
  },
  {
    id: 'sample-news-2',
    title: 'Ethereum fee burn hits a monthly low as activity shifts to layer twos',
    url: 'https://www.theblock.co/latest',
    source: 'The Block',
    hoursAgo: 5,
  },
  {
    id: 'sample-news-3',
    title: 'Solana validators approve a fee change aimed at congestion during mints',
    url: 'https://decrypt.co/news',
    source: 'Decrypt',
    hoursAgo: 9,
  },
  {
    id: 'sample-news-4',
    title: 'Stablecoin supply crosses a new high, with most of the growth off-exchange',
    url: 'https://www.theblock.co/data',
    source: 'The Block',
    hoursAgo: 14,
  },
  {
    id: 'sample-news-5',
    title: 'Regulators publish long-awaited guidance on custody for retail platforms',
    url: 'https://www.coindesk.com/policy',
    source: 'CoinDesk',
    hoursAgo: 21,
  },
  {
    id: 'sample-news-6',
    title: 'Dogecoin leads meme-coin volume as a payments integration goes live',
    url: 'https://cointelegraph.com/tags/altcoin',
    source: 'Cointelegraph',
    hoursAgo: 27,
  },
]

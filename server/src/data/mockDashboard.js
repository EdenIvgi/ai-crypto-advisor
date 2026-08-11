/**
 * Stand-in content for the dashboard sections that depend on somebody else's server, shaped
 * exactly like the responses those integrations produce. Building the whole dashboard against
 * these first fixed the response contracts and finished the UI while no third party could
 * break either, and each integration since has replaced one source without the client
 * noticing.
 *
 * These are no longer only a starting point. Prices and news reach for them when their source
 * refuses, which on free public APIs is an ordinary Tuesday — so this is what a reader sees on
 * a bad day, and it goes out with `isFallback: true` so the interface says so.
 *
 * The meme section has no entry here. It has no third party to fall back from; see
 * `data/dailyMemes.js`.
 */

/**
 * Keyed by CoinGecko id so a user's `watchedAssetIds` can be looked up directly. Values are
 * plausible rather than accurate — the point is to exercise the formatting, which is why the
 * list deliberately spans six-figure prices and sub-cent ones, and gains as well as losses.
 */
export const MOCK_COIN_PRICES = {
  bitcoin: { priceUsd: 118432.5, change24hPercent: 1.84 },
  ethereum: { priceUsd: 4287.16, change24hPercent: -0.62 },
  solana: { priceUsd: 214.73, change24hPercent: 3.41 },
  ripple: { priceUsd: 2.87, change24hPercent: 0.95 },
  cardano: { priceUsd: 0.9142, change24hPercent: -1.23 },
  dogecoin: { priceUsd: 0.2418, change24hPercent: 5.07 },
  polkadot: { priceUsd: 6.83, change24hPercent: -2.14 },
  chainlink: { priceUsd: 24.56, change24hPercent: 0.38 },
  'avalanche-2': { priceUsd: 41.29, change24hPercent: -1.77 },
  litecoin: { priceUsd: 132.64, change24hPercent: 2.06 },
  uniswap: { priceUsd: 13.71, change24hPercent: -0.44 },
  cosmos: { priceUsd: 7.92, change24hPercent: 1.19 },
}

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

/**
 * One sample insight per investor type. The three differ in what they pay attention to
 * rather than only in tone, because the whole promise of this section is that the answer to
 * "how do you invest" changes what you are told — a sample that ignored it would make the
 * feature look decorative.
 */
export const MOCK_INSIGHTS_BY_INVESTOR_TYPE = {
  hodler:
    'Nothing in the last day changes a long-term position. Bitcoin is up under two percent ' +
    'and the majors are moving together, which is the market breathing rather than the ' +
    'market deciding something. The one number worth a glance this week is ETF inflow: it ' +
    'has been positive for three weeks, and sustained inflow is the kind of slow signal that ' +
    'actually matters on your horizon.',
  day_trader:
    'Volatility is concentrated in the smaller caps today — Dogecoin is up five percent while ' +
    'Bitcoin barely moved, so the majors are giving you range rather than direction. Solana ' +
    'is the one worth watching: it is up three percent on a validator fee change, and news ' +
    'that alters transaction economics tends to keep moving a chart for more than one session.',
  nft_collector:
    'The Solana fee change approved this week is the item that touches you most directly: it ' +
    'targets congestion during mints, which is exactly where collectors have been paying for ' +
    'failed transactions. Floor prices have not reacted yet. Ethereum activity continuing to ' +
    'move to layer twos is the slower story, and it is where most new collections are landing.',
}

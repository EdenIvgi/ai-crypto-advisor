const REPOSITORY_MEMES_URL =
  'https://github.com/EdenIvgi/ai-crypto-advisor/blob/main/client/public/memes'

/**
 * The memes this dashboard rotates through, one per day.
 *
 * The brief allows "Reddit scraping or static JSON" for this section, and this is the second.
 * Reddit answers a plain request from a server with 403, so the live route would have spent
 * most of its life in a fallback anyway — and hotlinking someone's upload means the section
 * breaks the day that host expires the URL.
 *
 * So these are drawn for this application and served from its own `public/` directory. They
 * cannot break, they need no key, and none of them is anyone else's artwork. `sourceUrl`
 * points at the file in the repository, because that is honestly where it came from.
 *
 * `title` is also the image's alt text, so it has to read as the joke rather than describe
 * the picture — a screen reader given "a line chart trending downwards" gets the setup and
 * none of the punchline.
 */
export const DAILY_MEMES = [
  {
    id: 'buying-the-dip',
    title: 'Buying the dip, day 41',
    imageUrl: '/memes/buying-the-dip.svg',
    sourceUrl: `${REPOSITORY_MEMES_URL}/buying-the-dip.svg`,
  },
  {
    id: 'diversified-portfolio',
    title: 'My portfolio is fully diversified',
    imageUrl: '/memes/diversified-portfolio.svg',
    sourceUrl: `${REPOSITORY_MEMES_URL}/diversified-portfolio.svg`,
  },
  {
    id: 'gas-fees',
    title: 'Sending twelve dollars across the internet',
    imageUrl: '/memes/gas-fees.svg',
    sourceUrl: `${REPOSITORY_MEMES_URL}/gas-fees.svg`,
  },
  {
    id: 'exit-strategy',
    title: 'My exit strategy, in full',
    imageUrl: '/memes/exit-strategy.svg',
    sourceUrl: `${REPOSITORY_MEMES_URL}/exit-strategy.svg`,
  },
  {
    id: 'not-a-loss',
    title: "It isn't a loss until you sell",
    imageUrl: '/memes/not-a-loss.svg',
    sourceUrl: `${REPOSITORY_MEMES_URL}/not-a-loss.svg`,
  },
  {
    id: 'time-in-the-market',
    title: 'Time in the market beats timing the market',
    imageUrl: '/memes/time-in-the-market.svg',
    sourceUrl: `${REPOSITORY_MEMES_URL}/time-in-the-market.svg`,
  },
  {
    id: 'wen-moon',
    title: 'Wen moon',
    imageUrl: '/memes/wen-moon.svg',
    sourceUrl: `${REPOSITORY_MEMES_URL}/wen-moon.svg`,
  },
]

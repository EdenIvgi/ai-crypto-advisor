/**
 * The closed sets of answers the onboarding quiz can produce. The User schema, the
 * validation schemas, and the quiz UI all derive from these, so adding an option here is
 * the only edit needed to introduce one.
 */

export const INVESTOR_TYPES = ['hodler', 'day_trader', 'nft_collector']

/**
 * Named on its own because logic has to single this section out: it is the only one whose content
 * is generated for one reader and stored for the day, so it is the only one a change of answers
 * can leave stale. Used in the list below so the two can never drift apart.
 */
export const AI_INSIGHT_SECTION = 'ai_insight'

export const CONTENT_SECTIONS = ['coin_prices', 'market_news', AI_INSIGHT_SECTION, 'fun_meme']

/** Labels for the quiz and the dashboard. Keys must stay in sync with the arrays above. */
export const INVESTOR_TYPE_LABELS = {
  hodler: 'HODLer',
  day_trader: 'Day Trader',
  nft_collector: 'NFT Collector',
}

export const CONTENT_SECTION_LABELS = {
  coin_prices: 'Coin Prices',
  market_news: 'Market News',
  ai_insight: 'AI Insight of the Day',
  fun_meme: 'Fun Crypto Meme',
}

import { DailyAiInsight } from '../models/DailyAiInsight.js'
import { INVESTOR_TYPE_LABELS } from '../data/preferenceOptions.js'
import {
  generateChatCompletion,
  isHuggingFaceConfigured,
} from '../clients/huggingFaceClient.js'
import { loadCoinPrices } from './pricesService.js'
import { loadMarketNews } from './newsService.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const DUPLICATE_KEY_ERROR_CODE = 11000

const INSIGHT_SYSTEM_PROMPT = [
  'You write the "Insight of the day" paragraph for a crypto dashboard, addressed to one',
  'reader whose assets and investing style you are given.',
  '',
  "This reader can already see their prices and the day's headlines, in their own sections",
  'directly beside your paragraph, and those update through the day while your paragraph is',
  'written once. So your job is neither a price report nor a news summary: it is to say what',
  "today's events mean for somebody who invests the way this reader does.",
  '',
  'Rules:',
  '1. **Never mention a price, a percentage, or any number describing market movement.** Do not',
  '   say an asset rose, fell, gained, dipped, slipped or is flat. You are not being shown',
  '   prices, and anything you claimed about them would be out of date within the hour.',
  '2. Pick ONE thing from the headlines worth understanding and stay on it. Do not list them.',
  '   Say what it is and why it matters to this reader.',
  '3. Never recommend buying, selling or holding. Never predict a price or a direction. Never',
  '   instruct the reader at all — no "keep an eye on", no "watch for", no "consider". You are',
  '   not an adviser. State what is worth understanding and let them draw the conclusion.',
  "4. Tie it to this reader's style, using what they are said to pay attention to. The same day",
  '   should produce genuinely different paragraphs for different styles, not the same paragraph',
  '   with different adjectives.',
  '5. Prefer a headline that touches the assets they follow. If none does, take the most',
  '   consequential one for the market as a whole and say plainly that it is the wider picture.',
  '6. Three sentences. Four at the very most. Plain prose — no lists, no headings, no emoji, and',
  '   no preamble such as "Here is your insight". Return the paragraph itself.',
  '',
  'You have no information beyond the headlines below. Do not state fees, volumes, inflows,',
  'market caps, supply figures or dates that are not there, do not write "according to data",',
  'and do not assert a cause for anything unless a headline says it.',
  '',
  'You also know nothing about this reader beyond the style and the asset list. You do not know',
  'what else they own, which chains anything of theirs sits on, or how long they have held it —',
  'so never write as though you do.',
].join('\n')

const ATTENTION_BY_INVESTOR_TYPE = {
  hodler:
    'cares only about things that change an asset for years rather than for a day — protocol ' +
    'changes, regulation, custody, who is adopting it — and is indifferent to daily movement',
  day_trader:
    'cares about events that put a market in play over the next few sessions — listings, ' +
    'outages, security incidents, launches, anything that changes how people trade an asset',
  nft_collector:
    'cares about the chains collections live on and the places they are traded — network ' +
    'upgrades, marketplaces, and where new activity is going',
}

export const loadDailyInsight = async ({ userId, investorType, watchedAssets }) => {
  const date = getTodayDateKey()

  const storedText = await readStoredInsight(userId, date)
  if (storedText) return buildResponse(userId, date, storedText, false)

  if (isHuggingFaceConfigured) {
    try {
      const news = await loadMarketNews(watchedAssets)
      const insightText = await generateChatCompletion(
        buildInsightMessages(investorType, watchedAssets, news.articles)
      )

      // A paragraph is only as true as the material it was written from, and this is the case
      // that taught it: while CoinGecko was refusing this host, a model was handed the sample
      // prices and wrote "Dogecoin's 5.07% rise outpaces Bitcoin's 1.84% gain, a spread of
      // about 3.23 percentage points" — a computed, confident claim about a day that never
      // happened. Prices are out of the prompt now, so only the feed can taint it, but the rule
      // stands: an insight built on sample material is not cached, because this cache is keyed
      // by the day and would hold the invented story for twenty-four hours.
      if (!news.isFallback) await rememberTodaysInsight(userId, date, insightText)

      return buildResponse(userId, date, insightText, news.isFallback)
    } catch (generationError) {
      console.warn('Composing the insight from prices instead:', generationError.message)
    }
  }

  // Only reached with no key or after every model failed, and it is the one path that needs
  // prices — which is why they are fetched here rather than up front. `loadCoinPrices` is
  // documented never to throw.
  const { coins } = await loadCoinPrices(watchedAssets)

  return buildResponse(userId, date, composeFromPrices(investorType, coins), true)
}

export const forgetTodaysInsight = async (userId) => {
  const date = getTodayDateKey()

  await DailyAiInsight.deleteOne({ userId, insightDate: date })

  return buildInsightId(userId, date)
}

const readStoredInsight = async (userId, insightDate) => {
  try {
    const stored = await DailyAiInsight.findOne({ userId, insightDate }).lean()
    return stored?.insightText ?? null
  } catch (readError) {
    console.warn('Could not read the stored insight:', readError.message)
    return null
  }
}

const rememberTodaysInsight = async (userId, insightDate, insightText) => {
  try {
    await DailyAiInsight.create({ userId, insightDate, insightText })
  } catch (writeError) {
    if (writeError?.code === DUPLICATE_KEY_ERROR_CODE) return
    console.warn('Generated the insight but could not store it:', writeError.message)
  }
}

export const buildInsightMessages = (investorType, watchedAssets, articles) => [
  { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
  { role: 'user', content: buildBriefingMaterial(investorType, watchedAssets, articles) },
]

const buildBriefingMaterial = (investorType, watchedAssets, articles) =>
  [
    `Reader's style: ${INVESTOR_TYPE_LABELS[investorType] ?? 'HODLer'}, who ` +
      `${ATTENTION_BY_INVESTOR_TYPE[investorType] ?? ATTENTION_BY_INVESTOR_TYPE.hodler}.`,
    '',
    `Assets they follow: ${describeWatchedAssets(watchedAssets)}.`,
    '',
    // Exactly the headlines the news section is showing, not a longer list fetched for the
    // model's benefit. So the reader can always see the material the paragraph was written
    // from, sitting in the card beside it — an insight whose source is on the same screen is
    // one they can check.
    "Today's headlines, some of which may be irrelevant to the assets above:",
    ...articles.map((article) => `- ${article.title}`),
  ].join('\n')

const describeWatchedAssets = (watchedAssets) => {
  const names = watchedAssets.map((asset) => `${asset.name} (${asset.symbol})`)

  return names.length > 0 ? names.join(', ') : 'none in particular'
}

const composeFromPrices = (investorType, allCoins) => {
  // An asset CoinGecko could not price carries no figure, and a sentence about the strongest
  // and weakest of them has to be built from the ones that do.
  const coins = allCoins.filter((coin) => typeof coin.change24hPercent === 'number')

  if (coins.length === 0) {
    return 'Prices for the assets you follow are unavailable right now, so there is nothing to read into today.'
  }

  const sorted = [...coins].sort(
    (left, right) => right.change24hPercent - left.change24hPercent
  )
  const leader = sorted[0]
  const laggard = sorted[sorted.length - 1]
  const risingCount = coins.filter((coin) => coin.change24hPercent > 0).length

  const shape =
    risingCount === coins.length
      ? 'Everything you follow is up today'
      : risingCount === 0
        ? 'Everything you follow is down today'
        : `${risingCount} of the ${coins.length} assets you follow are up today`

  // "Strongest" and "weakest" rather than "leads" and "trails", which read as nonsense on a
  // day when everything is red — nothing leads a decline.
  const spread =
    coins.length === 1
      ? `${leader.name} is at ${formatSignedPercent(leader.change24hPercent)} over the last 24 hours.`
      : `${leader.name} is the strongest at ${formatSignedPercent(leader.change24hPercent)} and ${laggard.name} the weakest at ${formatSignedPercent(laggard.change24hPercent)}.`

  return `${shape}. ${spread} ${CLOSING_LINE_BY_INVESTOR_TYPE[investorType] ?? CLOSING_LINE_BY_INVESTOR_TYPE.hodler}`
}

const CLOSING_LINE_BY_INVESTOR_TYPE = {
  hodler: 'A single day rarely says much about a position measured in years.',
  day_trader: 'A spread this wide is where intraday range comes from, rather than direction.',
  nft_collector: 'Collection floors tend to follow the majors with a lag rather than in step.',
}

const formatSignedPercent = (changePercent) =>
  `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`

const buildResponse = (userId, date, text, isFallback) => {
  const insight = { id: buildInsightId(userId, date), text, date }

  // This section shows exactly one thing, so the vote names it. That is what makes the
  // feedback worth keeping: a thumb down here is about one piece of generated writing.
  return { contentId: insight.id, insight, isFallback }
}

const buildInsightId = (userId, date) => `${userId}:${date}`

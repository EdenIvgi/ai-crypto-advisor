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

// How much of the day's material the model is shown. Enough to have something to say, few
// enough that the paragraph stays about the reader rather than summarising a feed.
const HEADLINES_IN_PROMPT = 4

/**
 * What the model is and is not allowed to do.
 *
 * The paragraph in the second block is there because the first draft of this prompt produced a
 * competent news digest: it walked through every asset and every headline, which is precisely
 * what the two cards sitting beside it on the dashboard already do. Telling the model what the
 * reader can already see is what stops it duplicating them.
 *
 * Rule 3 is the one that must not be relaxed — this section is a daily read on the market, not
 * an adviser, and a model asked for an "insight" about somebody's own holdings drifts into
 * telling them what to buy unless it is forbidden. Rule 4 exists because a model given three
 * real figures will invent a fourth that fits the sentence.
 */
const INSIGHT_SYSTEM_PROMPT = [
  'You write the "Insight of the day" paragraph for a crypto dashboard, addressed to one',
  'reader whose holdings and investing style you are given.',
  '',
  "This reader can already see their prices and the day's headlines, in their own sections,",
  'directly beside your paragraph. Summarising either is wasted space. Your job is the thing',
  'those lists cannot do: say what today means for somebody who invests the way this reader',
  'does.',
  '',
  'Rules:',
  '1. Pick ONE thing worth noticing and stay on it. Do not walk through every asset or every',
  '   headline.',
  "2. Tie it to this reader's style, using what they are said to pay attention to. The same",
  '   day should produce genuinely different paragraphs for different styles, not the same',
  '   paragraph with different adjectives.',
  '3. Never recommend buying, selling or holding. Never predict a price or a direction. Never',
  '   instruct the reader at all — no "keep an eye on", no "watch for", no "consider". You are',
  '   not an adviser. State what is worth seeing and let them do the seeing.',
  '4. Ignore any headline unrelated to the assets this reader follows.',
  '5. Three sentences. Four at the very most. Plain prose — no lists, no headings, no emoji,',
  '   and no preamble such as "Here is your insight". Return the paragraph itself.',
  '',
  'You have no information beyond what appears below. Every figure you write must be one that',
  'was given to you. Do not state transaction fees, volumes, inflows, market caps or anything',
  'else that is absent, do not write "according to data", and do not explain why a price moved',
  'unless a headline below says why.',
  '',
  'You also know nothing about this reader beyond the style and the asset list. You do not know',
  'what else they own, which chains anything of theirs sits on, or how long they have held it —',
  'so never write as though you do. If the day gives you nothing that suits their style, make a',
  'smaller and plainer point about what the figures actually show.',
].join('\n')

/**
 * What each style actually attends to, rather than what it sounds like. The first version of
 * this feature passed only the label, and the model read "HODLer" as an instruction about tone;
 * a paragraph is only genuinely different when the thing being looked at is different.
 *
 * Every hint here is answerable from the prices and headlines the model is given, which is a
 * constraint learned the hard way. An earlier version told the collector to care about fees and
 * congestion — data this application never supplies — and the model duly invented a twenty per
 * cent fee rise and attributed it to "data". Asking for attention to a figure you do not
 * provide is a request to make one up.
 */
const ATTENTION_BY_INVESTOR_TYPE = {
  hodler:
    'cares whether anything structural changed, and treats one day of movement as noise ' +
    'unless it is unusually large',
  day_trader:
    'cares about the spread between these assets today — which of them is moving out of ' +
    'step with the others, and by how much',
  nft_collector:
    "cares about the chains their collections live on, so watches those chains' own tokens " +
    'and any headline concerning them',
}

/**
 * Today's insight for one reader, written for the way they said they invest.
 *
 * Resolved in three steps, and the first is the one that matters most:
 *
 * 1. **Today's stored insight**, if there is one. One model call per person per day, so a
 *    refresh costs nothing and — more importantly — shows the same paragraph as an hour ago.
 * 2. **A generated one**, from the day's prices and headlines, stored only if that material
 *    was live. An insight inherits the honesty of what it was written from: if either source
 *    was serving sample content, the paragraph reports `isFallback: true` even though a model
 *    wrote it, and is not cached — otherwise one refused API would hold an invented market on
 *    the page for a full day.
 * 3. **A composed one**, assembled from the prices themselves when no key is configured or
 *    every model fails. It reports `isFallback: true`.
 *
 * There is no sample text behind this section. The sources above both run on whatever the
 * price service has, so falling back to a fixed paragraph about a market that never happened
 * would be a worse answer than the plain one this composes.
 *
 * This function never throws. A section of a dashboard is not worth an error page.
 *
 * @param {{ userId: string, investorType: string, watchedAssetIds: string[] }} reader
 * @returns {Promise<{ contentId: string, insight: { id: string, text: string, date: string }, isFallback: boolean }>}
 */
export const loadDailyInsight = async ({ userId, investorType, watchedAssetIds }) => {
  const date = getTodayDateKey()

  const storedText = await readStoredInsight(userId, date)
  if (storedText) return buildResponse(userId, date, storedText, false)

  // Both of these are documented never to throw, which is what lets the guarded region below
  // be only the part that can, and lets the fallback always have real figures to work with.
  const prices = await loadCoinPrices(watchedAssetIds)

  if (!isHuggingFaceConfigured) {
    return buildResponse(userId, date, composeFromPrices(investorType, prices.coins), true)
  }

  try {
    const news = await loadMarketNews(watchedAssetIds)
    const insightText = await generateChatCompletion(
      buildInsightMessages(investorType, prices.coins, news.articles)
    )

    // A paragraph is only as true as the material it was written from, and this is the case
    // that taught it: while CoinGecko was refusing this host, a model was handed the sample
    // prices and wrote "Dogecoin's 5.07% rise outpaces Bitcoin's 1.84% gain, a spread of about
    // 3.23 percentage points" — a computed, confident claim about a day that never happened,
    // over a card reading "Written for you today". A stale price is a wrong number; prose built
    // on one is an argument.
    //
    // So the flag is inherited, and such an insight is deliberately not stored: this cache is
    // keyed by the day, and storing it would hold the invented market for a full twenty-four
    // hours instead of letting the next request try again on real figures.
    const wroteFromSampleMaterial = prices.isFallback || news.isFallback
    if (!wroteFromSampleMaterial) await rememberTodaysInsight(userId, date, insightText)

    return buildResponse(userId, date, insightText, wroteFromSampleMaterial)
  } catch (generationError) {
    console.warn('Composing the insight from prices instead:', generationError.message)
    return buildResponse(userId, date, composeFromPrices(investorType, prices.coins), true)
  }
}

/**
 * Today's stored paragraph, or null — including when the read itself fails.
 *
 * A database that cannot be read is a reason to generate a new insight, not a reason to break
 * the section. Swallowing this is what keeps the promise in the doc comment above: the only
 * unguarded call in `loadDailyInsight` would otherwise be this one, and a momentary Mongo
 * hiccup would turn a dashboard card into a 500.
 */
const readStoredInsight = async (userId, insightDate) => {
  try {
    const stored = await DailyAiInsight.findOne({ userId, insightDate }).lean()
    return stored?.insightText ?? null
  } catch (readError) {
    console.warn('Could not read the stored insight:', readError.message)
    return null
  }
}

/**
 * Writes today's paragraph. Every failure is swallowed, for two different reasons.
 *
 * A duplicate key is not a failure at all: two dashboard loads racing on a cold cache both find
 * nothing and both generate, and the unique index rejecting the second write is exactly the
 * outcome that index exists for — somebody else just stored today's.
 *
 * Any other write error is real, but losing the cache is a far smaller loss than losing the
 * paragraph. The reader gets what the model wrote; tomorrow's restart is when it matters.
 */
const rememberTodaysInsight = async (userId, insightDate, insightText) => {
  try {
    await DailyAiInsight.create({ userId, insightDate, insightText })
  } catch (writeError) {
    if (writeError?.code === DUPLICATE_KEY_ERROR_CODE) return
    console.warn('Generated the insight but could not store it:', writeError.message)
  }
}

/**
 * The exact conversation the model is sent. Exported because the prompt is the part of this
 * feature most likely to need looking at: rendering it, or running the same day's material
 * through several investing styles to see whether the paragraphs really differ, should not
 * require reaching into a private function or duplicating its wording somewhere else.
 *
 * @param {string} investorType - One of `INVESTOR_TYPES`
 * @param {Array<{ name: string, symbol: string, priceUsd: number, change24hPercent: number }>} coins
 * @param {Array<{ title: string }>} articles
 * @returns {Array<{ role: 'system' | 'user', content: string }>}
 */
export const buildInsightMessages = (investorType, coins, articles) => [
  { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
  { role: 'user', content: buildBriefingMaterial(investorType, coins, articles) },
]

/** Everything the model is given about today, as plain lines rather than JSON. */
const buildBriefingMaterial = (investorType, coins, articles) =>
  [
    `Reader's style: ${INVESTOR_TYPE_LABELS[investorType] ?? 'HODLer'}, who ` +
      `${ATTENTION_BY_INVESTOR_TYPE[investorType] ?? ATTENTION_BY_INVESTOR_TYPE.hodler}.`,
    '',
    'Assets they follow, with the last 24 hours:',
    ...coins.map((coin) => `- ${coin.name} (${coin.symbol}): ${formatQuote(coin)}`),
    '',
    "Today's headlines, some of which may be irrelevant to the assets above:",
    ...articles.slice(0, HEADLINES_IN_PROMPT).map((article) => `- ${article.title}`),
  ].join('\n')

const formatQuote = ({ priceUsd, change24hPercent }) =>
  `$${priceUsd.toLocaleString('en-US')}, ${change24hPercent >= 0 ? '+' : ''}${change24hPercent.toFixed(2)}% over 24h`

/**
 * The paragraph when no model wrote one. Assembled from the same live prices the model would
 * have been given, so it is a true statement about today rather than a placeholder.
 *
 * The closing line is framing rather than a claim about today's figures — it says what this
 * reader's horizon makes a day like this mean, which is the one thing the numbers cannot say
 * for themselves. It is still not advice.
 */
const composeFromPrices = (investorType, coins) => {
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
  `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`

const buildResponse = (userId, date, text, isFallback) => {
  const insight = { id: `${userId}:${date}`, text, date }

  // This section shows exactly one thing, so the vote names it. That is what makes the
  // feedback worth keeping: a thumb down here is about one piece of generated writing.
  return { contentId: insight.id, insight, isFallback }
}

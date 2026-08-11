import { DailyAiInsight } from '../models/DailyAiInsight.js'
import { INVESTOR_TYPE_LABELS } from '../data/preferenceOptions.js'
import { SUPPORTED_ASSETS } from '../data/supportedAssets.js'
import {
  generateChatCompletion,
  isHuggingFaceConfigured,
} from '../clients/huggingFaceClient.js'
import { loadCoinPrices } from './pricesService.js'
import { loadMarketNews } from './newsService.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const ASSETS_BY_ID = new Map(SUPPORTED_ASSETS.map((asset) => [asset.id, asset]))

const DUPLICATE_KEY_ERROR_CODE = 11000

/**
 * What the model is and is not allowed to do.
 *
 * **No figures, and that is the load-bearing rule.** This paragraph is written once and stored
 * for the day, while a 24-hour percentage changes continuously — so an insight that cited
 * "Bitcoin is down 0.9%" was quoting a number that had stopped being true by lunchtime, on a
 * page whose prices card was showing the current one two inches away. Headlines do not spoil
 * that way: an event that happened this morning still happened this evening. So the prompt is
 * given events and asked for interpretation, which is also the one thing the cards beside it
 * cannot do.
 *
 * Rule 3 must not be relaxed — this section is a daily read on the market, not an adviser, and a
 * model asked for an "insight" about somebody's own holdings drifts into telling them what to buy
 * unless it is forbidden.
 */
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

/**
 * What each style actually attends to, rather than what it sounds like. The first version of
 * this feature passed only the label, and the model read "HODLer" as an instruction about tone;
 * a paragraph is only genuinely different when the thing being looked at is different.
 *
 * Every hint is answerable from headlines alone. That is a constraint learned twice. First a
 * hint about fees and congestion — data this application never supplies — had the model invent a
 * twenty per cent fee rise and credit it to "data". Then a hint about the spread between assets
 * kept pulling the paragraph back to percentages, which is exactly what this section must not
 * talk about. **A hint that names something the model cannot see is a request to make it up.**
 */
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

/**
 * Today's insight for one reader, written for the way they said they invest.
 *
 * Resolved in three steps, and the first is the one that matters most:
 *
 * 1. **Today's stored insight**, if there is one. One model call per person per day, so a
 *    refresh costs nothing and — more importantly — shows the same paragraph as an hour ago.
 * 2. **A generated one**, written from today's headlines and stored if those headlines were
 *    live. An insight inherits the honesty of its material: written from the sample feed it
 *    reports `isFallback: true` even though a model wrote it, and is not cached — otherwise a
 *    refused source would hold events that never happened on the page for a full day.
 * 3. **A composed one**, assembled from live prices when no key is configured or every model
 *    fails. It reports `isFallback: true`.
 *
 * Note the asymmetry between 2 and 3, which is deliberate: the generated paragraph is never
 * allowed to mention a figure, because it is stored for a day and a percentage is not true for
 * a day. The composed one is built from figures and is fine, because it is rebuilt on every
 * request and never stored, so its numbers are always the current ones.
 *
 * There is no sample text behind this section. Both paths run on live material, so falling back
 * to a fixed paragraph about a market that never happened would be the worse answer.
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

  if (isHuggingFaceConfigured) {
    try {
      const news = await loadMarketNews(watchedAssetIds)
      const insightText = await generateChatCompletion(
        buildInsightMessages(investorType, watchedAssetIds, news.articles)
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
  const { coins } = await loadCoinPrices(watchedAssetIds)

  return buildResponse(userId, date, composeFromPrices(investorType, coins), true)
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
 * @param {string[]} watchedAssetIds - CoinGecko ids, e.g. ['bitcoin', 'ethereum']
 * @param {Array<{ title: string }>} articles
 * @returns {Array<{ role: 'system' | 'user', content: string }>}
 */
export const buildInsightMessages = (investorType, watchedAssetIds, articles) => [
  { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
  { role: 'user', content: buildBriefingMaterial(investorType, watchedAssetIds, articles) },
]

/**
 * Everything the model is given about today, as plain lines rather than JSON.
 *
 * The assets are named and nothing more — no price, no change, no direction. The model needs to
 * know which coins matter so it can pick the headline that touches them; it does not need, and
 * must not be given, a figure it would then quote into a paragraph that outlives the figure.
 */
const buildBriefingMaterial = (investorType, watchedAssetIds, articles) =>
  [
    `Reader's style: ${INVESTOR_TYPE_LABELS[investorType] ?? 'HODLer'}, who ` +
      `${ATTENTION_BY_INVESTOR_TYPE[investorType] ?? ATTENTION_BY_INVESTOR_TYPE.hodler}.`,
    '',
    `Assets they follow: ${describeWatchedAssets(watchedAssetIds)}.`,
    '',
    // Exactly the headlines the news section is showing, not a longer list fetched for the
    // model's benefit. So the reader can always see the material the paragraph was written
    // from, sitting in the card beside it — an insight whose source is on the same screen is
    // one they can check.
    "Today's headlines, some of which may be irrelevant to the assets above:",
    ...articles.map((article) => `- ${article.title}`),
  ].join('\n')

const describeWatchedAssets = (watchedAssetIds) => {
  const names = watchedAssetIds
    .map((assetId) => ASSETS_BY_ID.get(assetId))
    .filter((asset) => asset !== undefined)
    .map((asset) => `${asset.name} (${asset.symbol})`)

  return names.length > 0 ? names.join(', ') : 'none in particular'
}

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
  `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`

const buildResponse = (userId, date, text, isFallback) => {
  const insight = { id: `${userId}:${date}`, text, date }

  // This section shows exactly one thing, so the vote names it. That is what makes the
  // feedback worth keeping: a thumb down here is about one piece of generated writing.
  return { contentId: insight.id, insight, isFallback }
}

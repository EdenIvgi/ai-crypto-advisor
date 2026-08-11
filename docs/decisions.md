# Decisions

The choices that were not obvious, what was rejected, and why. Newest last.

## JavaScript, not TypeScript

The brief leaves the language open. TypeScript would have given the reader type signatures; the
same job is done here by Zod at the three places untrusted data enters — request bodies,
`process.env`, and external API responses — plus JSDoc on exported service functions.

Zod earns its place regardless, because it validates at runtime where TypeScript cannot: a news
feed that changed shape overnight is caught by the schema, not by the compiler.

## Preferences embedded in the user document

`preferences` is a subdocument on `User` rather than its own collection. It is one-to-one with
the user, always read together with them, and small, so a separate collection would only add a
lookup.

The useful consequence: **the absence of `preferences` is the "not yet onboarded" flag.** There
is no separate boolean that could drift out of sync with the answers themselves, and
`hasCompletedOnboarding` in the API is derived, not stored.

`FeedbackVote` goes the other way — its own collection — because votes are append-heavy,
unbounded per user, and queried on their own as feedback data.

## Express 5, and no `asyncHandler`

The plan called for an `asyncHandler` wrapper so rejected promises in async controllers would
reach the error handler. Express 5 already forwards them, so the wrapper was dropped before it
was written. `.claude/docs/backend-conventions.md` was corrected rather than left describing
code that does not exist.

## `bcryptjs` rather than `bcrypt`

`bcrypt` is a native addon and has to compile at install time. On a free-tier host with a
constrained build environment that is a deployment failure waiting to happen, and it would
surface at the worst moment — the first deploy. `bcryptjs` is pure JavaScript and installs
anywhere.

The tradeoff is real: `bcryptjs` is slower. At this scale, where hashing happens on registration
and login and nowhere else, that cost is invisible, and it buys a build that cannot fail for
reasons unrelated to this code.

## ESLint 10

`@eslint/js` requires ESLint 10 as a peer. The alternatives were to pin an older `@eslint/js`, or
to force the install with `--legacy-peer-deps` and run on a dependency tree npm had just said was
inconsistent. Neither is a good answer on a project a week old, so the floor moved to ESLint 10.
The flat config it requires was already what this repo used.

## Session token in an httpOnly cookie, not `localStorage`

The brief accepts either JWT or sessions. A token in `localStorage` is readable by any script
that runs on the page, so one cross-site scripting hole becomes account takeover. In an httpOnly
cookie it is not reachable from JavaScript at all.

The cost is cross-origin configuration: the deployed frontend and API sit on different hosts, so
the cookie needs `SameSite=None; Secure`, the API needs an exact-origin CORS policy with
credentials enabled, and Express needs `trust proxy` set because the host terminates TLS at its
own edge. Every one of those is required, and missing any one breaks authentication **only in
production** — which is why the first deploy is scheduled early, before the external
integrations, and is verified in a clean incognito window.

## The JWT payload carries only the user id

Everything else — name, preferences — is loaded from the database on each request. A token lives
for seven days; anything baked into it can be a week out of date. This costs one indexed lookup
per request and removes a whole class of stale-data bug.

## Wrong password and unknown email return the same 401

Byte-identical message, and a test asserts the equality. Telling the two apart is a free account
enumeration oracle. For the same reason, login validation is looser than registration: a "too
short" complaint on the sign-in form would confirm that a guess was the wrong length.

## Development runs with no configuration

With no `MONGODB_URI` the server starts an in-memory MongoDB; with no `JWT_SECRET` it generates a
random one per process. Both warn loudly about what that costs, and production refuses to start
without real values.

The rejected alternative was a hardcoded fallback secret. That is the version people ship to
production by accident. A per-process random secret cannot be: it fails visibly, by ending every
session at restart, instead of silently signing production tokens with a value that is in the
repository.

## The onboarding content categories differ from the brief's examples

The brief suggests "Market News, Charts, Social, Fun" as example answers to the content question.
This app asks about **Coin Prices, Market News, AI Insight of the Day, and Fun Crypto Meme** —
the four dashboard sections, exactly.

The brief says "e.g.", so the categories are illustrative rather than required, and tying the
answers to the sections makes the question mean something concrete: what you pick is literally
what renders, and what you leave out does not appear at all. Categories that did not map onto
sections would have been collected and then ignored, which is worse than not asking.

## The dashboard is built on mock data before any integration

M5 builds the whole dashboard against fixed mock data and freezes the four response contracts;
M7 deploys it; only then do M8 to M11 replace each mock with a real API, one at a time.

This is a schedule decision, not a technical one. The original plan built the four sections
consecutively, which put five milestones in a row on the dashboard with nothing deployable until
the end. Under the current order there is a working, deployable product from M5 onward, and if
time runs out what is missing is one section rather than the product. The least predictable
integration, the LLM, is last and has the strongest fallback.

## Dates and numbers are pinned to the interface's language

`Intl` follows the browser's locale unless you tell it otherwise, and normally that is the
right default. Here it produced a Hebrew weekday inside an English paragraph, laid out
right-to-left in a left-to-right label, and a price written `118,432.50$` with the currency
symbol trailing.

The rejected alternative was to keep the browser default and accept it. Every word of this
interface is written in English; a date and a price that follow a different language are not
localisation, they are an interface that disagrees with itself. `INTERFACE_LOCALE` in
`client/src/features/dashboard/dashboardFormatters.js` is the single line to change if this is
ever localised for real, at which point the copy would have to move with it.

## A vote names the content it was cast on, and the server names it

`contentId` identifies what a section was showing when someone voted. Sections that show a
single item use its id; the two that show a list use the day, because the thumb is about that
day's selection rather than about one headline in it.

The rejected alternative was to let the client derive an identity from the payload — hashing
the article ids, say. That makes the client responsible for naming content it did not produce,
and the name would change whenever the list did, scattering one person's opinion of a section
across rows nobody could group again.

The unique index is on `{ userId, sectionType, contentId }` rather than on `contentId` alone,
so two people can disagree about the same meme and both opinions survive. That is the entire
value of the data.

## News comes from the publishers' RSS feeds, not from CryptoPanic

The brief suggests CryptoPanic and also says **"use only free public APIs"**. Those two
instructions stopped being compatible: CryptoPanic's free Developer plan was discontinued and
removed on 1 April 2026, so the suggested source now requires a paid plan. Eleven alternatives
were checked before choosing; every remaining crypto news API needs a key, and the ones that
died did so recently — Messari's news endpoint returns 404, CoinStats and CoinDesk Data now
answer 401, CoinGecko's is PRO-only.

So the section reads four publisher RSS feeds directly — CoinDesk, Cointelegraph, Decrypt and
The Block. RSS needs no account and no token, which keeps the promise that a fresh clone of this
repository runs with real content and no signup.

Three consequences, and the second is the one that made the decision easy:

- **Four sources instead of one.** A feed that is down or slow costs a quarter of the headlines,
  not the section. `fetchLatestArticles` only fails when all four do.
- **Nothing was actually lost.** The one thing CryptoPanic offered that a feed does not is
  per-coin tagging — and no surviving free tier has it either, Finnhub's crypto endpoint
  included. A key would have bought a single point of failure and no personalisation.
- **One request serves everyone.** The feeds are identical for every reader, so the cache holds
  one entry and the publishers see one request per ten minutes regardless of how many people are
  looking. Filtering upstream would have meant a separate request per combination of assets.

## Headlines are ranked for the reader, not filtered

The brief requires the four sections to be chosen by the quiz; it does not ask for the news
inside one to be filtered by the assets someone follows. That was an invention of the
implementation plan, and it was worth removing.

Matching a headline to a coin is a guess: "the largest cryptocurrency just recovered" is about
Bitcoin and never says so. Used as a filter, that guess silently costs the reader an article.
Used as a **ranking** — headlines naming your assets first, the rest by recency — it can only
reorder, the section always has five items, and there is no thin-card edge case to handle.

Names are matched case-insensitively and tickers are not: `DOT` is Polkadot, `dot` is
punctuation, and `\bATOM\b` matched case-insensitively would claim every headline containing
the word "atom".

## The memes are drawn for this app, and rotate by the day

The brief offers "Reddit scraping **or static JSON**", and this is the second — for a reason
that showed up while testing the news source: **Reddit answers a plain server request with 403.** It blocks non-browser clients, and does so harder from cloud address ranges, so the live
route would have spent most of its life serving the fallback anyway. A "live" integration whose
normal state is fallback is worse than an honest static one, because it also carries the code
to fail.

The static list holds seven original SVGs in `client/public/memes/`, not links to other
people's uploads. Two reasons, and the first is the same one behind hosting them at all:

- **A hotlinked image breaks the day its host expires the URL**, which defeats the point of
  going static.
- **Nothing in this repository is then someone else's artwork.** Reddit memes are user-generated
  content with unclear rights, and a public repository is not the place to guess.

`sourceUrl` points at the file on GitHub, because that is honestly where it came from.

Two consequences worth knowing. This is the only section whose `isFallback` is a constant — it
is always `false`, because these memes **are** the source rather than a stand-in for one, and a
"sample" badge would describe a fallback this section does not have. And the rotation counts
whole days since the epoch rather than the day of the year: day-of-year restarts at 1 while the
list is part-way through, so on 1 January the rotation would jump backwards and repeat.

If real memes are ever wanted instead, `server/src/data/dailyMemes.js` is the only file to edit.

## The insight comes from Hugging Face, and there is no free model on it

The brief offers "a free LLM like OpenRouter or Hugging Face". Hugging Face was chosen, and the
first thing checking it produced was a correction: **`api-inference.huggingface.co` is gone** —
it does not answer at all, not even with a 401. The live surface is
`router.huggingface.co/v1/chat/completions`, which is OpenAI-shaped.

The second correction matters more. Of the 130 models the router lists, **none is marked free**;
all 205 live provider entries bill per token against a monthly account credit. "Free tier" here
means a small budget, not free models.

That turned out not to constrain anything, because the numbers are small enough to check rather
than fear. At roughly 700 tokens in and 220 out, one insight costs between $0.000014 and
$0.000063 across the plausible models — and with one call per person per day, the credit is
irrelevant. So the model chain is ordered by **quality**, not price:
`openai/gpt-oss-120b` → `gpt-oss-20b` → `meta-llama/Llama-3.1-8B-Instruct`. The provider is
deliberately not pinned, so Hugging Face can route around one that is down.

## The insight is cached in MongoDB, and it is the only cache that is

Prices and news use an in-memory TTL cache; this one gets a collection and a unique index on
`{ userId, insightDate }`. Three reasons, and the second is the real one:

- Refetching a price is one free HTTP call. Regenerating an insight spends a model call.
- **It would hand the reader a different paragraph than the one they read an hour ago.** A daily
  briefing that rewrites itself on every refresh is not a daily briefing.
- The free host stops when nobody is using it, so an in-memory cache would miss most of the time.

The index does real work: two dashboard loads racing on a cold cache both generate, and it
rejects the second write. That rejection is treated as success — somebody else just stored
today's — and every other write error is swallowed too, because losing the cache is a much
smaller loss than discarding a paragraph the model already wrote.

## This section has no sample text, unlike the others

Prices and news fall back to fixed sample content, because when a source refuses there is
nothing else to show. The insight has a better option: it is **composed from the day's real
prices** — which asset is strongest, which weakest, how many are up — with one closing line
chosen by investing style.

`MOCK_INSIGHTS_BY_INVESTOR_TYPE` was written in M5 and deleted here. A fixed paragraph about a
market that never happened is a worse answer than a plain sentence about the real one, and the
label says which the reader is looking at: **Written for you today** or **From today's prices**.

## The model is told what not to do, and it needed telling three times

This is the one section where a machine writes about somebody's own holdings, so the prompt
forbids recommending, predicting, and instructing, and the card carries a small
**Observations, not advice** line. Getting there took three rounds against real output, and each
failure was informative:

1. **It wrote a news digest.** Competent, and a duplicate of the two cards either side of it. Fixed
   by telling the model what the reader can already see, and to make one point rather than a tour.
2. **It invented a statistic** — a twenty per cent rise in Ethereum fees, "according to data". That
   one was our fault: the prompt told the collector to care about fees and congestion, which this
   application never supplies. **Asking for attention to a figure you do not provide is a request
   to make one up.** Every style hint now names only things in the material.
3. **It instructed the reader** — "keep an eye on the fork's progress". Soft, and still an
   instruction, so those phrasings are now banned by name.

What remains is honest to record: a model can still overreach on a day when the material offers
its style nothing, and no prompt makes that impossible. Passing each investing style what it
actually _looks at_, rather than only its label, did more than any rule — a paragraph is only
genuinely different when the thing being examined is different.

## An insight inherits the honesty of what it was written from

Found in production, not in a test. While CoinGecko was refusing this host, a model was handed
the sample prices and wrote:

> Dogecoin's **5.07%** rise outpaces Bitcoin's **1.84%** gain, generating a spread of about
> **3.23 percentage points**.

Every figure is from `MOCK_COIN_PRICES`, and the card above it read **Written for you today**.
This is the M8 rule — a fallback must not lie — broken one level up, and worse than the original:
a stale price is a wrong number, while prose built on one is a confident argument, complete with
a spread computed to two decimals for a day that never happened.

So `isFallback` is now inherited: if the prices or the headlines that fed the prompt were sample
content, the paragraph reports `isFallback: true` even though a model wrote it. And such an
insight is **not stored** — this cache is keyed by the day, so caching it would hold the invented
market on the page for a full twenty-four hours instead of letting the next request try again on
real figures.

**The known imprecision, stated rather than hidden.** `isFallback` is one boolean over three
different situations: no key configured, every model failed, or a model wrote from sample
material. The label reads "From today's prices", which is exactly right for the first two — they
compose from live figures — and imprecise for the third, where the prices were samples too.
Naming all three would mean widening a response contract that four sections share, for a state
that only occurs while a third party is down, and the prices card beside it already reads
**Saved prices** whenever it happens. Left as is, deliberately.

## Prices come from `/simple/price`, not `/coins/markets`

Reported as "the percentages are wrong". They were, and it took three rounds to find out why —
including one wrong conclusion of mine that the human's evidence killed, and one right answer
that only appeared because they asked again.

**Round one: we were faithful, and the field was bad.** Our value was a plain copy of
`price_change_percentage_24h`, no arithmetic, matching CoinGecko field-for-field on all twelve
assets. But that field **arrives rounded to a tenth of a per cent** — twelve assets sampled
together came back as exact multiples of 0.1. Displaying it as `-0.90%` claimed a hundredth
nobody had given us, and made a coarse number look stuck rather than coarse.

**Round two: the obvious fix, rejected.** The same response carries `price_change_24h` and
`current_price` at full precision, and deriving from them agrees with
`market_cap_change_percentage_24h` to within 0.03 points. On some assets it differed from the
given field by a full point, and Litecoin's sign flipped. Conclusive — until screenshots of
CoinGecko's own site showed BTC at **-0.9% on the markets table** and **-1.1% on the coin page**
at the same moment. Deriving would have published a fourth number matching none of their
surfaces, so it was dropped.

**Round three: there was a better endpoint all along.** Three routes to the same fact, sampled
together:

| Endpoint         | BTC 24h change | Its own `last_updated` |
| ---------------- | -------------- | ---------------------- |
| `/coins/markets` | `-0.9`         | 174s ago               |
| `/simple/price`  | `-1.0944`      | 134s ago               |
| `/coins/{id}`    | `-1.0944`      | 25s ago                |

`/coins/markets` is both the least precise and the stalest of the three. The other two carry
full precision and agree with each other, and `-1.0944` is what CoinGecko's per-coin page shows
as `-1.1%` — the figure the human had identified as the accurate one.

So the client now calls **`/simple/price`**: full precision, fresher, one request for every
asset, and a much smaller payload. `/coins/{id}` is marginally fresher still but needs one
request per coin, and this free tier returned 429 after three requests in thirty seconds.

Two consequences worth knowing. `symbol` and `name` are no longer read from CoinGecko — they
come from `data/supportedAssets.js`, which is where they always belonged, so the client returns
only what the API actually knows and the cache stores no repeated copies of the word "Bitcoin".
And the ordering is now part of the client's contract rather than fixed up afterwards: a keyed
response has no order of its own, so it returns quotes in the order they were asked for and
`sortAsChosen` was deleted.

The display still shows one decimal, but for a different reason than before: it is a reading
decision, not a limit. The second decimal of a daily change is noise, and it matches how
CoinGecko itself presents the number. The rounding now happens once, in our formatter, on a
figure that was never rounded upstream.

## The insight is written from events, never from figures

The section is generated once and stored for the day. A 24-hour percentage is not true for a
day. Those two facts were in direct conflict, and the conflict shipped: an insight written at
09:00 said "Bitcoin's 1.70% decline leaves it about 1.9 percentage points lower than Dogecoin's
0.20% gain", and by afternoon Bitcoin was at -0.9% — with the prices card two inches away
showing the current figure, live, while the paragraph beside it quoted a different morning.

Raising the cache rate was the obvious fix and the wrong one: it would spend a model call per
reader per refresh to keep restating what the card already says better.

**Headlines do not spoil that way.** An event that happened this morning still happened this
evening. So prices are out of the prompt entirely — the model is given the reader's asset
_names_, their style, and the day's headlines, and is forbidden to mention a price, a
percentage, or even a direction. What it produces is interpretation, which is also the one
thing the two cards beside it cannot do, so the duplication problem disappeared with the
staleness problem.

Three consequences worth knowing:

- **The style hints had to be rewritten too.** "Cares about the spread between these assets"
  kept dragging the paragraph back to percentages. A hint naming something the model cannot see
  is a request to make it up — the same lesson as the invented fee statistic, learned twice.
- **The prompt gets exactly the headlines the news card shows**, not a longer list fetched for
  the model. An insight whose source material is visible on the same screen is one a reader can
  check.
- **Only the news feed can now taint it.** A CoinGecko outage no longer touches this section,
  because it no longer reads prices.

The composed fallback still uses figures, and that is not an inconsistency: it is rebuilt on
every request and never stored, so its numbers are always the current ones. The rule is not
"no numbers" — it is that a paragraph kept for a day may not contain anything that expires
sooner.

## Only the production frontend can sign in, and Vercel preview URLs cannot

`CLIENT_ORIGIN` is one exact origin. Vercel also publishes a unique URL per deployment —
`ai-crypto-advisor-client-<hash>-<account>.vercel.app` — and none of those match it, so a
browser on a preview URL is refused by CORS and cannot log in. This looked like a bug the first
time it happened; it is the policy working.

The alternative was a regular expression matching `*.vercel.app`. That would accept requests
from **any** account's deployment on that shared domain, and the cookie carrying the session is
`SameSite=None`, so widening the origin widens exactly the thing the cookie relies on. A preview
build is a convenience; an origin allowlist that admits a whole public suffix is not worth it.

The consequence to know: after a deploy, test on the production domain. If a preview URL is ever
genuinely needed, add that one origin explicitly.

## The test suite is capped

Two integration tests, one unit test, one smoke test, and a written rule against adding more
without asking. The brief is graded on UX, readable code, and structure; coverage is not on the
list, and time spent chasing it is time not spent on the product.

The two integration tests were chosen because each covers something that would be invisible until
it broke in production: the auth flow covers the JWT, the cookie, and the guard middleware
agreeing with each other, and the voting test covers the unique compound index actually
preventing duplicate votes.

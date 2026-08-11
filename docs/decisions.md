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

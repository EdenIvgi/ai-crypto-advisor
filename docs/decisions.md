# Decisions

The stack, and then the places where the build ended up different from the plan I started with.
Everything decided upfront and never revisited is in the table and nowhere else.

## Stack

| Choice                              | Why it fits this assignment                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| JavaScript, with Zod and JSDoc      | No build step. Zod validates at runtime, where a compiler can't — a news feed that changes shape overnight is caught.     |
| Express 5                           | Forwards rejected promises to the error handler itself, so async controllers need no wrapper.                             |
| MongoDB + Mongoose                  | `preferences` is a subdocument on the user, so its absence _is_ the "not onboarded" flag. Votes get their own collection. |
| JWT in an httpOnly cookie           | Unreachable from JavaScript, so one XSS hole isn't account takeover. The payload holds only the user id.                  |
| bcryptjs                            | Pure JavaScript. `bcrypt` compiles at install and can fail a free-tier build for reasons unrelated to the code.           |
| React 19 + Vite + Tailwind + shadcn | "Clean UX" is a graded criterion; shadcn gives accessible primitives I own the source of rather than a theme I fight.     |
| TanStack Query                      | Four independent sections, each with its own cache, staleness and error state — hand-rolling that is where the bugs live. |
| Publisher RSS for news              | No account and no token, so a fresh clone runs with real content. The brief requires free public APIs.                    |
| Hugging Face router for the insight | Free-tier credit, no payment details required. One insight costs about $0.00003 of it, so I picked models by quality.     |
| Vercel + Render + Atlas             | Three free tiers, and the split forces the cross-origin cookie setup to be correct rather than accidentally working.      |
| Vitest + Supertest + Playwright     | A capped suite, on purpose: the brief grades UX, readable code and structure, not coverage.                               |

## Milestones reordered so the product deploys before the integrations

The original plan built the four dashboard sections consecutively — five milestones on one
screen, with nothing deployable until the end, which is exactly where a project like this stalls.

Now M5 builds the whole dashboard on mock data and freezes the four response contracts, M7
deploys it, and M8–M11 replace one mock at a time. There's a working product from M5 onward, and
running out of time costs a section rather than the product. The LLM is last, because it's the
least predictable and has the strongest fallback.

## The four services were written in M5, not with each integration

The plan had the controller read the mock file directly and each integration milestone add a
service and edit the controller — four more edits to the file that freezing the contract was
meant to protect. So `loadCoinPrices`, `loadMarketNews`, `loadDailyInsight` and `loadDailyMeme`
exist from M5 with mock bodies, and each later milestone replaces one function body.

## The quiz asks about the four sections, not the brief's example categories

The brief suggests "Market News, Charts, Social, Fun" — with an "e.g.", so illustrative. I ask
about **Coin Prices, Market News, AI Insight of the Day, Fun Crypto Meme** instead, so what you
pick is literally what renders and what you skip doesn't appear. Categories mapping onto no
section would have been collected and then ignored.

## Dates and numbers are pinned to English

`Intl` follows the browser locale by default. Mine is Hebrew, which produced a right-to-left
weekday inside an English sentence and a price written `118,432.50$`. Every word of this
interface is English; a date in another language isn't localisation, it's an interface
disagreeing with itself. `INTERFACE_LOCALE` is the one line to change if it's ever localised
properly.

## Sections carry a `contentId`, added after the contracts were frozen

A vote has to say what it was cast on, and the M5 contracts had nothing to point at. The server
names what it served rather than the client inventing an identity for content it didn't produce —
a client-derived name would change whenever the list did, scattering one person's opinion across
rows nobody could group again.

Single-item sections use the item's id; the two lists use the day, because the thumb is about
that day's selection. The unique index is `{ userId, sectionType, contentId }`, so two people can
disagree about the same meme and both opinions survive.

## News comes from publisher RSS, not CryptoPanic

The brief suggests CryptoPanic and also says "use only free public APIs". Those stopped being
compatible: CryptoPanic's free Developer plan was removed on 1 April 2026, which I found only
after we'd already built against it. Of eleven alternatives, all need a key — and the one
capability that would justify one, per-coin tagging, no longer exists on any free tier either.

So the section reads CoinDesk, Cointelegraph, Decrypt and The Block directly. Four sources means
a dead feed costs a quarter of the headlines instead of the section, and the feeds are identical
for every reader, so one cache entry serves everyone.

## Headlines are ranked, not filtered

Filtering the news by the assets someone follows was never in the brief — it came from my own
implementation plan and had been treated as a requirement for nine milestones.

Matching a headline to a coin is a guess: "the largest cryptocurrency just recovered" is about
Bitcoin and never says so. As a filter, a bad guess costs the reader an article. As a ranking it
can only reorder, and the card always has five items.

## The memes are static SVGs drawn here, not scraped from Reddit

The brief allows either, and Reddit answers a plain server request with 403 — harder still from
cloud ranges — so a live route would have served the fallback most of its life. A "live"
integration whose normal state is fallback is worse than an honest static one, because it also
carries the code to fail.

The seven memes are drawn for this app rather than linked: a hotlink breaks the day its host
expires the URL, which defeats the point of going static, and copying real memes in would put
other people's content, with unclear rights, into a public repository. Swapping in real images
means editing `server/src/data/dailyMemes.js` and nothing else.

## The insight has no sample text, unlike the other sections

I wrote `MOCK_INSIGHTS_BY_INVESTOR_TYPE` in M5 and deleted it in M11. When the model is
unavailable the paragraph is **composed from the day's real prices** instead — strongest asset,
weakest, how many are up. A fixed paragraph about a market that never happened is worse than a
plain sentence about the real one, and the label says which you're reading: **Written for you
today** or **From today's prices**.

## `isFallback` is inherited from the material a section was built on

Found in production. While CoinGecko was refusing this host, the model was handed the sample
prices and wrote a confident argument — "a spread of about 3.23 percentage points" — about a day
that never happened, under a **Written for you today** label.

A stale price is a wrong number; prose built on one is an argument. So if the material was sample
content, the paragraph reports `isFallback: true` even though a model wrote it, and it is **not
cached** — this cache is keyed by the day, so storing it would hold the invented market on screen
for twenty-four hours instead of letting the next request try again.

## Prices come from `/simple/price`, not `/coins/markets`

I reported the percentages as wrong; they were, and it took three rounds. `/coins/markets`
returns `price_change_percentage_24h` **already rounded to a tenth of a per cent** — twelve
assets sampled together came back as exact multiples of 0.1 — and it's the stalest of the three
endpoints that answer the same question:

| Endpoint         | BTC 24h change | Its own `last_updated` |
| ---------------- | -------------- | ---------------------- |
| `/coins/markets` | `-0.9`         | 174s ago               |
| `/simple/price`  | `-1.0944`      | 134s ago               |
| `/coins/{id}`    | `-1.0944`      | 25s ago                |

`-1.0944` is what CoinGecko's own per-coin page shows as `-1.1%`. `/coins/{id}` is fresher still
but needs a request per coin, and this tier returned 429 after three requests in thirty seconds.

Deriving the percentage ourselves was proposed in between and rejected: my own screenshots showed
CoinGecko displaying -0.9% on one page and -1.1% on another at the same moment, so a derived
figure would have matched none of their surfaces. `symbol` and `name` now come from
`data/supportedAssets.js` rather than CoinGecko, and the client returns quotes in the order asked.

## The insight is written from headlines, never from figures

The section is generated once and stored for the day. A 24-hour percentage isn't true for a day,
and the conflict shipped: an insight written at 09:00 cited Bitcoin at -1.70% while the prices
card two inches away showed -0.9%, live.

Regenerating more often would spend a model call per refresh to restate what the card already
says better. Headlines don't spoil that way — an event that happened this morning still happened
this evening. So the model gets the reader's asset _names_, their investing style and the day's
headlines, and is forbidden to mention a price, a percentage or a direction. What's left is
interpretation, which is the one thing the cards beside it can't do — so the duplication problem
left with the staleness problem.

The composed fallback still uses figures, which isn't inconsistent: it's rebuilt every request
and never stored. The rule isn't "no numbers" — it's that a paragraph kept for a day may not
contain anything that expires sooner.

## A vote can be withdrawn, which reverses an earlier decision of mine

The thumbs used to be one-way: pressing the pressed one did nothing, on the reasoning that an
opinion is either kept or reversed. That was wrong in the one case that matters. With only "up"
and "down" reachable, a mis-click can be flipped but never cleared — so somebody who never meant
to say anything is forced to leave an opinion they don't hold in the data.

Withdrawing **deletes the row**. I rejected a third value like `vote: 'none'`, which would fill
the dataset these votes exist to become with records of nobody thinking anything.

The target travels as query parameters — `DELETE /api/feedback?sectionType=…&contentId=…` —
rather than as a body, because a body on DELETE is legal but has no agreed meaning and
intermediaries are free to drop it. That required fixing `validateRequest`, whose documented
`query` support had never actually worked: Express 5 exposes `req.query` through a getter with no
setter, so assigning the parsed value threw a `TypeError`. No route had used it until this one.

## Changing your answers rewrites today's insight

While answers were write-once, nothing could go stale. Now that they're editable, one section
can: the insight is generated per reader per day and stored, so switching from HODLer to day
trader at noon would leave a paragraph addressed to the profile you'd just abandoned on screen
until midnight, under a **Written for you today** label.

So saving discards today's stored paragraph — but only when the change would change the writing.
The prompt is built from the investing style and the asset names and nothing else, so toggling a
_section_ on or off spends no model call and keeps a paragraph the reader may already have voted
on. Verified both ways: changing sections leaves the text byte-identical, changing the style
produces a visibly different one.

The thumb on a discarded paragraph goes with it. `contentId` is `userId:date` rather than a hash
of the text, so a vote left behind would silently reattach to whatever gets written next — an
opinion about writing nobody read, in the one dataset this project keeps.

## Editing answers is a form, not the wizard again

Onboarding asks one question per screen, which is right for somebody answering for the first
time. Somebody returning to change one answer should see all three at once and go straight to the
one they came for, so `/settings` stacks the same three questions behind one Save button. Saving
lands on the dashboard, because the dashboard is what these answers configure and therefore the
only real confirmation that it worked.

Two consequences of reusing the quiz's components in a second place. They moved to
`features/preferences/` and stopped being called steps, because on this screen they aren't steps.
And `ContentPreferencesQuestion` stopped promising "Headlines filtered down to those assets",
which had been untrue since filtering became ranking in M9 — reading the copy in a new context is
what surfaced it.

## The theme is a class, set before the first paint

`.dark` on `<html>`, toggled from the header and stored in `localStorage`. Not a media query:
the reader's choice has to beat the operating system's, and a media query cannot be overridden by a
click.

The part that needed thought is the order things happen in. React renders too late to decide a
theme — a reader who chose dark would get a white flash on every single load, which is worse than
not offering the choice. So a small classic script in `index.html` applies the class before the
bundle is even requested, and the button reads its initial value from the class that script
applied rather than from storage. Reading the class is what makes it impossible for the control to
disagree with the page it is sitting on.

The cost is one duplicated string: the storage key is written in `index.html` and again in
`lib/theme.js`. A script that must run before the bundle cannot import a module, and importing one
would cost exactly the round trip it exists to avoid.

The system preference is the starting point and nothing more. Until somebody picks a side, the OS
decides; from the first click onward, they do.

## Reduced motion is honoured selectively, and the spinner is the exception

`prefers-reduced-motion` normally gets the blanket recipe — kill every animation and transition
with `!important`. Applied here it would have killed the wrong one.

This interface animates three things. Placeholder pulses stop, because a dozen blocks breathing in
unison is the loudest movement on screen and says nothing the static block does not. Colour
transitions stop, because they only make a hover feel attached to the pointer. **The session
spinner keeps spinning**, and that is deliberate: it is the only sign that a cold free-tier server
is being waited on, which can take the better part of a minute, and a spinner that has stopped
reads as a page that has given up.

## A quiz option's name is the answer, not the answer plus its explanation

Each option is a button holding a title and a sentence explaining it, and its accessible name was
being computed from both — "Day TraderYou are in and out, and the charts matter today", which is
the name of nothing. The title is now the name via `aria-labelledby` and the sentence is the
description via `aria-describedby`, so somebody choosing hears the answer first and the reasoning
after.

Found by reading the accessibility tree rather than the markup. Worth recording that the tooling
disagreed about it: the in-app browser's tree showed no name at all both before and after the fix,
so the wiring was verified by resolving the references by hand.

## The end-to-end tests are not in CI

Three Playwright tests, run with `npm run test:e2e` against the local stack, and left out of
`.github/workflows/ci.yml` on purpose. CI has no database and no seeded demo account, and a 115 MB
browser download on every pull request buys less than it costs on a project this size.

The tradeoff is real and worth naming: a check that is not automated is a check somebody has to
remember. What makes it acceptable is that these three cover things a reviewer would notice
immediately anyway — signing in, seeing four sections, a thumb that sticks — while the failures
that hide are covered by the fast suite that does run on every push.

The keyboard test earns its place beyond the plan's list. The in-app browser I verify with
dispatches synthetic key events that reach JavaScript listeners but do not trigger the browser's
own activation behaviour, so pressing Space on a focused button appeared to do nothing there.
Playwright presses keys properly and showed the buttons were fine all along — but it means keyboard
operability is now asserted by a test rather than by my having watched it work.

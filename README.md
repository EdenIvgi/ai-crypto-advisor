# AI Crypto Advisor

A daily crypto briefing assembled from how you actually invest.

**[ai-crypto-advisor-client-pi.vercel.app](https://ai-crypto-advisor-client-pi.vercel.app)** —
press **"Look around with a demo account"** on either auth screen and you land on a populated
dashboard, no signup. Give the first request up to a minute: the API runs on a free instance that
stops when nobody is using it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/dashboard-dark.png">
  <img
    alt="The dashboard on the demo account: live coin prices, an insight written for a long-term holder, the day's meme, and market news with Bitcoin headlines at the top"
    src="docs/dashboard-light.png"
  >
</picture>

## What it does

Three questions at sign-up — what kind of investor you are, which assets you follow, which
sections you want — and the dashboard is built from the answers. Nothing you didn't ask for
renders.

- **Coin prices** for your assets, in the order you picked them, refreshed every minute.
- **Market news** from four publishers, with headlines naming your assets lifted to the top.
- **An AI insight**, written once a day for the way you invest — from the day's events rather
  than from figures that expire by the afternoon.
- **A meme**, rotating daily.

All three answers are editable later from the profile link in the header, and the dashboard is
rebuilt from the new ones — including the insight, which is rewritten on the spot if you changed
how you invest. There is a light and a dark theme; the first visit follows your system and every
visit after that follows whichever you last picked.

Every section takes a thumbs up or down, and each vote is stored against the exact content it was
cast on, so the feedback is usable as a training signal rather than as a counter. Pressing a
pressed thumb withdraws it, so "no opinion" stays reachable after a mis-click.

Every card also states where its content came from. When a source is unreachable the section
falls back — to the last good response, or to fixed content — and the label changes with it, so a
fallback is never mistaken for today's data.

## Quick start

Requires Node 22 or newer.

```bash
npm install
npm run dev
```

The API comes up on `http://localhost:4000` and the client on `http://localhost:5173`.

**No configuration and no API keys are needed to run it.** With no `server/.env`, the API starts a
throwaway in-memory MongoDB and generates a session secret for that process, and says so in the
log — everything works, nothing survives a restart. Prices come from CoinGecko's public tier and
news from the publishers' RSS feeds, neither of which needs an account, and the memes are drawn
in this repository.

To keep your data, copy `server/.env.example` to `server/.env` and fill in a real `MONGODB_URI`
and `JWT_SECRET`.

### Configuration

| Variable              | Where  | Required      | Notes                                                      |
| --------------------- | ------ | ------------- | ---------------------------------------------------------- |
| `NODE_ENV`            | server | no            | `development`, `test`, or `production`                     |
| `PORT`                | server | no            | Defaults to 4000                                           |
| `CLIENT_ORIGIN`       | server | no            | Exact browser origin, for CORS. No trailing slash          |
| `MONGODB_URI`         | server | in production | Include the database name before the `?`                   |
| `JWT_SECRET`          | server | in production | At least 32 characters                                     |
| `VITE_API_BASE_URL`   | client | in production | Origin of the API. Defaults to `http://localhost:4000`     |
| `COINGECKO_API_KEY`   | server | never         | Free demo key. Raises a per-IP allowance, nothing more     |
| `HUGGINGFACE_API_KEY` | server | never         | Read token. Without it the insight is composed from prices |

The one key that changes what you see is `HUGGINGFACE_API_KEY`: with it the insight is **written
by a model** for the way you said you invest; without it the same card is **composed from the
day's real prices**. Both are true statements about live data, and the card says which one you're
reading.

Percent-encode special characters in the Mongo password — an unquoted `#` truncates the value
where the `.env` parser treats it as a comment.

### Other commands

```bash
npm run lint
npm run format
npm test
npm run build
npm run seed:demo --workspace server    # create the demo account
npm run check:db --workspace server     # confirm the database is reachable
```

`check:db` reports the host, database, collections and document counts, and never prints the
connection string.

## Architecture

```mermaid
flowchart LR
    Browser["React 19 + Vite<br/>TanStack Query"]
    API["Express 5<br/>routes → controllers → services"]
    DB[("MongoDB Atlas<br/>users · votes · insights")]
    Ext["CoinGecko · publisher RSS<br/>Hugging Face"]

    Browser -- "JWT in an httpOnly cookie" --> API
    API --> DB
    API -- "cached, with static fallbacks" --> Ext
```

The API is layered, and the layers aren't skipped. Routes map a path to a middleware chain and
one controller. Controllers read `request.userId`, call exactly one service, and send JSON — they
never touch Mongoose, validate input, or catch errors. Services hold the logic and are callable
from a script or a test because they never see `request` or `response`. Each external API gets a
thin client that only speaks HTTP; caching and fallbacks live in the service above it.

Two consequences worth knowing:

- **`errorHandler.js` is the only place an error becomes a response.** Everything else throws a
  typed error from `lib/httpErrors.js`. Unrecognised errors return a generic 500, because an
  unexpected message can leak paths or credentials.
- **`config/env.js` is the only module that reads `process.env`.** It validates at boot and exits
  with a readable list of what's wrong, rather than surfacing an `undefined` mid-request.

### Layout

```
client/src
  lib/            apiClient (the only fetch call), queryClient
  components/     ui (shadcn), layout (header, route guard)
  features/       auth · onboarding · dashboard — each owns its pages, hooks, and API module
server/src
  app.js          createApp() — builds the app without listening, so tests can drive it
  config/         env (Zod-validated), database
  routes/ controllers/ services/ models/ clients/
  middleware/     requireAuth, validateRequest, authRateLimiter, errorHandler, …
  data/           curated assets, quiz options, fallback content
```

## Deployment

The client is a static build on **Vercel**, the API is a web service on **Render**, and the
database is **MongoDB Atlas**. The two halves live on different origins, which is the whole reason
the configuration below is fussy.

| Half   | Origin                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Client | [ai-crypto-advisor-client-pi.vercel.app](https://ai-crypto-advisor-client-pi.vercel.app)              |
| API    | [ai-crypto-advisor-api-qlag.onrender.com](https://ai-crypto-advisor-api-qlag.onrender.com/api/health) |

The API link goes to `/api/health`, which is the one endpoint that answers without a session — and
the one that tells you whether a slow page is a cold instance or a real fault.

| Where  | Setting                        | Value                                                |
| ------ | ------------------------------ | ---------------------------------------------------- |
| Render | Build, then start              | `npm ci` at the root, `npm start --workspace server` |
| Render | Health check path              | `/api/health`                                        |
| Render | Region                         | Frankfurt, nearest the Atlas cluster                 |
| Render | `MONGODB_URI`, `CLIENT_ORIGIN` | entered in the dashboard                             |
| Render | `JWT_SECRET`                   | generated by Render, never leaves it                 |
| Vercel | Root directory                 | `client`                                             |
| Vercel | `VITE_API_BASE_URL`            | the Render URL, no trailing slash                    |
| Atlas  | Network access                 | `0.0.0.0/0`                                          |

Three things to know before changing any of it.

**`CLIENT_ORIGIN` is the CORS allow-list, and it has to match the browser's `Origin` header
exactly.** A trailing slash there means no signed-in request ever succeeds — so `config/env.js`
strips one rather than trusting anyone to remember. Set it once Vercel has assigned the frontend
its URL, then redeploy.

**`client/vercel.json` rewrites everything to `index.html`.** This is a single-page app: the
routes exist in the browser, not on disk. Without the rewrite, `/dashboard` works when you
navigate to it and 404s when you reload it — the kind of bug that only shows up in front of
somebody else.

**Atlas is open to `0.0.0.0/0`, and that's a real tradeoff.** Render's free tier has no static
outbound address, so no narrower rule would still let the API connect. What protects the database
is the credential, which makes the connection string the one secret here that must never be
committed or pasted anywhere. A paid tier would allow an IP allow-list instead, and should use one.

A free Render instance stops after fifteen minutes of inactivity and takes about a minute to come
back. The client fires a throwaway request at `/api/health` as it loads, so the wake starts while
you're reading the sign-in page rather than after you click something.

## Development

The rules this codebase is held to are written down rather than implied. [`CLAUDE.md`](CLAUDE.md)
is a router pointing at focused documents under [`.claude/docs/`](.claude/docs): git workflow,
naming and style, backend conventions, frontend conventions, testing policy. They're short on
purpose, so each can be read in full before the work it governs.

One branch and one pull request per unit of work; merges keep their history rather than squashing.
There are no git hooks — [CI](.github/workflows/ci.yml) runs `lint`, `format:check`, `test` and
`build` on every pull request, so run `npm run format` before pushing.

### Testing

Small on purpose, with the reasoning written into
[`.claude/docs/testing-policy.md`](.claude/docs/testing-policy.md) so it can't quietly grow. Two
integration tests carry the load — the auth flow, and voting including the revote and withdrawal
paths that prove the unique index and the delete — plus a cache unit test.

Tests run against a real MongoDB in memory rather than a mocked Mongoose, because the behaviour
worth covering — a unique compound index, for instance — lives in the database, and a mock
wouldn't have it.

Everything a browser has to answer for — a vote surviving a reload, a theme choice beating a
system preference, the quiz being completable with the keyboard alone — is checked by hand
against the deployed app before the project is called done.

## Reading the stored feedback

The votes are the deliverable behind the dashboard, so they're inspectable rather than described.
Three collections in `ai-crypto-advisor`:

| Collection        | Holds                                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| `users`           | credentials and the three quiz answers, embedded on the user                |
| `feedbackvotes`   | one document per person per piece of content                                |
| `dailyaiinsights` | the paragraph written for one person on one day, so it isn't paid for twice |

A vote looks like this, and the shape is the reason it's usable as training data rather than as a
counter:

```json
{
  "userId": "…",
  "sectionType": "market_news",
  "contentId": "2026-08-11",
  "vote": "up",
  "votedOnDate": "2026-08-11",
  "createdAt": "…",
  "updatedAt": "…"
}
```

`votedOnDate` is stored even though `createdAt` exists, because changing your mind updates the
document in place — `updatedAt` moves and `createdAt` stays at the first thumb, so neither answers
which day's dashboard the opinion was about.

A **read-only database user** exists for reviewers. Its credential is not in this repository — a
connection string in public source is a public database, whatever its permissions — so it comes
with the submission instead. With it:

```bash
mongosh "mongodb+srv://<user>:<password>@<cluster>/ai-crypto-advisor" --eval "db.feedbackvotes.find().sort({ updatedAt: -1 }).limit(20)"
```

The account can read and nothing else, so there is no way to alter the data being reviewed.
Running the API against it would fail at the first write, which is the intended outcome.

For a local database of your own, `npm run check:db --workspace server` prints the host, database,
collections and document counts, and never prints the connection string.

## Known tradeoffs

Every one of these is a choice rather than an oversight, and each costs something real.

- **Atlas is open to `0.0.0.0/0`.** Render's free tier has no static outbound address, so no
  narrower rule would let the API connect at all. The credential is what protects the database,
  which makes the connection string the one secret that must never be committed.
- **A cold API takes about a minute to answer.** The client pre-warms it from the sign-in page, so
  the wait overlaps with reading rather than following a click — but it doesn't remove it.
- **The test suite is capped on purpose.** Two integration tests and a unit test, with the limit
  and its reasoning written into [the testing policy](.claude/docs/testing-policy.md) so it can't
  drift upward unnoticed. The bar is whether a test can fail for the right reason, not coverage.
- **Browser-level behaviour is verified by hand**, not by an automated suite. Keyboard access and
  vote persistence are checked against the deployed app before release — a real check, but one
  that depends on somebody remembering to make it.
- **The insight is written once per user per day** and cached until midnight. An afternoon
  development doesn't reach it, which is exactly why the prompt is built from the day's events
  rather than from figures that would be stale by then.

## Roadmap

- **Ranking driven by the collected votes.** The design is written up in
  [`docs/feedback-model-proposal.md`](docs/feedback-model-proposal.md); the votes are being stored
  against the exact content they were cast on, and nothing reads them yet.
- **News matched by meaning rather than by name.** A headline about an ETF approval matters to a
  Bitcoin holder without containing the word, and today's ranking would miss it.
- **A briefing you can look back at.** Each day's insight replaces the last one, so there's no
  history to show a returning user what changed.

## Documentation

- [`docs/decisions.md`](docs/decisions.md) — the stack, and every place the build ended up
  different from the plan it started with, including what was rejected.
- [`docs/ai-collaboration.md`](docs/ai-collaboration.md) — how this was built with AI tooling:
  what changed the result, what the tools caught, and where they were wrong.
- [`docs/feedback-model-proposal.md`](docs/feedback-model-proposal.md) — how the collected votes
  would become a ranking model: the labels, the features, evaluation, and what would go wrong.
- [`docs/assignment-brief.pdf`](docs/assignment-brief.pdf) — the original brief this was built
  against.

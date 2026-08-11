# AI Crypto Advisor

A personalized crypto dashboard. You sign up, answer three questions about how you invest, and
get a daily briefing built from your answers: prices for the assets you follow, headlines about
them, an insight written for your strategy, and one meme. Every section can be voted on, and the
votes are stored as feedback.

Built as a home assignment for Moveo. The brief is in
[`docs/assignment-brief.pdf`](docs/assignment-brief.pdf).

## Status

Work in progress, built milestone by milestone against
[the implementation plan](docs/superpowers/plans/2026-08-10-ai-crypto-advisor.md).

| Milestone                               | State |
| --------------------------------------- | ----- |
| Repository, conventions, tooling        | done  |
| Express API and middleware chain        | done  |
| MongoDB and JWT authentication          | done  |
| Sign-in, sign-up, and demo login        | done  |
| Onboarding quiz                         | done  |
| Dashboard, four sections on sample data | done  |
| Feedback voting                         | done  |
| First public deploy                     | done  |
| Live coin prices (CoinGecko)            | done  |
| News, memes, and the AI insight         | next  |

**Live: https://ai-crypto-advisor-client-pi.vercel.app** — press "Look around with a demo
account" and you are on a populated dashboard. The API is at
`https://ai-crypto-advisor-api-qlag.onrender.com`; `/api/health` answers if you want to check
it directly. Give the first request up to a minute — the free instance stops when nobody is
using it.

Coin prices are live. The other three sections still show sample data and say so — each
section is labelled with where its content came from, so the label is never a decoration.
Replacing the remaining three is the next three milestones, one at a time.

## Running it locally

Requires Node 22 or newer.

```bash
npm install
npm run dev
```

That starts the API on `http://localhost:4000` and the client on `http://localhost:5173`.

**No configuration is needed to try it.** With no `server/.env`, the API starts a throwaway
in-memory MongoDB and generates a session secret for that process, and says so in the log.
Everything works; nothing survives a restart. To keep your data, copy `server/.env.example` to
`server/.env` and fill in a real `MONGODB_URI` and `JWT_SECRET`.

| Variable            | Where  | Required      | Notes                                                  |
| ------------------- | ------ | ------------- | ------------------------------------------------------ |
| `NODE_ENV`          | server | no            | `development`, `test`, or `production`                 |
| `PORT`              | server | no            | Defaults to 4000                                       |
| `CLIENT_ORIGIN`     | server | no            | Exact browser origin, for CORS. No trailing slash      |
| `MONGODB_URI`       | server | in production | Include the database name before the `?`               |
| `JWT_SECRET`        | server | in production | At least 32 characters                                 |
| `VITE_API_BASE_URL` | client | in production | Origin of the API. Defaults to `http://localhost:4000` |
| `COINGECKO_API_KEY` | server | never         | Free demo key. Raises a per-IP allowance, nothing more |

Percent-encode special characters in the Mongo password: an unquoted `#` truncates the value
where the `.env` parser treats it as a comment.

### Other commands

```bash
npm run lint
npm test
npm run build
npm run seed:demo --workspace server    # create the demo account
npm run check:db --workspace server     # confirm the database is reachable
```

`check:db` reports the host, database, collections, and document counts, and never prints the
connection string.

## Try it without signing up

Both auth screens have a **"Look around with a demo account"** button. It signs you into a shared
account that has already answered the quiz, so you land on a populated dashboard immediately. It
issues an ordinary session through the same code path as a normal login — no shortcut around the
auth logic.

## How it fits together

```mermaid
flowchart LR
    Browser["React 19 + Vite<br/>TanStack Query"]
    API["Express 5<br/>routes → controllers → services"]
    DB[("MongoDB Atlas<br/>users · votes · insights")]
    Ext["CoinGecko · CryptoPanic<br/>Reddit · OpenRouter"]

    Browser -- "JWT in an httpOnly cookie" --> API
    API --> DB
    API -- "cached, with static fallbacks" --> Ext
```

The API is layered and the layers are not skipped. Routes map a path to a middleware chain and
one controller. Controllers read `request.userId`, call exactly one service, and send JSON — they
never touch Mongoose, validate input, or catch errors. Services hold the logic and are callable
from a script or a test because they never see `request` or `response`. Each external API gets a
thin client that only speaks HTTP; caching and fallbacks live in the service above it.

Two consequences worth knowing:

- **`errorHandler.js` is the only place an error becomes a response.** Everything else throws a
  typed error from `lib/httpErrors.js`. Unrecognized errors return a generic 500, because an
  unexpected message can leak paths or credentials.
- **`config/env.js` is the only module that reads `process.env`.** It validates at boot and exits
  with a readable list of what is wrong, rather than surfacing an `undefined` mid-request.

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
database is **MongoDB Atlas**. The two halves live on different origins, which is the whole
reason the configuration below is fussy.

| Where  | Setting                        | Value                                |
| ------ | ------------------------------ | ------------------------------------ |
| Render | Blueprint                      | [`render.yaml`](render.yaml)         |
| Render | `MONGODB_URI`, `CLIENT_ORIGIN` | entered in the dashboard             |
| Render | `JWT_SECRET`                   | generated by Render, never leaves it |
| Vercel | Root directory                 | `client`                             |
| Vercel | `VITE_API_BASE_URL`            | the Render URL, no trailing slash    |
| Atlas  | Network access                 | `0.0.0.0/0`                          |

Three things about this are worth knowing before changing any of it.

**`CLIENT_ORIGIN` is the CORS allow-list, and it has to match the browser's `Origin` header
exactly.** A trailing slash there would mean no signed-in request ever succeeds — so
`config/env.js` strips one rather than trusting anyone to remember. Set this after Vercel has
assigned the frontend its URL, and redeploy.

**`client/vercel.json` rewrites everything to `index.html`.** This is a single-page app: the
routes exist in the browser, not on disk. Without the rewrite, `/dashboard` works when you
navigate to it and 404s when you reload it — which is the kind of bug that only ever shows up
in front of somebody else.

**Atlas is open to `0.0.0.0/0`, and that is a real tradeoff.** Render's free tier has no static
outbound address, so there is no narrower rule that would still let the API connect. What
protects the database is the credential, which means the connection string is the one secret in
this project that must never be committed or pasted anywhere. A paid tier would let this be an
IP allow-list instead, and should be.

A free Render instance is stopped after fifteen minutes of inactivity and takes roughly a
minute to come back. The client sends a throwaway request to `/api/health` as it loads so the
wake starts while you are reading the sign-in page, rather than after you click something.

## Conventions

The rules this codebase is held to are written down, not implied. [`CLAUDE.md`](CLAUDE.md) is a
router that points at focused documents under [`.claude/docs/`](.claude/docs): git workflow,
naming and style, backend conventions, frontend conventions, and testing policy. They are short
on purpose, so they can be read in full before the work they govern.

## Testing

Deliberately small, and the reasoning is written into
[`.claude/docs/testing-policy.md`](.claude/docs/testing-policy.md) so it does not quietly grow.
Two integration tests carry the load — the auth flow, and voting including the revote path that
proves the unique index — plus one cache unit test and one end-to-end smoke test.

Tests run against a real MongoDB in memory rather than a mocked Mongoose. The behaviour worth
covering, such as a unique compound index, lives in the database and a mock would not have it.

## Decisions and tradeoffs

[`docs/decisions.md`](docs/decisions.md) records the choices that were not obvious, including
what was rejected and why.

## Built with AI

[`docs/ai-collaboration.md`](docs/ai-collaboration.md) is the summary the brief asks for. It was
written as the work happened rather than reconstructed at the end, and it records the human
course-corrections that changed the plan.

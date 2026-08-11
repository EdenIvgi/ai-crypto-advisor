# AI Crypto Advisor Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` or
> `superpowers:executing-plans` to implement this plan task by task. Steps use checkbox
> (`- [ ]`) syntax for tracking. **Tick each box the moment the step is done.**

**Goal:** A deployed, personalized crypto dashboard where a user signs up, answers a short
onboarding quiz, and sees four preference-driven sections (prices, news, AI insight, meme)
that they can vote on, with the votes stored as feedback data.

**Architecture:** An npm-workspaces monorepo. `client/` is a React SPA; `server/` is a
layered Express API (routes → controllers → services → models, with `clients/` wrapping
external HTTP). Auth is a JWT in an httpOnly cookie, enforced by middleware. The dashboard
is built first against mock data and deployed early; each external integration then replaces
exactly one mock, so there is always a working product.

**Tech Stack:** Node 22, Express 5, Mongoose + MongoDB Atlas, Zod, jsonwebtoken, bcrypt ·
React 19, Vite 7, Tailwind 4, shadcn/ui, TanStack Query, react-router · Vitest, Supertest,
mongodb-memory-server, Playwright.

## Global Constraints

- **JavaScript only.** No TypeScript, no `.ts`/`.tsx` files, no build-time type checking.
- **Named exports only.** No `export default`, including React components.
- **Conventions are binding:** `.claude/docs/naming-and-style.md`,
  `backend-conventions.md`, `frontend-conventions.md`, `testing-policy.md`,
  `git-workflow.md`. Read the matching one before acting.
- **Test budget is capped** at the list in `testing-policy.md`. Do not add tests beyond it.
- **One branch and one pull request per milestone.** Never commit to `main`.
- **Free tiers only.** No paid APIs, no paid hosting.
- **Every dashboard service returns `{ ...data, isFallback: boolean }`** and never throws.

## Progress

| Milestone                             | Status |
| ------------------------------------- | ------ |
| M0 — Workspace and conventions        | done   |
| M1 — Scaffold and middleware skeleton | done   |
| M2 — Database and JWT auth            | done   |
| M3 — Frontend auth and Demo Mode      | done   |
| M4 — Onboarding quiz                  | done   |
| M5 — Dashboard UI on mock data        | done   |
| M6 — Feedback voting                  | done   |
| M7 — First deploy                     | done   |
| M8 — Coin prices (CoinGecko)          | done   |
| M9 — Market news (publisher RSS)      | done   |
| M10 — Crypto meme (static, in-repo)   | done   |
| M11 — AI insight (Hugging Face)       | done   |
| M12 — Polish and smoke test           | next   |
| M13 — Docs and handover               | todo   |

---

### Task M0: Workspace and conventions

**Files:**

- Create: `CLAUDE.md`, `.claude/docs/{git-workflow,naming-and-style,backend-conventions,frontend-conventions,testing-policy}.md`
- Create: `.claude/hooks/remindGitWorkflow.js`, `.claude/settings.json`
- Create: `.gitignore`, `.gitattributes`, `docs/ai-collaboration.md`

**Produces:** The convention router every later task reads from.

- [x] **Step 1:** Write `CLAUDE.md` as a short router mapping "about to do X" to a doc.
- [x] **Step 2:** Write the five convention docs, each single-purpose and short.
- [x] **Step 3:** Write the PreToolUse hook that blocks the first history-changing git
      command per session and points at `git-workflow.md`.
- [x] **Step 4:** Verify the hook: blocks once (exit 2), allows on re-run, ignores `npm test`.
- [x] **Step 5:** `git init -b main`, add `.gitignore` and `.gitattributes`, commit.
- [x] **Step 6:** `gh repo create ai-crypto-advisor --public --source=. --push`.
- [x] **Step 7:** Install `superpowers` and `frontend-design` at project scope; commit.

---

### Task M1: Scaffold and middleware skeleton

**Files:**

- Create: `package.json` (workspaces), `eslint.config.js`, `.prettierrc.json`, `.husky/pre-commit`, `.github/workflows/ci.yml`
- Create: `server/src/{app.js,index.js}`, `server/src/config/env.js`, `server/src/lib/httpErrors.js`
- Create: `server/src/middleware/{requestLogger,notFoundHandler,errorHandler}.js`
- Create: `server/src/routes/healthRoutes.js`
- Create: `client/src/{main.jsx,App.jsx,index.css}`, `client/src/lib/{apiClient,queryClient,utils}.js`

**Produces:** `createApp()`, `env`, the `ApiError` family, `requestApi(path, options)`,
`queryClient`, `cn()`. Every later task builds on these exact names.

- [x] **Step 1:** Root `package.json` with `workspaces: ["client", "server"]` and scripts
      `dev`, `lint`, `format:check`, `test`, `build`.
- [x] **Step 2:** `server/src/config/env.js` — Zod-validated `NODE_ENV`, `PORT`,
      `CLIENT_ORIGIN`; exits with a readable message when invalid.
- [x] **Step 3:** `server/src/lib/httpErrors.js` — `ApiError` base plus `BadRequestError`,
      `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`.
- [x] **Step 4:** The three global middleware, then `createApp()` wiring the chain:
      helmet → cors(credentials) → json → cookieParser → requestLogger → routes →
      notFoundHandler → errorHandler, with `trust proxy` set for Render.
- [x] **Step 5:** `GET /api/health` returning `{ status, uptimeSeconds }`.
- [x] **Step 6:** Vite + React 19 + Tailwind 4 + shadcn/ui (`components.json` with
      `"tsx": false`), `apiClient.js` with `credentials: 'include'`, `queryClient.js`.
- [x] **Step 7:** ESLint flat config, Prettier, Husky + lint-staged, GitHub Actions CI.
- [x] **Step 8:** Verify: `npm run lint`, `npm run format:check`, `npm test` all clean.
- [x] **Step 9:** Verify the API: health returns 200 JSON; an unknown route returns
      `404 {"error":{"message":"...","code":"NOT_FOUND"}}` through the error handler.
- [x] **Step 10:** Verify the client in a browser: renders, reaches the API cross-origin
      with no console errors, Tailwind tokens applied.
- [x] **Step 11:** Verify shadcn: `npx shadcn@latest add button --yes` creates
      `src/components/ui/button.jsx`.
- [x] **Step 12:** Commit and open the pull request.

**Decision recorded:** Express 5 forwards rejected promises from handlers to the error
handler automatically, so the planned `asyncHandler` wrapper is unnecessary and was dropped.
`backend-conventions.md` was updated to match.

**Reversed later — Husky and lint-staged were removed from Step 7.** The pre-commit hook only
ran `eslint --fix` and `prettier --write` over staged files, and CI already runs `lint`,
`format:check`, `test` and `build` on every pull request, so nothing unformatted can merge
either way. What the hook cost was a `prepare` script that runs on every `npm install`,
including on a production build where `devDependencies` are skipped and the `husky` binary is
therefore absent — the exact cause of the first failed deploy in M7. Formatting now runs from
`npm run format` locally and is enforced at the pull request instead of at the commit.

---

### Task M2: Database and JWT auth

**Files:**

- Create: `server/src/config/database.js`, `server/src/models/User.js`
- Create: `server/src/services/authService.js`, `server/src/controllers/authController.js`
- Create: `server/src/routes/authRoutes.js`
- Create: `server/src/middleware/{requireAuth,validateRequest,authRateLimiter}.js`
- Create: `server/src/tests/authFlow.test.js`, `server/vitest.config.js`
- Modify: `server/src/app.js` (mount `authRoutes`), `server/src/config/env.js` (add
  `MONGODB_URI`, `JWT_SECRET`), `server/src/index.js` (connect before listening)

**Interfaces:**

- Consumes: `createApp()`, `env`, `ApiError` family from M1.
- Produces:
  - `connectToDatabase(): Promise<void>`
  - `User` model with `{ email, name, passwordHash, preferences? }`
  - `registerUser({ email, name, password }): Promise<userDto>`
  - `authenticateUser({ email, password }): Promise<userDto>`
  - `issueAccessToken(userId): string`, `verifyAccessToken(token): { userId }`
  - `setAuthCookie(response, token)`, `clearAuthCookie(response)`
  - `toUserDto(userDocument): { id, email, name, hasCompletedOnboarding, preferences? }`
  - `requireAuth` middleware setting `request.userId`
  - `validateRequest({ body, query, params })` middleware factory

- [x] **Step 1:** Add `MONGODB_URI` and `JWT_SECRET` (min 32 chars) to the env schema and to
      `server/.env.example`. Both are required in production and optional in development.
- [ ] **Step 1b:** Create the free MongoDB Atlas cluster and database user, and put the URI
      in `server/.env`. **Deferred to M7**, where the deploy needs it. Creating the account
      requires a human — the agent cannot and should not sign up for services.
- [x] **Step 2:** `config/database.js` — `connectToDatabase()` wrapping
      `mongoose.connect(env.MONGODB_URI)`, logging success and exiting on failure. Falls back
      to an in-memory MongoDB in development when no URI is set, so a fresh clone runs with
      zero setup.
- [x] **Step 3:** `models/User.js` — schema with `email` (lowercase, trimmed, unique
      index), `name`, `passwordHash` (`select: false`), embedded optional `preferences`
      (`watchedAssetIds: [String]`, `investorType` enum, `contentSections: [String]` enum),
      `timestamps: true`.
- [x] **Step 4:** `services/authService.js` — bcrypt hashing (cost 10), JWT sign/verify with
      a payload of only `{ userId }` and `expiresIn: '7d'`, and the two cookie helpers.
      Cookie options: `httpOnly: true`, `sameSite: isProduction ? 'none' : 'lax'`,
      `secure: isProduction`, `maxAge: 7 days`, no `domain`.
- [x] **Step 5:** `middleware/validateRequest.js` — factory that runs Zod schemas against
      `body`/`query`/`params` and throws `BadRequestError` with `fieldErrors` on failure.
- [x] **Step 6:** `middleware/requireAuth.js` — reads `request.cookies.token`, calls
      `verifyAccessToken`, sets `request.userId`, throws `UnauthorizedError` otherwise.
- [x] **Step 7:** `middleware/authRateLimiter.js` — `express-rate-limit`, 10 requests per
      15 minutes per IP, applied only to login and register.
- [x] **Step 8:** `controllers/authController.js` + `routes/authRoutes.js` for
      `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`,
      `GET /api/auth/me`. Login and register both set the cookie and return `{ user }`.
      A wrong email and a wrong password must produce the identical 401 message.
- [x] **Step 9:** Write `server/src/tests/authFlow.test.js` (integration test #1 of the
      capped suite) using `mongodb-memory-server` and Supertest against `createApp()`:
      register succeeds; duplicate email returns 409; wrong password returns 401;
      `GET /me` with the cookie returns the user; `GET /me` without it returns 401.
- [x] **Step 10:** Run `npm test` — expect it to fail before the implementation is
      complete, then pass.
- [x] **Step 11:** Verify by hand: register, then confirm the `token` cookie is `HttpOnly`
      and the `passwordHash` never appears in any response body.
- [x] **Step 12:** `npm run lint && npm run format:check && npm test`, commit, open the PR.

---

### Task M3: Frontend auth and Demo Mode

**Files:**

- Create: `client/src/features/auth/{authApi.js,useAuth.js,LoginPage.jsx,SignupPage.jsx}`
- Create: `client/src/components/layout/{AppHeader.jsx,ProtectedRoute.jsx}`
- Create: `server/scripts/seedDemoUser.js`
- Modify: `client/src/App.jsx` (replace the M1 scaffold screen with the router),
  `server/src/{controllers/authController.js,routes/authRoutes.js}` (add the demo endpoint)

**Interfaces:**

- Consumes: `requestApi`, `queryClient` (M1); the auth endpoints and `toUserDto` (M2).
- Produces: `useCurrentUser()`, `useLogin()`, `useSignup()`, `useLogout()`,
  `useDemoLogin()`, `ProtectedRoute`, and `POST /api/auth/demo`.

- [x] **Step 1:** `authApi.js` — thin wrappers over `requestApi` for register, login,
      logout, demo, and me.
- [x] **Step 2:** `useAuth.js` — `useCurrentUser` query on key `['auth', 'me']` (treat 401
      as "signed out", not an error), plus the four mutations, each invalidating that key.
- [x] **Step 3:** `LoginPage.jsx` and `SignupPage.jsx` using shadcn form primitives, with
      inline field errors driven by `error.fieldErrors` from the API.
- [x] **Step 4:** `ProtectedRoute.jsx` — while loading show a spinner; if signed out
      redirect to `/login`; if signed in without preferences redirect to `/onboarding`.
- [x] **Step 5:** `App.jsx` — react-router with `/login`, `/signup`, `/onboarding`,
      `/dashboard`, and a catch-all redirect.
- [x] **Step 6:** `POST /api/auth/demo` — finds or creates the demo user and issues the
      same cookie as a normal login. No special-casing anywhere else in the auth path.
- [x] **Step 7:** `server/scripts/seedDemoUser.js` — idempotent upsert of
      `demo@aicryptoadvisor.app` with preferences already filled in; add
      `npm run seed:demo` to `server/package.json`.
- [x] **Step 8:** Add the "Try Demo Account" button to `LoginPage.jsx`, visually secondary
      to the real sign-in.
- [x] **Step 9:** Verify in a browser: sign up lands on `/onboarding`; a refresh keeps the
      session; logout returns to `/login`; the demo button skips straight past onboarding.
- [x] **Step 10:** Lint, format, test, commit, open the PR.

---

### Task M4: Onboarding quiz

**Files:**

- Create: `server/src/data/supportedAssets.js`, `server/src/services/preferencesService.js`,
  `server/src/controllers/preferencesController.js`, `server/src/routes/preferencesRoutes.js`
- Create: `client/src/features/onboarding/{preferencesApi.js,useOnboarding.js,toggleSelection.js,OnboardingPage.jsx}`,
  `client/src/features/onboarding/components/SelectableOption.jsx` and
  `client/src/features/onboarding/steps/{AssetSelectionStep,InvestorTypeStep,ContentPreferencesStep}.jsx`

**Interfaces:**

- Consumes: `requireAuth`, `validateRequest`, `User` (M2); `ProtectedRoute` (M3).
- Produces: `GET/PUT /api/preferences`, `GET /api/preferences/options`,
  `useQuizOptions()`, and `useSavePreferences()`.

- [x] **Step 1:** `supportedAssets.js` — a curated list of roughly 12 assets as
      `{ id, symbol, name }`, where `id` is the CoinGecko id the price service will use.
      Every id verified against the live CoinGecko API, since several are not what the
      symbol suggests (XRP is `ripple`, AVAX is `avalanche-2`).
- [x] **Step 2:** `preferencesService.js` — `getQuizOptions()`, `loadPreferences(userId)`
      and `savePreferences(userId, preferences)`.
- [x] **Step 3:** Zod schema for the preferences body: at least one asset, at most eight, a
      valid `investorType`, at least one content section.
- [x] **Step 4:** Controllers and routes, chained
      `requireAuth → validateRequest → controller`.
- [ ] **Step 5:** `loadCurrentUser.js` and `requireOnboarding.js`. **Moved to M5**, which
      creates the dashboard routes that use them. Merging middleware wired to nothing would
      have put dead code on `main`.
- [x] **Step 6:** The three quiz steps as separate components, each fully
      keyboard-operable, with a progress indicator and a back button.
- [x] **Step 7:** `OnboardingPage.jsx` — holds the draft in local state, submits once at
      the end, then replaces the cached user and navigates to `/dashboard`.
- [x] **Step 8:** Verify: completing the quiz makes `GET /api/auth/me` report
      `hasCompletedOnboarding: true`; revisiting `/onboarding` redirects to the dashboard.
- [x] **Step 9:** Lint, format, test, commit, open the PR.

**Bug found and fixed during verification:** three rapid clicks on the asset step registered
only one selection. Each handler computed the next array from the `answers` value captured in
its own render, so clicks landing before a re-render all read the same stale selection and the
last one overwrote the rest. Fixed by updating from the previous state
(`setAnswers(current => …)`) via a shared `toggleSelection` helper.

---

### Task M5: Dashboard UI on mock data

**Use the `frontend-design` skill for this task.** "Clean UX" is an explicit grading
criterion, and this is the screen that gets graded.

**Files:**

- Create: `server/src/data/mockDashboard.js`, `server/src/routes/dashboardRoutes.js`,
  `server/src/controllers/dashboardController.js`
- Create: `server/src/services/{pricesService,newsService,aiInsightService,memeService}.js`
  (added to the plan during the task — see the note below), `server/src/lib/dateKeys.js`
- Create: `server/src/middleware/{loadCurrentUser,requireOnboarding}.js` (moved here from M4,
  because these are the first routes that use them)
- Create: `client/src/features/dashboard/{dashboardApi.js,useDashboard.js,dashboardFormatters.js,DashboardPage.jsx}`
- Create: `client/src/features/dashboard/components/DashboardSectionCard.jsx`
- Create: `client/src/features/dashboard/sections/{CoinPricesSection,MarketNewsSection,AiInsightSection,CryptoMemeSection}.jsx`
- Create: `client/public/memes/sample-buying-the-dip.svg`

**Interfaces:**

- Consumes: `requireAuth`, `loadCurrentUser`, `requireOnboarding` (M4).
- Produces: `GET /api/dashboard/{prices,news,insight,meme}`, each returning its section
  payload plus `isFallback`. **These response shapes are frozen here** — M8 to M11 swap the
  data source behind them without changing the contract.
  - prices: `{ contentId, coins: [{ id, symbol, name, priceUsd, change24hPercent }], isFallback }`
  - news: `{ contentId, articles: [{ id, title, url, source, publishedAt }], isFallback }`
  - insight: `{ contentId, insight: { id, text, date }, isFallback }`
  - meme: `{ contentId, meme: { id, title, imageUrl, sourceUrl }, isFallback }`

  **`contentId` was added in M6**, which is when it became clear a vote needs to name what it
  was cast on. Adding a field before any integration exists costs nothing; the alternative was
  the client inventing an identity for content the server served, which is worse. M8 to M11
  still have to produce this exact shape.

- [x] **Step 1:** `mockDashboard.js` — realistic fixed data for all four sections, shaped
      exactly as the frozen contract above.
- [x] **Step 2:** Dashboard controller and routes serving the mocks, filtered by the
      user's `watchedAssetIds` where that applies.
- [x] **Step 3:** `DashboardSectionCard.jsx` — the shared shell: title, optional fallback
      badge, skeleton while loading, inline error with a retry button, and a slot for the
      vote buttons added in M6.
- [x] **Step 4:** The four section components, each with its own `useQuery` so one failure
      cannot take down the others.
- [x] **Step 5:** `DashboardPage.jsx` — a responsive layout rendering only the sections the
      user selected during onboarding. No placeholder card for a section they skipped.
- [x] **Step 6:** Check both light and dark themes, and widths from 375px to 1440px.
- [x] **Step 7:** Verify in a browser: the dashboard looks finished; deselecting a section
      in preferences removes it.
- [x] **Step 8:** Lint, format, test, commit, open the PR.

**Deviation recorded — the four services were created here rather than in M8 to M11.** The
plan had the controller read the mock directly and each later milestone create its service
and edit the controller. Writing it that way meant the controller changing four more times,
which is exactly the churn freezing the contract was supposed to prevent. Instead
`loadCoinPrices`, `loadMarketNews`, `loadDailyInsight` and `loadDailyMeme` exist now with
mock bodies, and M8 to M11 replace one body each and touch nothing else. Their file entries
move from those tasks to this one.

**Layout decision:** the sections are laid out with flex bases, not grid columns. A grid
gives a section a fixed track, so a user who selected the insight but not the meme would get
a half-width card with a hole beside it. With `grow` and a basis, the pair shares a row when
both are present and a lone one expands to fill it — no conditional span logic, and every
combination of the four answers produces a layout that looks deliberate.

---

### Task M6: Feedback voting

**Files:**

- Create: `server/src/models/FeedbackVote.js`, `server/src/services/feedbackService.js`,
  `server/src/controllers/feedbackController.js`, `server/src/routes/feedbackRoutes.js`
- Create: `server/src/tests/feedbackVote.test.js`
- Create: `client/src/features/dashboard/components/FeedbackVoteButtons.jsx`,
  `client/src/features/dashboard/useFeedbackVote.js`
- Modify: the four section components (mount the vote buttons)

**Interfaces:**

- Consumes: `requireAuth` (M2); `DashboardSectionCard` (M5).
- Produces: `POST /api/feedback`, `GET /api/feedback/mine`,
  `submitVote({ userId, sectionType, contentId, vote })`, `useFeedbackVote(sectionType)`.

- [x] **Step 1:** `FeedbackVote.js` — `{ userId, sectionType, contentId, vote, votedOnDate }`
      with a unique compound index on `{ userId, sectionType, contentId }`.
- [x] **Step 2:** `feedbackService.js` — `submitVote` as an upsert keyed by that index, so
      changing a vote updates the existing document instead of adding a second one.
- [x] **Step 3:** Controller and routes with Zod validation on the body.
- [x] **Step 4:** Write `server/src/tests/feedbackVote.test.js` (integration test #2 of the
      capped suite): vote up, vote down on the same content, assert exactly one document
      exists and it now reads `down`, then assert `GET /api/feedback/mine` returns it.
- [x] **Step 5:** Run `npm test` — expect failure first, then pass.
- [x] **Step 6:** `useFeedbackVote.js` — mutation with an optimistic update and rollback in
      `onError`.
- [x] **Step 7:** `FeedbackVoteButtons.jsx` — two icon buttons, each with an `aria-label`,
      showing the current vote state.
- [x] **Step 8:** Verify: a vote survives a page refresh; changing a vote does not create a
      duplicate in the database.
- [x] **Step 9:** Lint, format, test, commit, open the PR.

**The test as the plan specified it did not test what it claimed.** Step 4 describes voting
up, then down, then asserting one document — and that passes on the upsert's own semantics
with the unique index removed, which was confirmed by removing it. Two assertions were added
that do fail without it: a duplicate written straight to the model, which the database has to
reject, and two votes fired concurrently, which have to leave one row behind.

**Consequence, added to Step 2:** once the index is real, a race between two clicks makes one
of them fail with a duplicate key error. `submitVote` catches exactly that code and repeats
itself, so the constraint cannot turn a working feature into a 500.

**Files added beyond the plan:** `server/src/data/feedbackOptions.js` (the two vote values,
shared by the Mongoose enum and the Zod schema) and `client/src/features/dashboard/feedbackApi.js`.

---

### Task M7: First deploy

**Files:**

- Create: `render.yaml` (or the equivalent dashboard configuration), `client/vercel.json`
- Modify: `README.md` (deployed URLs), `client/.env.example`

- [x] **Step 1:** MongoDB Atlas — allow `0.0.0.0/0` (Render's free tier has no static
      egress IP) and note the tradeoff in the README.
- [x] **Step 2:** Render web service from `server/`, health check path `/api/health`,
      environment variables `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`,
      `CLIENT_ORIGIN` (the Vercel URL). Done as a `render.yaml` blueprint rather than by
      hand, so the configuration is in the repository where a reviewer can read it.
- [x] **Step 3:** Vercel project from `client/`, environment variable
      `VITE_API_BASE_URL` set to the Render URL.
- [x] **Step 4:** Set `CLIENT_ORIGIN` on Render to the final Vercel origin — exact, no
      trailing slash — and redeploy.
- [x] **Step 5:** Run `npm run seed:demo` against the production database. Nothing to do:
      development already points at the same Atlas cluster, so the demo account was there.
- [x] **Step 6:** **Verify on the public URL from a session with no cookies:** demo login
      works, the cookie is set with `SameSite=None; Secure`, a refresh keeps the session.
      This is the milestone's real purpose — cross-site cookies fail only in production.
- [x] **Step 7:** Add a health ping on client load so a cold Render instance starts waking
      before the user submits anything.
- [x] **Step 8:** Commit and open the PR.

**Two failures, both in configuration rather than code, and both worth recording.**

1. The build died at install with `husky: not found`, exit 127. `NODE_ENV=production` makes
   npm omit `devDependencies`, but the root `prepare` script runs anyway. Fixed with
   `husky || exit 0`, and reproduced first in a clean clone under the same two conditions
   rather than guessed at, because a wrong guess costs a deploy.
2. The app then died at boot on `CLIENT_ORIGIN: Invalid URL` — a Vercel domain copied from
   its dashboard, which shows the host without a scheme. Checking the other shapes someone
   might paste turned out to matter more than the failure itself: a trailing slash, a stray
   path and a leading space all **passed** validation and would then have matched no `Origin`
   header at all, making every signed-in request a silent 401. Anything that parses is now
   reduced to its origin; a missing scheme is rejected with the fix in the message.

**Live URLs:** client `https://ai-crypto-advisor-client-pi.vercel.app`, API
`https://ai-crypto-advisor-api-qlag.onrender.com`.

---

### Task M8: Coin prices (CoinGecko)

**Files:**

- Create: `server/src/lib/inMemoryCache.js`, `server/src/lib/inMemoryCache.test.js`,
  `server/src/clients/coinGeckoClient.js`, `server/src/services/pricesService.js`
- Modify: `server/src/controllers/dashboardController.js` (prices only)

**Interfaces:**

- Consumes: the frozen prices contract from M5.
- Produces: `createTtlCache({ ttlMs })` with `getOrFetch(key, fetcher)` and a stale fallback;
  `fetchCoinMarkets(assetIds)`; `loadCoinPrices(watchedAssetIds)`.

- [x] **Step 1:** `inMemoryCache.js` — a `Map` of `{ value, expiresAtMs }` with
      `getOrFetch`, keeping the last good value so it can be served stale on error.
- [x] **Step 2:** Write `inMemoryCache.test.js` (the one unit test in the capped suite):
      returns the cached value inside the TTL, refetches after it expires. Three more cases
      were added and `testing-policy.md` updated to match — see the note below.
- [x] **Step 3:** `coinGeckoClient.js` — one request to
      `/coins/markets?vs_currency=usd&ids=<joined>`, never one request per coin. Parse the
      response with a Zod schema and map it to the frozen shape.
- [x] **Step 4:** `pricesService.js` — 60-second TTL keyed by the sorted asset ids; on
      failure serve the stale value, else the M5 mock, with `isFallback: true`.
- [x] **Step 5:** Point the prices endpoint at the service instead of the mock. **Nothing to
      do:** M5 created `pricesService.loadCoinPrices` with a mock body precisely so that this
      milestone would replace one function body and touch neither the controller nor the
      client. That decision paid here.
- [x] **Step 6:** Verify: real prices for the selected assets; a second request within
      60 seconds does not hit CoinGecko; blocking the network still renders the section.
- [x] **Step 7:** Lint, format, test, commit, open the PR, deploy.

**Test scope widened, deliberately.** The two cases the plan named describe any cache. They
do not touch the behaviour this cache was written for — serving an expired value when the
source fails. After M6, where a test passed with the constraint it claimed to prove removed,
covering only the easy half was not defensible. Three cases added: stale-on-failure, rethrow
when there is nothing to fall back on, and keys kept apart.

**`COINGECKO_API_KEY` added as optional**, which the plan did not call for. CoinGecko's public
tier needs no key, but the allowance is per IP address and Render's free tier shares one with
strangers. The key changes nothing about how the code runs and everything about how often it
is turned away. Optional in every environment: a fresh clone must run without signing up for
anything.

**Extra care that turned out to be needed:** `price_change_percentage_24h` is nullable in
CoinGecko's response. It becomes zero rather than dropping the asset, and the interface now
paints exactly zero in a neutral colour rather than green — otherwise both a flat day and a
missing figure would have read as a gain.

---

### Task M9: Market news (publisher RSS)

**Files:**

- Create: `server/src/clients/newsFeedClient.js`
- Modify: `server/src/services/newsService.js`, dashboard controller

- [x] **Step 1:** ~~Add `CRYPTOPANIC_API_KEY` as optional in the env schema.~~ **Dropped.**
      There is no key. RSS needs no account, so no environment variable was added — dead
      configuration is worse than none.
- [x] **Step 2:** ~~`fallbackNews.json` — 12 to 15 hand-picked articles.~~ **Dropped.**
      `MOCK_NEWS_ARTICLES` in `data/mockDashboard.js` already holds sample headlines with
      working URLs and is what M8 reused for prices. A second file in a second format would
      have duplicated it.
- [x] **Step 3:** ~~`cryptoPanicClient.js`.~~ `newsFeedClient.js` — four publisher feeds read
      in parallel, Zod-parsed, merged newest first. Fails only when all four fail.
- [x] **Step 4:** `newsService.js` — 10-minute TTL, not 5. The feeds are identical for every
      reader, so the cache holds **one** entry and personalisation happens after it.
- [x] **Step 5:** No client change was needed. The M5 contract held, and `DashboardSectionCard`
      already renders the source label from `isFallback`; only its wording changed, to
      "Live headlines", because this section merges four publishers rather than naming one.
- [x] **Step 6:** Both paths verified — the fallback by running with the feeds unreachable,
      the live path against 108 real articles, in the browser as well as at the endpoint.
- [x] **Step 7:** Lint, format, test, commit, open the PR, deploy.

**Deviation, recorded in full in `docs/decisions.md`:** CryptoPanic's free plan was discontinued
on 1 April 2026, and the brief requires free public APIs, so the suggested source became
non-compliant. The plan's per-asset filtering requirement was also not in the brief — this
assistant invented it — and became ranking instead.

---

### Task M10: Crypto meme (static, drawn in-repo)

**Files:**

- Create: `server/src/data/dailyMemes.js`, six SVGs in `client/public/memes/`
- Modify: `server/src/services/memeService.js`, `CryptoMemeSection.jsx`

- [x] **Step 1:** ~~`redditMemeClient.js`.~~ **Dropped.** Reddit answered a plain server
      request with 403 during M9's research — it blocks non-browser clients and does so
      harder from cloud ranges. The brief allows "Reddit scraping **or static JSON**", and a
      live integration whose normal state is the fallback is worse than an honest static one.
- [x] **Step 2:** ~~Filter posts to image extensions.~~ Not applicable.
- [x] **Step 3:** ~~`fallbackMemes.json` — 12 to 15 stable image URLs.~~ Seven original SVGs
      in `client/public/memes/` instead. A hotlinked URL breaks the day its host expires it,
      which defeats going static; and copying Reddit uploads would put other people's content,
      with unclear rights, into a public repository.
- [x] **Step 4:** `memeService.js` — no cache needed, there is nothing to fetch. Rotation is
      by **whole days since the epoch**, not day-of-year: day-of-year restarts at 1 while a
      seven-item list is part-way through and would jump the rotation backwards each January.
- [x] **Step 5:** Verified — the endpoint, the image serving, the rotation across sixteen
      consecutive days and across New Year, every file present on disk, and each SVG rendered
      in a browser. The caption is the alt text, because the caption is the joke.
- [x] **Step 6:** Lint, format, test, commit, open the PR, deploy.

**Deviation, recorded in full in `docs/decisions.md`:** this is the one section with no third
party behind it, so it is also the one whose `isFallback` is a constant `false`.

---

### Task M11: AI insight (OpenRouter)

**Files:**

- Create: `server/src/models/DailyAiInsight.js`, `server/src/clients/openRouterClient.js`,
  `server/src/services/aiInsightService.js`
- Modify: `server/src/config/env.js` (optional `OPENROUTER_API_KEY`), dashboard controller

**Interfaces:**

- Consumes: `loadCoinPrices` (M8) for grounding the prompt.
- Produces: `generateInsight({ investorType, watchedAssetIds, coins })`,
  `loadDailyInsight(userId)`.

- [x] **Step 1:** `DailyAiInsight.js` — exactly `{ userId, insightDate, insightText }` with
      a unique compound index on `{ userId, insightDate }`. Nothing else: unused fields were
      deliberately cut.
- [x] **Step 2:** ~~`openRouterClient.js`.~~ `huggingFaceClient.js` — the human chose Hugging
      Face, which the brief offers as an alternative. The ordered chain survived the change and
      earned itself twice over: `api-inference.huggingface.co` is gone entirely, and **no model
      on the current router is free** — all 205 live provider entries bill per token against a
      monthly credit. At $0.000014 to $0.000063 an insight, the chain is ordered by quality.
- [x] **Step 3:** Prompt built from the investor type, the watched assets, today's real prices
      **and today's headlines**, asking for three sentences. Took three rounds against real
      output; the failures are recorded in `docs/decisions.md` because each was instructive.
- [x] **Step 4:** `aiInsightService.js` — today's document first, otherwise generate, store,
      return. One model call per person per day, verified at 2s cold and 0s warm.
- [x] **Step 5:** Composed from live prices as the last resort — and `MOCK_INSIGHTS_BY_INVESTOR_TYPE`
      **deleted**, because a fixed paragraph about a market that never happened is a worse
      answer than a plain sentence about the real one.
- [x] **Step 6:** Verified: cold call generates, reload serves from Mongo with identical text,
      the unique index holds, and the no-key path composes from real figures. Also verified with
      no database at all, which is how two swallowing bugs were found.
- [x] **Step 7:** Lint, format, test, commit, open the PR, deploy.

**Deviations, recorded in full in `docs/decisions.md`:** Hugging Face rather than OpenRouter, at
the human's choice; no free models exist on it, which turned out not to matter; and the model is
explicitly forbidden to recommend, predict or instruct, with an "Observations, not advice" line
on the card.

---

### Task M12: Polish and smoke test

**Use the `frontend-design` skill for the visual pass.**

**Files:**

- Create: `e2e/smoke.spec.js`, `playwright.config.js`
- Modify: section components, `DashboardSectionCard`, `AppHeader`

- [ ] **Step 1:** Loading skeletons that match the real content's shape, so the layout does
      not jump when data arrives.
- [ ] **Step 2:** Empty and error states with a retry action, written in plain language.
- [ ] **Step 3:** A dark mode toggle in `AppHeader`, persisted to `localStorage`.
- [ ] **Step 4:** Responsive pass at 375, 768, and 1440 pixels.
- [ ] **Step 5:** Accessibility pass: `aria-label` on every icon-only button, visible focus
      rings, the whole quiz operable from the keyboard.
- [ ] **Step 6:** `e2e/smoke.spec.js` — demo login, all selected sections render, cast a
      vote, reload and confirm the vote persisted.
- [ ] **Step 7:** Run `npx playwright test` against the local stack and get it green.
- [ ] **Step 8:** Lint, format, test, commit, open the PR.

---

### Task M13: Docs and handover

**Files:**

- Modify: `README.md`, `docs/ai-collaboration.md`
- Create: `docs/feedback-model-proposal.md`

- [x] **Step 1:** README — what it is, local setup, an environment variable table, a Mermaid
      architecture diagram, the demo account, and pointers to the conventions and decisions.
      **Written early, after M4.** Scheduling it here was a planning error: a public
      repository should never have sat for days with no explanation of what it is.
- [ ] **Step 1b:** Add to the README what only exists after deploying — the public URLs and a
      screenshot of the finished dashboard.
- [ ] **Step 2:** README — a short "known tradeoffs" section: the Atlas `0.0.0.0/0` rule,
      Render cold starts, and the deliberately capped test suite with the reasoning.
      (`docs/decisions.md`, added after M4, already covers the reasoning; this step is the
      deployment-specific part.)
- [ ] **Step 3:** `docs/feedback-model-proposal.md` (the assignment's bonus, design only):
      what the votes give you as implicit labels, the features available per event
      (`investorType`, `sectionType`, content source, time of day), a cold-start-safe
      ranking approach, how to evaluate it offline, and the fairness and feedback-loop
      risks of training on self-selected data.
- [x] **Step 4:** ~~Finish `docs/ai-collaboration.md` with an entry per milestone.~~ **Rewritten
      instead.** The brief asks for a summary of interactions, and a per-milestone journal had
      grown past the point where the useful parts could be found. It now groups interactions by
      what they did rather than by when they happened.
- [ ] **Step 5:** Create a read-only Atlas database user for the reviewers and document how
      to connect.
- [ ] **Step 6:** Final check: clone into an empty directory and follow the README start to
      finish, with nothing but what it says.
- [ ] **Step 7:** Commit, open the PR, and merge to `main`.

---

### Unplanned: editable preferences and withdrawable votes

Requested after M11, and not in the original plan. Two independent features in one branch,
because the first one needs the second one's service function to clean up after itself.

- [x] **Step 1:** `validateRequest` — replace assignment with `defineProperty`. Its documented
      `query` support had never worked, because Express 5 exposes `req.query` through a getter
      with no setter. Proven broken and then proven fixed with a throwaway Express app.
- [x] **Step 2:** `DELETE /api/feedback` with the target in the query string. `voteTargetSchema`
      is shared with the POST body schema so the two cannot disagree. `removeVote` deletes the
      row and resolves whether or not one existed; the controller answers 204 either way.
- [x] **Step 3:** `forgetTodaysInsight` in `aiInsightService`, called from `savePreferences` only
      when the investing style or the asset set actually changed — the prompt is built from those
      and nothing else, so a section toggle is not worth a model call. The thumb on the discarded
      paragraph is withdrawn with it.
- [x] **Step 4:** The dashboard thumbs toggle off. One mutation for both directions, with the
      optimistic update handling removal as well as replacement.
- [x] **Step 5:** `features/onboarding/` → `features/preferences/`, `steps/` → `questions/`, and
      `SettingsPage.jsx` — the same three questions at once, prefilled, behind one Save button.
      Reached from the profile link in the header; routed at `/settings` behind the onboarding
      guard.
- [x] **Step 6:** One test case for withdrawal, approved against the capped-suite policy.
      Confirmed to fail with the delete stubbed out.
- [x] **Step 7:** Verified end to end against the dev API and the real database: withdrawal
      removes only its own row, a bad section in the query string is a 400, a section change
      leaves the insight byte-identical, and a style change rewrites it and drops its vote. The
      demo account was restored to its starting state afterwards.
- [x] **Step 8:** Browser pass over both features, on the demo account: a thumb pressed, kept
      across a reload, pressed again to withdraw it, and still withdrawn after another reload;
      the settings screen prefilled, "Discard changes" appearing only once something changed, and
      Save landing on a dashboard whose insight had been rewritten from "For a long-term holder"
      to "For a day trader" off the same headline. The demo account was put back afterwards.

      Blocked for a while on a diagnosis of mine that was wrong. The API was binding 5173 and
          fighting Vite for it, and I read that as `PORT=5173` in `server/.env` — a file I cannot
          read — and asked for it to be changed. It already said 4000. The real cause was the
          `full-stack` entry I had just added to `.claude/launch.json`: the harness injects that
          entry's `port` into the process environment, and `--env-file-if-exists` does not override a
          variable that is already set, so the declared 5173 beat the file's 4000. Confirmed by
          declaring 4321 and watching the API bind 4321. Fixed by declaring the API on 4000 and
          leaving 5173 to the client, which is two entries rather than one.

- [x] **Step 9:** `docs/decisions.md`, the testing policy, the README, and this file.
- [ ] **Step 10:** Commit, open the PR, and merge once CI is green.

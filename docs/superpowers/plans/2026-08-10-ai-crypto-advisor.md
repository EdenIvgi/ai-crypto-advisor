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
| M5 — Dashboard UI on mock data        | next   |
| M6 — Feedback voting                  | todo   |
| M7 — First deploy                     | todo   |
| M8 — Coin prices (CoinGecko)          | todo   |
| M9 — Market news (CryptoPanic)        | todo   |
| M10 — Crypto meme (Reddit)            | todo   |
| M11 — AI insight (OpenRouter)         | todo   |
| M12 — Polish and smoke test           | todo   |
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
- Create: `server/src/middleware/{loadCurrentUser,requireOnboarding}.js` (moved here from M4,
  because these are the first routes that use them)
- Create: `client/src/features/dashboard/{dashboardApi.js,DashboardPage.jsx}`
- Create: `client/src/features/dashboard/components/DashboardSectionCard.jsx`
- Create: `client/src/features/dashboard/sections/{CoinPricesSection,MarketNewsSection,AiInsightSection,CryptoMemeSection}.jsx`

**Interfaces:**

- Consumes: `requireAuth`, `loadCurrentUser`, `requireOnboarding` (M4).
- Produces: `GET /api/dashboard/{prices,news,insight,meme}`, each returning its section
  payload plus `isFallback`. **These response shapes are frozen here** — M8 to M11 swap the
  data source behind them without changing the contract.
  - prices: `{ coins: [{ id, symbol, name, priceUsd, change24hPercent }], isFallback }`
  - news: `{ articles: [{ id, title, url, source, publishedAt }], isFallback }`
  - insight: `{ insight: { id, text, date }, isFallback }`
  - meme: `{ meme: { id, title, imageUrl, sourceUrl }, isFallback }`

- [ ] **Step 1:** `mockDashboard.js` — realistic fixed data for all four sections, shaped
      exactly as the frozen contract above.
- [ ] **Step 2:** Dashboard controller and routes serving the mocks, filtered by the
      user's `watchedAssetIds` where that applies.
- [ ] **Step 3:** `DashboardSectionCard.jsx` — the shared shell: title, optional fallback
      badge, skeleton while loading, inline error with a retry button, and a slot for the
      vote buttons added in M6.
- [ ] **Step 4:** The four section components, each with its own `useQuery` so one failure
      cannot take down the others.
- [ ] **Step 5:** `DashboardPage.jsx` — a responsive grid rendering only the sections the
      user selected during onboarding. No placeholder card for a section they skipped.
- [ ] **Step 6:** Check both light and dark themes, and widths from 375px to 1440px.
- [ ] **Step 7:** Verify in a browser: the dashboard looks finished; deselecting a section
      in preferences removes it.
- [ ] **Step 8:** Lint, format, test, commit, open the PR.

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

- [ ] **Step 1:** `FeedbackVote.js` — `{ userId, sectionType, contentId, vote, votedOnDate }`
      with a unique compound index on `{ userId, sectionType, contentId }`.
- [ ] **Step 2:** `feedbackService.js` — `submitVote` as an upsert keyed by that index, so
      changing a vote updates the existing document instead of adding a second one.
- [ ] **Step 3:** Controller and routes with Zod validation on the body.
- [ ] **Step 4:** Write `server/src/tests/feedbackVote.test.js` (integration test #2 of the
      capped suite): vote up, vote down on the same content, assert exactly one document
      exists and it now reads `down`, then assert `GET /api/feedback/mine` returns it.
- [ ] **Step 5:** Run `npm test` — expect failure first, then pass.
- [ ] **Step 6:** `useFeedbackVote.js` — mutation with an optimistic update and rollback in
      `onError`.
- [ ] **Step 7:** `FeedbackVoteButtons.jsx` — two icon buttons, each with an `aria-label`,
      showing the current vote state.
- [ ] **Step 8:** Verify: a vote survives a page refresh; changing a vote does not create a
      duplicate in the database.
- [ ] **Step 9:** Lint, format, test, commit, open the PR.

---

### Task M7: First deploy

**Files:**

- Create: `render.yaml` (or the equivalent dashboard configuration), `client/vercel.json`
- Modify: `README.md` (deployed URLs), `client/.env.example`

- [ ] **Step 1:** MongoDB Atlas — allow `0.0.0.0/0` (Render's free tier has no static
      egress IP) and note the tradeoff in the README.
- [ ] **Step 2:** Render web service from `server/`, health check path `/api/health`,
      environment variables `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`,
      `CLIENT_ORIGIN` (the Vercel URL).
- [ ] **Step 3:** Vercel project from `client/`, environment variable
      `VITE_API_BASE_URL` set to the Render URL.
- [ ] **Step 4:** Set `CLIENT_ORIGIN` on Render to the final Vercel origin — exact, no
      trailing slash — and redeploy.
- [ ] **Step 5:** Run `npm run seed:demo` against the production database.
- [ ] **Step 6:** **Verify in a fresh incognito window on the public URL:** demo login
      works, the cookie is set with `SameSite=None; Secure`, a refresh keeps the session.
      This is the milestone's real purpose — cross-site cookies fail only in production.
- [ ] **Step 7:** Add a health ping on client load so a cold Render instance starts waking
      before the user submits anything.
- [ ] **Step 8:** Commit and open the PR.

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

- [ ] **Step 1:** `inMemoryCache.js` — a `Map` of `{ value, expiresAtMs }` with
      `getOrFetch`, keeping the last good value so it can be served stale on error.
- [ ] **Step 2:** Write `inMemoryCache.test.js` (the one unit test in the capped suite):
      returns the cached value inside the TTL, refetches after it expires.
- [ ] **Step 3:** `coinGeckoClient.js` — one request to
      `/coins/markets?vs_currency=usd&ids=<joined>`, never one request per coin. Parse the
      response with a Zod schema and map it to the frozen shape.
- [ ] **Step 4:** `pricesService.js` — 60-second TTL keyed by the sorted asset ids; on
      failure serve the stale value, else the M5 mock, with `isFallback: true`.
- [ ] **Step 5:** Point the prices endpoint at the service instead of the mock.
- [ ] **Step 6:** Verify: real prices for the selected assets; a second request within
      60 seconds does not hit CoinGecko; blocking the network still renders the section.
- [ ] **Step 7:** Lint, format, test, commit, open the PR, deploy.

---

### Task M9: Market news (CryptoPanic)

**Files:**

- Create: `server/src/clients/cryptoPanicClient.js`, `server/src/services/newsService.js`,
  `server/src/data/fallbackNews.json`
- Modify: `server/src/config/env.js` (optional `CRYPTOPANIC_API_KEY`), dashboard controller

- [ ] **Step 1:** Add `CRYPTOPANIC_API_KEY` as **optional** in the env schema. The app must
      run for anyone who clones the repository without a key.
- [ ] **Step 2:** `fallbackNews.json` — 12 to 15 real, hand-picked articles with working
      URLs, so the fallback does not look broken.
- [ ] **Step 3:** `cryptoPanicClient.js` — fetch posts filtered by the user's assets, Zod
      parse, map to the frozen shape.
- [ ] **Step 4:** `newsService.js` — 5-minute TTL; no key or any failure serves the
      fallback file with `isFallback: true`.
- [ ] **Step 5:** Show the fallback badge in `DashboardSectionCard` when `isFallback` is
      true, worded as information rather than an error.
- [ ] **Step 6:** Verify both paths: with the key unset the fallback renders with the
      badge; with the key set, live headlines appear.
- [ ] **Step 7:** Lint, format, test, commit, open the PR, deploy.

---

### Task M10: Crypto meme (Reddit)

**Files:**

- Create: `server/src/clients/redditMemeClient.js`, `server/src/services/memeService.js`,
  `server/src/data/fallbackMemes.json`
- Modify: dashboard controller

- [ ] **Step 1:** `redditMemeClient.js` — `GET r/cryptocurrencymemes/top.json?t=day&limit=25`
      with a descriptive `User-Agent`. Reddit returns 403 to default agents, and it also
      blocks many cloud IP ranges, which is exactly why the fallback below is not optional.
- [ ] **Step 2:** Keep only posts whose URL ends in `.jpg`, `.png`, or `.gif`.
- [ ] **Step 3:** `fallbackMemes.json` — 12 to 15 stable image URLs.
- [ ] **Step 4:** `memeService.js` — 30-minute TTL, and pick by day-of-year modulo the list
      length so the meme changes daily rather than randomly per request.
- [ ] **Step 5:** Verify: the section renders on Render (where Reddit may well be blocked)
      by falling back cleanly, and the image has meaningful alt text.
- [ ] **Step 6:** Lint, format, test, commit, open the PR, deploy.

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

- [ ] **Step 1:** `DailyAiInsight.js` — exactly `{ userId, insightDate, insightText }` with
      a unique compound index on `{ userId, insightDate }`. Nothing else: unused fields were
      deliberately cut.
- [ ] **Step 2:** `openRouterClient.js` — an ordered list of free model ids, tried in turn
      until one responds. Free model availability changes without notice, so a single
      hard-coded model is a liability.
- [ ] **Step 3:** Prompt built from the investor type, the watched assets, and today's real
      prices, asking for three or four sentences.
- [ ] **Step 4:** `aiInsightService.js` — look up today's document first and return it if
      present; otherwise generate, store, and return. One model call per user per day.
- [ ] **Step 5:** A deterministic templated insight built from live price data as the last
      resort, so the section is never empty even with no key and every model failing.
- [ ] **Step 6:** Verify: the first load calls the model, a reload serves from the database
      with no call, and exactly one document exists per user per day.
- [ ] **Step 7:** Lint, format, test, commit, open the PR, deploy.

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

- [ ] **Step 1:** README — what it is, a screenshot, the deployed URLs, the demo account
      credentials, local setup, an environment variable table, and a Mermaid architecture
      diagram.
- [ ] **Step 2:** README — a short "known tradeoffs" section: the Atlas `0.0.0.0/0` rule,
      Render cold starts, and the deliberately capped test suite with the reasoning.
- [ ] **Step 3:** `docs/feedback-model-proposal.md` (the assignment's bonus, design only):
      what the votes give you as implicit labels, the features available per event
      (`investorType`, `sectionType`, content source, time of day), a cold-start-safe
      ranking approach, how to evaluate it offline, and the fairness and feedback-loop
      risks of training on self-selected data.
- [ ] **Step 4:** Finish `docs/ai-collaboration.md` with an entry per milestone.
- [ ] **Step 5:** Create a read-only Atlas database user for the reviewers and document how
      to connect.
- [ ] **Step 6:** Final check: clone into an empty directory and follow the README start to
      finish, with nothing but what it says.
- [ ] **Step 7:** Commit, open the PR, and merge to `main`.

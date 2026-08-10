# Testing policy

Read this before writing, changing, or deleting a test.

**This suite is deliberately small.** The assignment is graded on UX, readable code, and
structure — not on coverage. Time spent chasing coverage is time not spent on the product.
Do not add tests beyond the list below without asking first.

## The whole suite

1. **Auth flow** (`server/src/tests/authFlow.test.js`) — Supertest + mongodb-memory-server.
   Register, log in, `GET /api/auth/me` with the cookie, `GET /api/auth/me` without it
   returns 401. One test covers the JWT, `requireAuth`, and the cookie together.

2. **Feedback voting** (`server/src/tests/feedbackVote.test.js`) — cast a vote, vote again on
   the same content and confirm it updates rather than duplicating, then read it back from
   `GET /api/feedback/mine`.

   Note what that does **not** cover: the upsert finds and updates the existing row whether or
   not the unique index exists, so those assertions stay green with the index removed. Two
   more carry it — a duplicate written straight to the model, which the database has to
   reject, and two votes cast concurrently, which have to leave one row behind. If you change
   this file, delete the index and check that something still fails.

3. _Optional, only if time allows_ — `requireOnboarding` blocks dashboard routes before the
   quiz is completed.

4. **Cache unit test** (`server/src/lib/inMemoryCache.test.js`) — returns a cached value
   inside the TTL, refetches after it expires.

5. **Smoke test** (`e2e/smoke.spec.js`, Playwright, written in M12) — one pass through
   demo login → dashboard renders → vote registers.

## How

- Real database behaviour comes from `mongodb-memory-server`. Never mock Mongoose — a mocked
  model would not have caught the index bug that test #2 exists to catch.
- External HTTP is stubbed at the **client module** boundary (`clients/*.js`), never deeper.
  Real network calls in tests are forbidden.
- Tests import `createApp()` from `app.js` directly. Nothing in the suite requires a running
  server or a real Atlas connection.
- Each test seeds the data it needs and cleans up after itself. No shared fixtures that make
  test order matter.

Manual verification carries the rest of the load, and that is intentional: each milestone
lists a browser-level check, and the deployed URL is exercised in an incognito window before
the project is called done.

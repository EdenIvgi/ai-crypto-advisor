# Building this with AI tooling

The assignment asks for a summary of how AI tools were used during development. This is that
summary, written as the project progressed rather than reconstructed afterwards.

**Tool:** Claude Code (Claude Fable 5) as the primary development environment.

## How the collaboration was structured

Three decisions shaped everything else.

**Planning happened before code, and in writing.** The task PDF was read first, then the
architecture, data model, API surface, and milestone order were designed and reviewed as a
written plan before a single file was created. The plan went through four rounds of revision
based on human review — the most consequential being a reordering of the milestones (see M0
below).

**Conventions were written down as machine-readable rules, not held in a chat.** `CLAUDE.md`
at the repository root is a short router: it maps "about to do X" to "read this file first."
The rules themselves live in focused files under `.claude/docs/` — git workflow, naming and
style, backend conventions, frontend conventions, testing policy. Each is short enough to be
read in full on demand, which is the point: the agent reads the naming rules before naming
things, and the git rules before committing, instead of carrying a large context that gets
stale. A `PreToolUse` hook enforces the git one by blocking the first history-changing git
command of each session until the workflow doc has been read.

**The human reviewed direction, not keystrokes.** Course corrections came at the plan level
and are recorded per milestone below.

## Journal

### M0 — Workspace setup

Planned the project end to end, then set up the repository, conventions, and tooling.

Four human course-corrections materially changed the plan:

1. **JavaScript instead of TypeScript.** Runtime validation with Zod at the system boundaries
   plus JSDoc on exported service functions covers what types would have given the reader,
   without a build step.

2. **Milestones reordered around risk of running out of time.** The original order built the
   four dashboard sections one after another — five consecutive milestones all touching the
   dashboard, which is exactly where a project like this stalls. The revised order builds the
   full product first with mock data (M5), deploys it publicly (M7), and only then replaces
   each mock with a real integration one at a time — prices, news, memes, and the LLM last,
   since it is the least predictable and has the strongest fallback. There is a working,
   deployable product from M5 onward.

3. **Test suite capped deliberately.** Two critical integration tests (auth flow, and voting
   including the revote-upsert path that proves the unique index), one cache unit test, one
   end-to-end smoke test. No coverage target. The reasoning is written into
   `.claude/docs/testing-policy.md` so it does not quietly drift upward.

4. **Scope trimmed.** The `DailyAiInsight` document was reduced to the three fields that are
   actually used, and the "extras beyond the requirements" list was cut from six items to
   three, keeping only Demo Mode, baseline security hardening, and an architecture diagram.

One idea came from the human and earned its place in the plan: a **"Try Demo Account"** button
that logs a reviewer into a seeded account with preferences and votes already in place. A
reviewer with five minutes should not have to register and fill in a quiz to see the product.

Two plugins from Anthropic's official marketplace were installed at project scope and are
declared in `.claude/settings.json`, so anyone who opens this repository gets the same
tooling: **superpowers** (structured planning, systematic debugging, red/green TDD,
subagent-driven development, and a branch-finishing workflow that matches the PR-per-milestone
rule) and **frontend-design** (used in M3 and M5, where "clean UX" is an explicit grading
criterion).

The `superpowers:writing-plans` methodology then produced
`docs/superpowers/plans/2026-08-10-ai-crypto-advisor.md`: every milestone as a task with its
exact file list, an interfaces block naming what it consumes and produces, and bite-sized
steps as checkboxes ticked as the work lands. That file is the working plan from M2 onward.

### M1 — Scaffold and middleware skeleton

The Express app is built by a `createApp()` factory that does not listen, so Supertest can
drive it in-process. The global middleware chain and its order were fixed here.

One planned piece was dropped after checking it: Express 5 forwards a rejected promise from a
handler to the error handler by itself, so the `asyncHandler` wrapper the plan called for was
dead weight. `.claude/docs/backend-conventions.md` was corrected to match rather than left
describing code that does not exist.

### M2 — Database and JWT auth

Two decisions here were about what _not_ to reveal. The JWT payload carries only the user id,
so everything else is loaded fresh per request and a week-old token can never carry stale
data. A wrong password and an unknown email return byte-identical 401s, and a test asserts the
equality, because distinguishing them tells an attacker which addresses have accounts.

Development runs with no configuration at all: with no `MONGODB_URI` the server starts an
in-memory MongoDB, with no `JWT_SECRET` it generates a random one per process, and both warn
loudly about what that costs. Production refuses to start without real values. A hardcoded
fallback secret would have been the easy version of this and a much worse one.

The human supplied a real Atlas cluster at the end of this milestone. The connection string
was never pasted into the conversation and never read by the agent: the agent wrote everything
_except_ the URI into `server/.env`, the human filled that line in, and a check script
confirmed the connection by reporting the host, database, and document counts without printing
the string.

### M3 — Frontend auth and Demo Mode

The visual identity was decided deliberately here rather than defaulting, since the dashboard
inherits it. IBM Plex Sans and Mono, bundled rather than pulled from a font CDN; an
indigo-violet primary chosen specifically to avoid the neon-green-on-black look that crypto
interfaces default to; and market up/down colours separated by lightness as well as hue so
they survive the common forms of colour blindness.

The signature device is a monospace eyebrow label. It earns its place by carrying real
information rather than decorating: on the dashboard each one will report where its section's
data came from, which is exactly what the `isFallback` flag needs a home for.

The sign-in page's ticker rail deliberately shows dashes instead of prices. There is no data
for a signed-out visitor, and inventing numbers on a sign-in screen is a small lie the rest of
the product would have to live up to.

### M4 — Onboarding quiz

The best thing to come out of this milestone was a bug that the verification found and a human
reviewer probably would not have.

Driving the finished quiz through a script, three rapid clicks on the asset step registered only
**one** selection. Each click handler computed the next array from the `answers` value captured
in its own render, so every click that landed before React re-rendered read the same stale
selection, and the last one overwrote the rest. Clicking at human speed hides it; a fast user on
a slow device would not. The fix was to update from the previous state through a shared
`toggleSelection` helper, and re-running the same no-pause script then recorded all three.

This is the argument for verifying by driving the real interface rather than by reading the
code. Nothing about the code looked wrong.

The twelve CoinGecko asset ids were checked against the live API instead of being typed from
memory, which was worth doing: several are not what the symbol suggests, including `ripple` for
XRP and `avalanche-2` for AVAX. A wrong id would not have failed here — it would have shown up
in M8 as a row that silently never appeared.

One planned step was deliberately not completed. `loadCurrentUser` and `requireOnboarding` were
written as the plan specified, then deleted before committing: no dashboard routes exist yet, so
merging them would have put middleware wired to nothing onto `main`. They moved to M5, and the
plan file records the move rather than quietly ticking the box.

### M5 — Dashboard on mock data

The milestone that turns four separate features into a product, built entirely against fixed
sample data. The reason for the order is scheduling rather than architecture, and it is
covered in `docs/decisions.md`; what it bought here was the freedom to design the graded
screen without a rate limit, an API key, or an outage anywhere in the loop.

Two decisions were changed while implementing, both away from what the plan said:

**The four services were written now instead of in M8 to M11.** The plan had the controller
read the mock file directly, and each integration milestone add its service and edit the
controller. That is four more edits to the same file, which is precisely the churn that
freezing the response contract was meant to prevent. `loadCoinPrices`, `loadMarketNews`,
`loadDailyInsight` and `loadDailyMeme` therefore exist already with mock bodies, and each
later milestone now replaces one function body and touches nothing else.

**The sections are laid out with flex bases rather than grid columns.** A grid assigns each
card a fixed track, so somebody who picked the AI insight but not the meme would get a
half-width card with a hole beside it. Giving the pair a basis and letting it grow means they
share a row when both are chosen and a lone one expands to fill it — every combination of the
four answers produces a layout that looks deliberate, with no conditional span logic to get
wrong.

The design continues what M3 set up rather than restarting it. The monospace eyebrow,
introduced there as the interface's signature, finally does the job it was designed for: each
one now reports where its section's data came from. Today every one of them reads "SAMPLE
PRICES" or "SAMPLE HEADLINES", because that is what is true — M8 to M11 change those strings
to real source names as each integration lands, and the fallback wording is already in place
for when a source is unavailable. The mock is disclosed in the interface rather than dressed
up as live data.

**A bug that only a real browser would have found, again.** The dashboard was verified with
measurements first — card geometry at 375, 768 and 1440 pixels, no horizontal overflow at any
of them, every colour token resolving correctly in dark mode. All of it passed. Then the same
page was opened in an actual Chrome window, and the date at the top of the briefing read
`יום שני, 10 באוגוסט` and the Bitcoin price read `118,432.50$`, with the currency symbol
trailing the number. `Intl` follows the browser's locale by default, and this browser is set
to Hebrew: a right-to-left date inside an English sentence, in a left-to-right label. Both
formatters are now pinned to the interface's own language, with the reasoning written at the
constant. Every automated check had been green — the machine has no opinion about a Hebrew
weekday in an English paragraph.

The one thing measurements could not settle is whether the screen looks finished, and that
was checked by eye in both themes.

### M6 — Feedback voting

The assignment's fourth requirement, and the one the bonus question is about: every section
gets a thumb, and the votes are stored as data a model could later learn from.

**A vote has to be able to say what it was about.** The M5 contracts had no identifier for the
content a section was showing, so there was nothing for a vote to point at. The choice was
between the client inventing an identity for content it did not produce, or the server naming
what it served. The server won: each section response now carries a `contentId`. Sections
showing a single item use its id; the two that show a list use the day, because the vote is
about that day's selection rather than about one headline. The M5 contract note was updated
rather than quietly widened — adding a field before any integration exists costs nothing, and
pretending it had always been there would have made the freeze meaningless.

**The test the plan asked for was a test that proved nothing.** The plan specified: vote up,
vote down on the same content, assert one document exists. That is the behaviour the feature
promises, and it is what the testing policy says proves the unique compound index works. It
does not. `findOneAndUpdate` with an upsert finds the existing row and updates it whether or
not any index exists — so the test was run again with the index commented out, and it stayed
green. A test that cannot fail is documentation with a passing badge.

Two assertions were added that do fail without the index: a duplicate written straight to the
model, which the database itself has to reject, and two votes fired at the same moment, which
have to leave exactly one row behind. Both were confirmed to fail with the index removed and
pass with it.

The second of those exposed something the plan had not considered. A real unique index means
a race between two clicks ends with one insert rejected — so the feature the index protects
would answer 500 on a double click. `submitVote` now catches that specific error code and
repeats itself, updating the row the winner just created. The constraint and the interface
agree instead of fighting.

**Verified against the real database, not only in memory.** After voting through the interface,
the Atlas collection was queried directly: the unique index is present, the changed vote is one
row rather than two, and two different people holding opposite opinions about the same meme are
two separate rows — which is the case a naive index on `contentId` alone would have broken.

One dead end worth recording, because it cost time and was not a bug: the sample meme stopped
rendering. The image was on disk, the production build contained it, and the file was
unchanged — but the running Vite process had been started before `client/public/` existed, and
Vite decides once at boot whether that directory is there. Restarting it fixed everything. The
lesson is the same one M4 and M5 taught: check what the running process actually believes
before you go looking for the bug in the code.

### M7 — First public deploy

The milestone exists because of one fact: the authentication stack cannot be tested locally.
Locally the client and the API are both `localhost`, and the cookie travels with `SameSite=lax`
and no `Secure`. In production they are two unrelated domains, and five things have to agree at
once — `SameSite=None`, `Secure`, `trust proxy` because the host terminates TLS at its own
edge, an exact-origin CORS allow-list, and `credentials: 'include'` on every request. Miss one
and nobody can sign in, in production and nowhere else.

The human raised a fair challenge before we started: nobody sees the URL until it is sent, so
why not finish the integrations first and deploy once? Two of the three original arguments did
not survive it. The reviewer-might-look argument was void, and the "wait until we know all the
environment variables" argument was backwards — both API keys are optional by design, so there
was nothing to wait for. What was left is the argument that actually decided it: **the deploy
is the only work in this project that can fail for reasons that cannot be fixed by editing a
file.** Everything else fails in ways a code change repairs. That kind of risk belongs early.

It failed twice, which is the entire point of having done it now.

**The build died at install** with `husky: not found` and exit 127. `NODE_ENV=production` makes
npm omit `devDependencies` — which is what we want, since it keeps vitest and
mongodb-memory-server off the server — but the root `prepare` script runs regardless. The fix
is one character sequence, `husky || exit 0`. The part worth recording is that it was not
pushed on reasoning: a clean clone was built under the same two conditions, failing at 127
before and passing after. The same run was used to check that `createApp()` still builds with
devDependencies absent, which is how you find out whether something needed at runtime is
sitting in the wrong dependency list.

**Then the app died at boot** on `CLIENT_ORIGIN: Invalid URL` — a Vercel domain copied from its
dashboard, which displays the host without a scheme. The failure took a minute to fix. What
took longer, and mattered more, was checking the other shapes somebody might paste into that
field. A trailing slash, a stray path and a copied-in leading space all **passed** validation.
Each of them would then have matched no `Origin` header at all, so the deploy would have gone
green and every signed-in request would have come back 401 with nothing anywhere saying why.
The noisy failure was the lucky one. That field now reduces anything parseable to its origin,
and rejects a missing scheme with the fix written into the message.

Verification was done from the outside first and the inside second: the actual `Set-Cookie`
header on the deployed API, confirming `HttpOnly; Secure; SameSite=None` rather than trusting
the code that writes it, then the CORS headers for the real client origin, then the deployed
bundle read back to confirm which API it had been compiled against. Only then the browser —
demo login from a session with no cookies, a hard reload of `/dashboard` as a deep link to
exercise the SPA rewrite and the session together, and a vote cast and found still there
afterwards.

### M8 — Live coin prices

The first mock replaced by a real source, and the milestone that tested whether M5's frozen
contract was worth the trouble. It was: `loadCoinPrices` kept its signature and its return
shape, so the controller, the endpoint, the query, the component and the vote all stayed
exactly as they were. One function body changed.

**The interesting design question was what a fallback is allowed to claim.** Prices resolve
from three places — a live CoinGecko response, the last one that worked, or the sample data
the dashboard was built against. The first draft labelled the fallback "Sample prices", which
is a lie whenever the fallback is a two-minute-old real quote. The label became "Saved prices",
because the only distinction a reader actually needs is the one it makes: these numbers are
what the market is quoting, or they are not.

**A test that only covers the easy half is the M6 mistake with a different name.** The plan
asked for two cases on the cache: it returns a cached value inside the TTL, and refetches
after. Both describe any cache ever written. Neither touches the behaviour this cache exists
for, which is handing back an expired value when the source refuses. Three cases were added
and the testing policy corrected to match.

The service was then driven through all four of its states by taking control of both the
network and the clock — cold cache with the source down, source reachable, source down while
the cache is fresh, and source down after the cache expires. The last one is the one worth
having: it confirmed that an expired cache serves the last real price rather than quietly
reverting to the sample. Only the second of those four can be produced by asking the live API
nicely.

Two smaller things the real response taught that the sample never would have. CoinGecko
returns assets in market-capitalisation order, not the order anyone chose them in, so the
service reorders them — a list that reshuffles itself relative to the quiz is harder to read.
And `price_change_percentage_24h` is nullable. It becomes zero rather than dropping the asset,
which meant the interface also had to stop painting exactly zero green: otherwise a flat day
and a missing figure both read as good news.

`COINGECKO_API_KEY` was added as optional, which the plan did not call for. The public tier
needs no key, but its allowance is counted per IP address and a free cloud host shares one
with strangers — so the key changes nothing about how the code runs and everything about how
often it is turned away. Optional in every environment, because a fresh clone has to run
without signing up for anything.

### Documentation audit

At the human's request, the repository was audited against the brief before continuing. The audit
found four gaps, all in documentation rather than code: no `README.md` at all, a collaboration
journal that stopped at M3, two undocumented dependency choices, and a deliberate deviation from
the brief's example content categories that nothing in the repository explained.

The README gap was a planning error worth naming. The plan scheduled it for the final milestone,
which meant a public repository sat for days with no explanation of what it was — the plan should
have created it at the first milestone and grown it. `docs/decisions.md` was added at the same
time, because "I told the human in conversation" is not documentation.

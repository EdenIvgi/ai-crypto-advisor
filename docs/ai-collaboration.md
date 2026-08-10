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

### Documentation audit

At the human's request, the repository was audited against the brief before continuing. The audit
found four gaps, all in documentation rather than code: no `README.md` at all, a collaboration
journal that stopped at M3, two undocumented dependency choices, and a deliberate deviation from
the brief's example content categories that nothing in the repository explained.

The README gap was a planning error worth naming. The plan scheduled it for the final milestone,
which meant a public repository sat for days with no explanation of what it was — the plan should
have created it at the first milestone and grown it. `docs/decisions.md` was added at the same
time, because "I told the human in conversation" is not documentation.

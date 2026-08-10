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

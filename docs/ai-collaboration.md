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

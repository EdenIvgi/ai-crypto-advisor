# Working with AI

The assignment asks for a summary of my interactions with AI tools. **Claude Code** was my
development environment for this whole project — planning, implementation, verification, and the
writing in `docs/`.

## How I set it up

**A written plan before any code.** We read the task first and designed the architecture, data
model, API surface and milestone order as a document I reviewed. It went through four rounds of
my review, the biggest being a reorder so the product deploys before the integrations.

**Conventions as files, not as chat.** `CLAUDE.md` is a router mapping "about to do X" to "read
this first", and the rules themselves live in short files under `.claude/docs/` — git workflow,
naming, backend, frontend, testing. They get read before the work rather than after, so they
don't decay across a long conversation. A `PreToolUse` hook blocks the first history-changing git
command of each session until the git doc has actually been read.

**One branch and one pull request per milestone**, with the plan file ticked as steps landed.
That gave me thirteen reviewable diffs instead of one large one at the end.

**I reviewed direction, not keystrokes** — the plan, the PRs, and the running product.

## Where my questions changed the build

This was the highest-value part of the collaboration, and the pattern is consistent: I ask why
something is needed, and it turns out it isn't.

- **"Is filtering the news by coin actually required?"** It wasn't. The requirement came from the
  implementation plan itself and had been treated as given for nine milestones. Filtering became
  ranking — and the same question exposed that the brief had never been read as text at all. It's
  a scanned PDF; everything so far had been built against a summary of it. `pdftotext` extracted
  it in one command, and it turned out to permit static fallbacks for two of the four sections.
- **"They don't hand out free CryptoPanic keys any more."** I found the discontinuation notice on
  their own site after we'd already built and committed against that API. Four publisher RSS
  feeds replaced it, which needs no key at all.
- **"Why deploy before the integrations are finished?"** Two of the three reasons didn't survive
  the question. The third did — a deploy is the only work here that can fail for reasons no file
  edit repairs — so it stayed at M7, and it failed twice, both times in ways no local test could
  have shown.
- **"The insight quotes percentages that are stale by the afternoon."** Regenerating it more
  often was proposed and was the wrong fix. Taking prices out of the prompt entirely was the
  right one, and it also solved a duplication problem three earlier rounds of prompt edits hadn't.
- **"Are you committing too readily?"** Two commits on `main` had cancelled each other out, and
  under a no-squash policy both are permanent. That's now a written rule in the git doc.

## What it caught that I wouldn't have

- **A stale-closure bug in the quiz.** Driving the finished flow by script with no pauses, three
  rapid clicks on the asset step registered one selection. Clicking at human speed hides it
  completely; a fast user on a slow device wouldn't be so lucky.
- **A test that couldn't fail.** The plan's voting test asserted one document after a revote,
  which `findOneAndUpdate` satisfies whether or not the unique index exists — it stayed green
  with the index commented out. Two assertions that genuinely fail without it replaced it, and
  that exposed a real bug: a race between two clicks would have answered 500.
- **Twelve CoinGecko asset ids checked against the live API** rather than typed from memory.
  Several aren't what the symbol suggests, and a wrong one wouldn't have failed until the row
  silently never appeared, three milestones later.
- **An insight built on sample prices while claiming to be live** — found by reading production
  data, not by any test.
- **A flaky suite fixed instead of tolerated.** `mongodb-memory-server` enforces its own ten
  second launch timeout, out of reach of vitest's, so whichever test file started first would
  fail. A suite that fails for unrelated reasons teaches people to re-run instead of to read.
- **A latent bug in shared middleware, found by checking before building on it.** The request
  validator's documented support for query parameters had never worked — Express 5 exposes
  `req.query` through a getter with no setter, so writing the parsed value back threw. No route
  had needed it, so nothing had ever failed. It was proven with a throwaway script rather than
  reasoned about, and the same script proved the fix.
- **An accessible name that was two things run together.** Each quiz option's name was computed
  from its title and the whole sentence explaining it — "Day TraderYou are in and out, and the
  charts matter today" — which is the name of nothing. Found by reading the accessibility tree
  rather than the markup.
- **A test that only passed because one section was slower than another.** The smoke test waited
  for the text "Bitcoin", which the headlines contain as well as the price row. It passed locally
  and broke the moment it ran against production, where the news had already arrived. It had been
  sabotage-verified when it was written, which proves a test can fail and not that it fails for the
  intended reason.
- **Two of the four sections can't be trained on.** Writing up the feedback-model bonus surfaced
  that a vote on the news or prices card is keyed to the day, so it records that the card missed
  without recording which headline caused it. The design changed as a result: log what was shown
  before building anything that learns from it.

## Where it was wrong, and how that showed up

- **It recommended deriving the price percentage ourselves.** The reasoning was sound and the
  conclusion was wrong; my own screenshots of CoinGecko showing two different figures for the
  same coin at the same moment killed it. The real answer — a different endpoint — only appeared
  because I asked a third time.
- **It wrote a requirement into the plan that nobody had asked for**, confidently and in detail,
  sourced from a summary of a document sitting unread in the repository. Neither the detail nor
  the confidence caught it; a question did.
- **The insight prompt caused the failure it forbade.** It banned inventing figures while also
  telling the model to care about network fees, which this app never supplies. Asking for
  attention to a number you don't provide is a request to make one up.

## What I'd carry forward

Automated checks were green for every one of the interface bugs above — a machine has no opinion
about a Hebrew weekday in an English paragraph, or about a joke that doesn't land because a line
stops forty pixels short. The tool was fastest at the work I could specify precisely, and needed
me most where the question was whether something should be built at all.

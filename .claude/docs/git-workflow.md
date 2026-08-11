# Git workflow

Read this before any `git` command, and before opening or merging a pull request.

## Branches

`main` is always deployable. **Never commit directly to `main`.** The one exception is the
M0 bootstrap commit, which necessarily creates the branch; from M1 onward every change
arrives through a pull request.

One branch per milestone, named `<type>/<milestone>-<slug>`:

```
feat/m2-jwt-auth
feat/m5-dashboard-mock-ui
fix/m8-coingecko-rate-limit
chore/m0-workspace-setup
docs/m13-readme
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`.

Start a milestone from an up-to-date `main`:

```bash
git switch main
git pull
git switch -c feat/m4-onboarding
```

## Commits

Conventional Commits, imperative mood, lowercase subject, no trailing period, ≤72 chars:

```
feat(auth): issue jwt cookie on register and login
fix(dashboard): keep section visible when coingecko times out
chore(server): add zod-validated env config
test(feedback): cover revote upsert path
docs(readme): add architecture diagram
```

Scopes in use: `auth`, `onboarding`, `dashboard`, `feedback`, `server`, `client`,
`deploy`, `readme`, `ci`.

Rules:

- One logical change per commit. If the subject needs an "and", split it.
- **Do not commit anything you expect to change before the PR opens.** Merges here are
  `--merge`, never squash, so every commit on a branch reaches `main` and stays there — a
  branch is not scratch space, and there is no later step that tidies it. Being blocked on a
  key, an answer, or a verification is not a reason to checkpoint; it means the unit of work
  is not finished yet. M9 shipped `cryptoPanicClient.js` added by one commit and deleted by
  the next, both permanent, because this rule was not written down.
- Never commit a broken state — `npm run lint && npm test` must pass first.
- **Format as its own step, then check it.** Run `npm run format`, then `npm run format:check`,
  and only then stage — never folded into the same command as the commit. CI runs `format:check`
  and it has failed twice here on markdown, because prettier is not reliably idempotent on
  indented continuation paragraphs: the run that rewrites a file is not evidence that the next
  check passes. One of those failures then cost two more commits to undo.
- Never commit `.env`, keys, tokens, or `node_modules`.
- Write the body only when the _why_ is not obvious from the subject. Wrap at 72.

## Pull requests

One PR per milestone, feature branch → `main`.

```bash
git push -u origin feat/m4-onboarding
gh pr create --fill --title "M4 — onboarding quiz" --body "..."
```

PR body: what the milestone delivers, how it was verified, anything deliberately left out.
Merge with a merge commit (`gh pr merge --merge`) so the milestone grouping stays visible
in the history. Do not squash — the individual commits are part of what a reviewer sees.

After merging:

```bash
git switch main && git pull && git branch -d feat/m4-onboarding
```

## Authorization

- Committing, pushing to a **feature branch**, and opening a PR: pre-authorized, just do it.
- Merging a milestone PR into `main` once CI is green: also pre-authorized. This is a
  single-author repository and the next milestone branches off `main`, so leaving a verified
  PR unmerged just blocks the next one. Merge it as the last step of the milestone.
- Force push, `reset --hard`, `clean -fd`, branch deletion on the remote, rewriting pushed
  history: never, unless the user explicitly asks in that message.

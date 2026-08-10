# Git workflow

Read this before any `git` command, and before opening or merging a pull request.

## Branches

`main` is always deployable. **Never commit directly to `main`.**

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
- Never commit a broken state — `npm run lint && npm test` must pass first.
- Never commit `.env`, keys, tokens, or `node_modules`.
- Write the body only when the *why* is not obvious from the subject. Wrap at 72.

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
- Merging a PR into `main`: ask first.
- Force push, `reset --hard`, `clean -fd`, branch deletion on the remote, rewriting pushed
  history: never, unless the user explicitly asks in that message.

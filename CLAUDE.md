# AI Crypto Advisor

Personalized crypto investor dashboard. Users sign up, answer a short onboarding quiz,
and get a daily dashboard with four sections (coin prices, market news, AI insight, meme)
tailored to their preferences. Every section can be voted on with thumbs up/down, and the
votes are stored as feedback data.

Home assignment for Moveo. Graded on **clean UX, readable code, and good structure**.

## Stack

JavaScript only — no TypeScript, anywhere.

- **client/** — React 19 + Vite, TailwindCSS + shadcn/ui, TanStack Query, react-router
- **server/** — Node 22 + Express (ES modules), JWT auth in an httpOnly cookie, Zod validation
- **database** — MongoDB Atlas + Mongoose
- **deploy** — Vercel (client), Render (server), Atlas (database)

## Commands

```bash
npm run dev          # both workspaces
npm run dev:client
npm run dev:server
npm run lint
npm test
```

## Convention router — read the matching file BEFORE you act

Each file is short and single-purpose. Read only the ones that match what you are about
to do, and read them **before** writing the code or running the command, not after.

| About to...                                                           | Read first                                                                   |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Commit, branch, push, or open a pull request                          | [.claude/docs/git-workflow.md](.claude/docs/git-workflow.md)                 |
| Name a variable, function, file, or component — or write any new code | [.claude/docs/naming-and-style.md](.claude/docs/naming-and-style.md)         |
| Add or change anything under `server/`                                | [.claude/docs/backend-conventions.md](.claude/docs/backend-conventions.md)   |
| Add or change anything under `client/`                                | [.claude/docs/frontend-conventions.md](.claude/docs/frontend-conventions.md) |
| Write, change, or delete a test                                       | [.claude/docs/testing-policy.md](.claude/docs/testing-policy.md)             |

Writing a new backend feature usually means reading two: `naming-and-style` and
`backend-conventions`.

## Working agreement

- The implementation plan lives at `C:\Users\edena\.claude\plans\idempotent-giggling-book.md`.
  Milestones M0–M13. One branch and one pull request per milestone.
- Never commit secrets. `.env` files stay local; `.env.example` documents the keys.

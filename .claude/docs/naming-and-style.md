# Naming and style

Read this before writing any new code. The single rule behind everything here: **a name
should describe the thing, so the reader never has to look somewhere else to understand it.**

## Language

JavaScript only, ES modules (`import`/`export`), Node 22 / modern browser targets.
No TypeScript, no `.ts` files, no build-time type checking. Runtime validation with Zod
covers the boundaries instead.

## Files

| Kind                   | Convention                   | Example                                    |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| Server module          | camelCase                    | `aiInsightService.js`, `requireAuth.js`    |
| React component / page | PascalCase                   | `LoginPage.jsx`, `FeedbackVoteButtons.jsx` |
| React hook             | camelCase, `use` prefix      | `useFeedbackVote.js`                       |
| Mongoose model         | PascalCase, singular         | `User.js`, `FeedbackVote.js`               |
| Test                   | mirrors subject + `.test.js` | `authFlow.test.js`                         |

Named exports only — no `export default`, including for React components. Named exports are
greppable and keep the imported name honest.

## Names

Write the whole word. `preferences`, not `prefs`. `response`, not `res` (except the Express
`res` parameter, which is idiomatic). `index`, not `idx`. The only acceptable single letter
is `i` in a tight numeric loop.

- **Booleans** start with `is` / `has` / `should` / `can`:
  `isFallback`, `hasCompletedOnboarding`, `shouldRefetchOnFocus`.
- **Functions** start with a verb: `buildInsightPrompt`, `mapArticleToDto`, `clearAuthCookie`.
- **Data fetchers** distinguish the source: `fetch*` crosses the network
  (`fetchCoinMarkets`), `load*` reads the database (`loadUserPreferences`), `get*` returns
  something already in memory or derived (`getTodayDateKey`).
- **Arrays** are plural: `watchedAssetIds`, `articles`. A single item is singular: `article`.
- **Event handlers** are `handle*` where defined, `on*` where passed as a prop:
  `<VoteButton onVote={handleVoteSubmitted} />`.
- **Module-level constants** that are fixed literals are SCREAMING_SNAKE_CASE:
  `COIN_PRICES_CACHE_TTL_MS`, `FREE_MODEL_IDS`.
- **Units belong in the name**: `cacheTtlMs`, `priceUsd`, `change24hPercent`.

Bad → good:

```
data          → coinMarketRows
res           → newsApiResponse
handleClick   → handleDemoLoginClicked
check(u)      → hasCompletedOnboarding(user)
tmp / arr     → filteredMemePosts
```

## Style

- Early returns over nested `if`. Guard clauses at the top of the function.
- One job per function. If it needs more than roughly 40 lines, it is doing two things.
- `const` by default, `let` only when reassigning, never `var`.
- `async`/`await` — no raw `.then()` chains.
- Destructure what you use: `const { email, password } = request.body`.
- Optional chaining and nullish coalescing over manual guards: `user?.preferences ?? null`.
- No magic numbers or strings in logic — lift them to a named constant at the top of the module.

## Comments

The code says _what_. A comment exists only to say something the code cannot: a non-obvious
constraint, an external quirk, a deliberate tradeoff.

```js
// Reddit returns 403 to default user agents, so this header is required, not cosmetic.
```

Do not comment what the next line does, do not leave commented-out code, and do not narrate
the change in a comment — that is what the commit message is for.

No JSDoc, and no block comments. If a line needs explaining, one `//` above it is the whole
budget, and most lines do not need it.

# Frontend conventions (`client/`)

Read this before adding or changing anything under `client/`.

## Structure

```
src/features/<feature>/     everything for one feature: pages, components, hooks, api module
src/components/ui/          shadcn/ui primitives — generated, not hand-edited
src/components/layout/      shell pieces shared across features (AppHeader, ProtectedRoute)
src/lib/                    apiClient, queryClient, small pure helpers
```

A component used by exactly one feature lives inside that feature. It moves to
`components/` only when a second feature imports it. Page components end in `Page`
(`DashboardPage.jsx`) and are the only components wired to a route.

## Server state

TanStack Query owns everything that comes from the server. **No `useEffect` + `fetch`, no
manual loading flags, no axios.** `useState` is for local UI state only — form drafts, which
onboarding step is open, whether a menu is expanded.

Every network call goes through `lib/apiClient.js` (which sets `credentials: 'include'` and
normalizes error responses), and is wrapped in a function inside the feature's `*Api.js`
module. Components import the hook, never `apiClient` directly.

Query keys are arrays, coarse to fine, matching the endpoint:

```text
['auth', 'me']
['dashboard', 'prices']
['feedback', 'mine']
```

Mutations invalidate the keys they affect. Voting uses an optimistic update with a rollback
in `onError` — the thumb should respond instantly.

## Every section handles four states

Loading, error, empty, and loaded. `DashboardSectionCard` provides the shell (title, skeleton,
error message, fallback badge) so each section only supplies its content. A section that
renders `undefined` while loading is a bug, not a shortcut.

Sections the user did not select during onboarding are not rendered at all — no empty
placeholder card.

## Styling

Tailwind utility classes in the markup. Reach for a shadcn component before writing a custom
one. Avoid arbitrary values (`w-[437px]`) unless there is no scale value that works. Both
light and dark themes must look deliberate — check both before calling a screen done.

Every interactive element needs an accessible name; icon-only buttons (the vote thumbs) need
an `aria-label`. The onboarding quiz must be completable with the keyboard alone.

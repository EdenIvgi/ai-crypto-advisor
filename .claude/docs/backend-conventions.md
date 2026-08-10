# Backend conventions (`server/`)

Read this before adding or changing anything under `server/`.

## Layering — never skip a layer

```
routes → controllers → services → models        (database)
                    ↘ services → clients        (external HTTP)
```

| Layer | Does | Never does |
| --- | --- | --- |
| `routes/` | Maps a path to a middleware chain and one controller. | Contains logic. |
| `controllers/` | Reads `req.userId` / `req.body` / `req.query`, calls **one** service, sends JSON. | Touches Mongoose, calls an external API, validates input, or catches errors. |
| `services/` | Business logic, caching, fallbacks, orchestration. | Touches `req` or `res`. A service is callable from a script or a test. |
| `models/` | Mongoose schemas and indexes only. | Business logic. |
| `clients/` | One external API each: build the request, parse the response, return plain objects. | Caching, fallbacks, or business decisions. |

A controller should read like four lines. If it is longer, the logic belongs in a service.

## Errors

Throw, never hand-roll a response:

```js
import { ConflictError } from '../lib/httpErrors.js'
if (existingUser) throw new ConflictError('Email is already registered')
```

`errorHandler.js` is the only place that turns an error into a response. Every async
controller is wrapped in `asyncHandler` so rejections reach it — no `try`/`catch` in
controllers. Use `try`/`catch` inside a service only when you are genuinely recovering
(falling back to cached or static data), never to swallow.

## Validation

All input validation goes through `validateRequest({ body, query, params })` with a Zod
schema, declared in the route file next to the handler. Controllers assume their input is
already valid. Zod schemas also validate `process.env` at boot and external API responses at
the client boundary — those three places are where untrusted data enters.

## Configuration

`config/env.js` is the only module that reads `process.env`. It validates on boot and exits
with a clear message listing what is missing. Everything else imports `env` from it.

## Auth

`services/authService.js` is the only module that imports `jsonwebtoken` or `bcrypt`, and the
only place cookie options are written. The JWT payload carries `userId` and nothing else —
everything else is loaded fresh from the database, so a stale token can never carry stale
data. `requireAuth` is the only middleware that knows the token lives in a cookie; controllers
just read `req.userId`.

## External APIs

Every dashboard service follows the same shape and returns the same envelope:

```js
{ /* section data */, isFallback: boolean }
```

1. Check the cache (`lib/inMemoryCache.js` for short-lived data, MongoDB for the daily AI insight).
2. Call the client.
3. On failure, serve stale cache if present, otherwise static fallback data from `data/`.
4. Never throw out of a dashboard service — a failing third party degrades one section,
   it does not break the dashboard.

## Testing hooks

`app.js` exports a `createApp()` factory and does not listen; `index.js` connects to the
database and starts the server. That split is what lets Supertest import the app directly.

import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectToDatabase } from './config/database.js'

// Connect before listening, so the first request can never arrive at a handler that has no
// database behind it.
await connectToDatabase()

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`AI Crypto Advisor API listening on http://localhost:${env.PORT}`)
  console.log(`Accepting browser requests from ${env.CLIENT_ORIGIN}`)
})

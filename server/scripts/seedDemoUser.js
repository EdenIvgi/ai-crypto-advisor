import mongoose from 'mongoose'

import { connectToDatabase } from '../src/config/database.js'
import { logInAsDemoUser } from '../src/services/authService.js'
import { DEMO_ACCOUNT } from '../src/data/demoAccount.js'

/**
 * Creates the demo account ahead of time. The "Try the demo" button creates it on first use
 * anyway, so this is for warming a fresh deployment — the first reviewer should not be the
 * one who pays for the account creation.
 *
 * Safe to run repeatedly: it reuses the account if it already exists.
 *
 * Run with: npm run seed:demo --workspace server
 */
await connectToDatabase()

const demoUser = await logInAsDemoUser()

console.log(`Demo account ready: ${demoUser.email}`)
console.log(`Onboarding complete: ${demoUser.hasCompletedOnboarding}`)
console.log(
  `Watching: ${DEMO_ACCOUNT.preferences.watchedAssets.map((asset) => asset.symbol).join(', ')}`
)

await mongoose.disconnect()

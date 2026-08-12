import mongoose from 'mongoose'

import { connectToDatabase } from '../src/config/database.js'
import { logInAsDemoUser } from '../src/services/authService.js'
import { DEMO_ACCOUNT } from '../src/data/demoAccount.js'

await connectToDatabase()

const demoUser = await logInAsDemoUser()

console.log(`Demo account ready: ${demoUser.email}`)
console.log(`Onboarding complete: ${demoUser.hasCompletedOnboarding}`)
console.log(
  `Watching: ${DEMO_ACCOUNT.preferences.watchedAssets.map((asset) => asset.symbol).join(', ')}`
)

await mongoose.disconnect()

import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let inMemoryServer

// `mongodb-memory-server` gives a launching mongod ten seconds by default, and enforces that
// itself — vitest's `hookTimeout` does not reach inside it. Ten is enough on an idle machine
// and not enough on a busy one, which made the suite fail on whichever file happened to start
// while a dev server was running, alternating between them run to run. This is a wait, not a
// retry: a fast machine never spends it.
const MONGOD_LAUNCH_TIMEOUT_MS = 60_000

export const startTestDatabase = async () => {
  inMemoryServer = await MongoMemoryServer.create({
    instance: { launchTimeout: MONGOD_LAUNCH_TIMEOUT_MS },
  })
  await mongoose.connect(inMemoryServer.getUri())
}

export const stopTestDatabase = async () => {
  await mongoose.disconnect()
  await inMemoryServer?.stop()
}

export const clearTestDatabase = async () => {
  const { collections } = mongoose.connection
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})))
}

import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

/**
 * A real MongoDB, in memory. Mocking Mongoose would defeat the purpose of these tests: the
 * behaviour worth covering — unique indexes, upserts, schema validation — lives in the
 * database, not in our code.
 */
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

/** Leaves each test with an empty database, so test order never matters. */
export const clearTestDatabase = async () => {
  const { collections } = mongoose.connection
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})))
}

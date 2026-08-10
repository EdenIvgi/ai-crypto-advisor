import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

/**
 * A real MongoDB, in memory. Mocking Mongoose would defeat the purpose of these tests: the
 * behaviour worth covering — unique indexes, upserts, schema validation — lives in the
 * database, not in our code.
 */
let inMemoryServer

export const startTestDatabase = async () => {
  inMemoryServer = await MongoMemoryServer.create()
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

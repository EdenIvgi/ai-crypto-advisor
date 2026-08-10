import mongoose from 'mongoose'

import { env, isProduction } from './env.js'

/**
 * Connects Mongoose, and in development falls back to an in-memory MongoDB when no
 * `MONGODB_URI` is set. That fallback is what lets someone clone this repository and run
 * `npm run dev` without first creating an Atlas account — it is loud about being temporary,
 * and production refuses to start without a real URI (see config/env.js).
 *
 * @returns {Promise<void>}
 */
export const connectToDatabase = async () => {
  const connectionUri = env.MONGODB_URI ?? (await startThrowawayDatabase())

  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(connectionUri)
    console.log(`Connected to MongoDB (${describeConnection(mongoose.connection)})`)
  } catch (connectionError) {
    console.error('Could not connect to MongoDB:', connectionError.message)
    process.exit(1)
  }
}

const startThrowawayDatabase = async () => {
  if (isProduction) throw new Error('MONGODB_URI is required in production')

  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const inMemoryServer = await MongoMemoryServer.create()

  console.warn(
    'MONGODB_URI is not set, so this process started a throwaway in-memory MongoDB. ' +
      'Everything you save will disappear when the server stops. ' +
      'Set MONGODB_URI in server/.env to use a real database.'
  )

  return inMemoryServer.getUri()
}

const describeConnection = (connection) =>
  connection.host ? `${connection.host}/${connection.name}` : connection.name

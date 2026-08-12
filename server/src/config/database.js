import mongoose from 'mongoose'

import { env, isProduction } from './env.js'

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

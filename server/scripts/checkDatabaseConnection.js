import mongoose from 'mongoose'

/**
 * Confirms the configured MongoDB is reachable and reports what is in it, without ever
 * printing the connection string — it carries the cluster password.
 *
 * Run with: npm run check:db --workspace server
 */
const connectionUri = process.env.MONGODB_URI

if (!connectionUri) {
  console.error('MONGODB_URI is not set. Add it to server/.env and run this again.')
  process.exit(1)
}

const describeUriSafely = (uri) => {
  try {
    const { protocol, hostname, pathname } = new URL(uri)
    const databaseName = pathname.replace('/', '') || '(none specified)'
    return `${protocol}//${hostname} · database: ${databaseName}`
  } catch {
    return '(could not parse the URI — check its format)'
  }
}

console.log(`Connecting to ${describeUriSafely(connectionUri)}`)

try {
  await mongoose.connect(connectionUri, { serverSelectionTimeoutMS: 10_000 })

  const collections = await mongoose.connection.db.listCollections().toArray()
  const userCount = await mongoose.connection.db.collection('users').countDocuments()

  console.log('Connected.')
  console.log(
    `Collections: ${collections.length === 0 ? '(none yet)' : collections.map((c) => c.name).join(', ')}`
  )
  console.log(`Users stored: ${userCount}`)
} catch (connectionError) {
  console.error(`Could not connect: ${connectionError.message}`)
  if (/timed out|ETIMEDOUT|ServerSelection/i.test(connectionError.message)) {
    console.error(
      'A timeout here usually means Atlas Network Access is not allowing this machine. ' +
        'Add your IP, or 0.0.0.0/0 for now, under Security → Network Access.'
    )
  }
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}

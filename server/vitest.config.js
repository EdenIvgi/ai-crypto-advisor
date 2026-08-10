import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Each suite owns an in-memory MongoDB, so running files in parallel would have them
    // fight over connection state on the shared Mongoose singleton.
    fileParallelism: false,
    // Spinning up mongodb-memory-server the first time includes downloading a binary.
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
})

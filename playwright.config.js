import { defineConfig, devices } from '@playwright/test'

const CLIENT_URL = 'http://localhost:5173'

/**
 * One smoke test, run against the real local stack rather than a mocked one — the whole point is
 * to exercise the parts the unit and integration tests cannot see: the cookie surviving a reload,
 * the router, and the browser's own keyboard behaviour.
 *
 * Deliberately not wired into `.github/workflows/ci.yml`. CI has no database and no seeded demo
 * account, and adding a 115 MB browser download to every pull request buys less than it costs on a
 * project this size. It runs from `npm run test:e2e`, and the testing policy says so.
 */
export default defineConfig({
  testDir: './e2e',
  // A single worker: the tests share one demo account, so running them at once would have them
  // voting on each other's content.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',

  use: {
    baseURL: CLIENT_URL,
    // Kept only for a failure, where the question is always "what did the page actually look
    // like" — and never for a pass, which would just fill the working tree.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npm run dev',
    url: CLIENT_URL,
    reuseExistingServer: true,
    // The API connects to Atlas before it listens, and a cold cluster is not instant.
    timeout: 120_000,
  },
})

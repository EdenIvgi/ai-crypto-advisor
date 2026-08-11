import { expect, test } from '@playwright/test'

/**
 * The one end-to-end test in a deliberately small suite, so it covers what nothing else can: the
 * session cookie surviving a reload, the router, and the browser's own keyboard behaviour.
 *
 * It runs against the shared demo account, so it puts everything back. The vote it casts is
 * withdrawn again at the end — which is not tidying bolted on afterwards but the second half of the
 * behaviour being tested, since a thumb has to be clearable as well as settable.
 */

const PRICES_THUMB_UP = 'Coin prices: useful'

const signInWithDemoAccount = async (page) => {
  await page.goto('/login')
  await page.getByRole('button', { name: /demo account/i }).click()

  await expect(page.getByRole('heading', { name: /Your briefing/ })).toBeVisible()
}

test('a reviewer can sign in, read every section, and vote', async ({ page }) => {
  await signInWithDemoAccount(page)

  // The demo account asks for all four, and each card's heading appears before its data does —
  // which is the point of the shell: a section that is still loading is still a section.
  for (const heading of [
    'Coin prices',
    'Insight of the day',
    'Meme of the day',
    'Market news',
  ]) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }

  // The thumbs need the content they are voting on, so wait for a price rather than for the card.
  // Matched on the ticker exactly, because "Bitcoin" also appears in the headlines this dashboard
  // renders — a locator that resolves to five elements the moment the news card lands, and passes
  // only while the news is still slower than the prices.
  await expect(page.getByText('BTC', { exact: true })).toBeVisible()

  const thumbUp = page.getByRole('button', { name: PRICES_THUMB_UP })

  // Left over from an interrupted run: clear it, so the assertions below mean what they say.
  if ((await thumbUp.getAttribute('aria-pressed')) === 'true') {
    await thumbUp.click()
    await expect(thumbUp).toHaveAttribute('aria-pressed', 'false')
  }

  await thumbUp.click()
  await expect(thumbUp).toHaveAttribute('aria-pressed', 'true')

  // The assertion the optimistic update could otherwise fake.
  await page.reload()
  await expect(page.getByRole('button', { name: PRICES_THUMB_UP })).toHaveAttribute(
    'aria-pressed',
    'true'
  )

  await page.getByRole('button', { name: PRICES_THUMB_UP }).click()
  await expect(page.getByRole('button', { name: PRICES_THUMB_UP })).toHaveAttribute(
    'aria-pressed',
    'false'
  )

  // And withdrawal has to survive a reload too, or the row is still in the database.
  await page.reload()
  await expect(page.getByRole('button', { name: PRICES_THUMB_UP })).toHaveAttribute(
    'aria-pressed',
    'false'
  )
})

test('the theme choice beats the system preference and survives a reload', async ({
  browser,
}) => {
  const darkSystemContext = await browser.newContext({ colorScheme: 'dark' })
  const page = await darkSystemContext.newPage()

  await signInWithDemoAccount(page)

  const html = page.locator('html')
  await expect(html).toHaveClass(/dark/)

  await page.getByRole('button', { name: 'Switch to the light theme' }).click()
  await expect(html).not.toHaveClass(/dark/)

  // The reader asked for light on a machine asking for dark, and that has to outlive the page.
  await page.reload()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(page.getByRole('button', { name: 'Switch to the dark theme' })).toBeVisible()

  await darkSystemContext.close()
})

test('a quiz answer can be changed with the keyboard alone', async ({ page }) => {
  await signInWithDemoAccount(page)

  await page.getByRole('link', { name: /Your preferences/ }).click()
  await expect(page.getByRole('heading', { name: 'Your preferences' })).toBeVisible()

  // Nothing here is saved, so the demo account is untouched either way.
  const unpickedAsset = page.getByRole('button', { name: 'Dogecoin' })
  await expect(unpickedAsset).toHaveAttribute('aria-pressed', 'false')

  // Reached by Tab rather than by `focus()`, so this covers the tab order as well.
  await unpickedAsset.focus()
  await expect(unpickedAsset).toBeFocused()

  await page.keyboard.press('Space')
  await expect(unpickedAsset).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('You have unsaved changes.')).toBeVisible()

  // Enter has to work as well: a native button answers to both, and a div dressed as one does not.
  await page.keyboard.press('Enter')
  await expect(unpickedAsset).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByText('Everything here is saved.')).toBeVisible()
})

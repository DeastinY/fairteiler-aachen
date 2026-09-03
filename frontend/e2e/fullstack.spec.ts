/**
 * Full-stack journey against the REAL backend (no API mocks): the page's
 * /api requests are proxied to a dedicated FastAPI instance with a fresh
 * in-memory database, spawned per test file.
 */
import { execFile, type ChildProcess } from 'node:child_process'
import { expect, test, type Page } from '@playwright/test'

// the SW would swallow /api GETs before page.route can proxy them
test.use({ serviceWorkers: 'block' })

const BACKEND_PORT = 8199
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`
let backend: ChildProcess

async function waitForHealth(timeoutMs = 15_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`)
      if (response.ok) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('backend did not become healthy')
}

test.beforeAll(async () => {
  backend = execFile('../backend/.venv/bin/python', ['run.py'], {
    cwd: '../backend',
    env: {
      ...process.env,
      FAIRTEILER_DB: 'sqlite://', // fresh in-memory DB, seeded on boot
      PORT: String(BACKEND_PORT),
    },
  })
  await waitForHealth()
})

test.afterAll(() => {
  backend?.kill()
})

async function proxyApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const response = await fetch(`${BACKEND_URL}${url.pathname}${url.search}`, {
      method: request.method(),
      headers: request.headers(),
      body: ['GET', 'HEAD'].includes(request.method())
        ? undefined
        : (request.postData() ?? undefined),
    })
    await route.fulfill({
      status: response.status,
      contentType: response.headers.get('content-type') ?? 'application/json',
      body: response.status === 204 ? '' : await response.text(),
    })
  })
  await page.route('https://sgx.geodatenzentrum.de/**', (route) => route.abort())
}

test('real journey: list → detail → report → status flips → undo → rate limit', async ({ page }) => {
  await proxyApi(page)
  await page.goto('/liste')
  const start = page.locator('[data-test="welcome-start"]')
  if (await start.isVisible().catch(() => false)) await start.click()

  // real seed: 11 fairteiler, none reported yet
  await expect(page.getByText('Fairteiler "BreitSeite"')).toBeVisible()
  await expect(page.getByText('Keine aktuelle Meldung').first()).toBeVisible()

  // open BreitSeite's detail via its card
  await page.getByText('Fairteiler "BreitSeite"').first().click()
  await expect(page).toHaveURL(/\/fairteiler\/810/)
  await expect(page.getByText('Öffnungszeiten').first()).toBeVisible() // curated hours exist

  // report: brought + a tag
  await page.getByRole('link', { name: /melden/i }).or(page.getByText('Jetzt melden')).first().click()
  await expect(page).toHaveURL(/\/melden/)
  await page.getByRole('radio', { name: 'Ich habe etwas gebracht' }).click()
  await page.getByRole('button', { name: 'Obst', exact: true }).click()
  await page.getByRole('button', { name: /Meldung senden/ }).click()

  // toast with undo appears; navigate back to the detail
  await expect(page.getByText(/Deine Meldung ist online/)).toBeVisible()
  await page.waitForURL(/\/fairteiler\/810/, { timeout: 5000 })

  // status flipped for real
  await expect(page.getByText('Etwas da').first()).toBeVisible()
  await expect(page.getByText('Obst').first()).toBeVisible()

  // own report row offers undo; take it back
  await page.getByRole('button', { name: /Zurücknehmen/ }).click()
  await expect(page.getByText(/zurückgenommen/)).toBeVisible()
  await expect(page.getByText('Keine aktuelle Meldung').first()).toBeVisible()

  // immediately reporting again is allowed after undo (rate limit resets by deletion)
  await page.getByText('Jetzt melden').first().click()
  await page.getByRole('radio', { name: 'Ich habe etwas gebracht' }).click()
  await page.getByRole('button', { name: /Meldung senden/ }).click()
  await expect(page.getByText(/Deine Meldung ist online/)).toBeVisible()

  // second immediate report on the same fairteiler hits the real rate limit
  await page.waitForURL(/\/fairteiler\/810/)
  await page.getByText('Jetzt melden').first().click()
  await page.getByRole('radio', { name: 'Der Fairteiler ist leer' }).click()
  await page.getByRole('button', { name: /Meldung senden/ }).click()
  await expect(page.getByText(/warte ein paar Minuten/)).toBeVisible()
})

test('real stats reflect real reports', async ({ page }) => {
  await proxyApi(page)
  await page.goto('/statistik')
  const start = page.locator('[data-test="welcome-start"]')
  if (await start.isVisible().catch(() => false)) await start.click()
  // the journey test left exactly one standing report (second brought)
  await expect(page.getByText(/11/).first()).toBeVisible()
})

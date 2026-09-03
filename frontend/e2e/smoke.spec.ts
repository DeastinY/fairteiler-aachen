import { expect, test, type Page } from '@playwright/test'

const FAIRTEILER = [
  {
    id: 810,
    name: 'Fairteiler "BreitSeite"',
    street: 'Kleinkölnstraße 18',
    postalCode: '52062',
    city: 'Aachen',
    lat: 50.777,
    lon: 6.0862,
    cooled: false,
    aroundTheClock: false,
    status: { state: 'etwas_da', lastReportAt: new Date().toISOString(), tags: ['obst'] },
    care: { needsCleaning: false, needsMaintenance: false },
    activity7d: [0, 1, 0, 2, 1, 0, 3],
  },
  {
    id: 1220,
    name: 'Fairteiler "Villa Kunterbund"',
    street: 'Rütscher Straße 195',
    postalCode: '52070',
    city: 'Aachen',
    lat: 50.7908,
    lon: 6.0711,
    cooled: true,
    aroundTheClock: true,
    status: { state: 'keine_meldung', lastReportAt: null, tags: [] },
    care: { needsCleaning: false, needsMaintenance: false },
    activity7d: [0, 0, 0, 0, 0, 0, 0],
  },
]

async function hermetic(page: Page) {
  // keep e2e offline-clean: no tile server, mocked API
  await page.route('https://sgx.geodatenzentrum.de/**', (route) => route.abort())
  await page.route('**/api/fairteiler', (route) =>
    route.fulfill({ json: FAIRTEILER }),
  )
  await page.route('**/api/fairteiler/*', (route) =>
    route.fulfill({
      json: { ...FAIRTEILER[0], description: 'Testbeschreibung', regionName: 'Aachen', picture: null, reports: [] },
    }),
  )
  await page.route('**/api/push/config', (route) =>
    route.fulfill({ json: { enabled: false, vapidPublicKey: null } }),
  )
}

test('welcome overlay sits above the map and dismisses cleanly', async ({ page }) => {
  await hermetic(page)
  await page.goto('/')
  const start = page.locator('[data-test="welcome-start"]')
  await expect(start).toBeVisible()

  // regression: Leaflet panes must not rise above the overlay or steal taps
  const topElementInsideOverlay = await page.evaluate(() => {
    const el = document.elementFromPoint(195, 200)
    return !!el?.closest('.welcome')
  })
  expect(topElementInsideOverlay).toBe(true)

  await start.click()
  await expect(start).toBeHidden()
  // page stays responsive (regression for the freeze)
  await expect
    .poll(() => page.evaluate(() => 1 + 1), { timeout: 3000 })
    .toBe(2)
})

test('map markers navigate to the detail view', async ({ page }) => {
  await hermetic(page)
  await page.goto('/')
  const start = page.locator('[data-test="welcome-start"]')
  if (await start.isVisible().catch(() => false)) await start.click()

  const markers = page.locator('path.leaflet-interactive')
  await expect(markers.first()).toBeAttached()
  await markers.first().click({ force: true })
  await expect(page).toHaveURL(/\/fairteiler\/\d+/)
})

// no request interception here: Playwright routing interferes with SW installs
test('service worker installs and controls the page', async ({ page }) => {
  await page.goto('/')
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const reg = await navigator.serviceWorker.getRegistration()
          return reg?.active?.state ?? 'none'
        }),
      { timeout: 15_000 },
    )
    .toBe('activated')
})

test('aktivitaet shows honest note when push is disabled, without hanging', async ({ page }) => {
  await hermetic(page)
  await page.goto('/aktivitaet')
  const start = page.locator('[data-test="welcome-start"]')
  if (await start.isVisible().catch(() => false)) await start.click()
  await expect(page.getByText('nicht aktiviert', { exact: false })).toBeVisible()
  await expect.poll(() => page.evaluate(() => 1 + 1)).toBe(2)
})

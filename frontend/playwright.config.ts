import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 },
    // the app's default/fallback language is German; i18n switching is
    // exercised explicitly in the welcome-overlay spec
    locale: 'de-DE',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
